const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('access_token');
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function encodeMessage(
  image: File,
  message: string,
  password: string
): Promise<{ blob: Blob; hash: string }> {
  const formData = new FormData();
  formData.append('imageInput', image);
  formData.append('messageInput', message);
  formData.append('passwordInput', password);

  const response = await fetch(`${API_BASE}/encode-message`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Encoding failed');
  }

  const blob = await response.blob();
  const hash = response.headers.get('X-Image-Hash') || '';
  return { blob, hash };
}

export async function decodeMessage(
  image: File,
  password: string
): Promise<{ decodedMessage?: string; message?: string }> {
  const formData = new FormData();
  formData.append('encodedImageInput', image);
  formData.append('passwordInput', password);

  const response = await fetch(`${API_BASE}/decode-message`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Decoding failed');
  }

  return response.json();
}

// ============= NEW HACKATHON FEATURES =============

export interface CapacityAnalysis {
  width: number;
  height: number;
  total_pixels: number;
  max_characters: number;
  max_words: number;
  encryption: string;
}

export async function analyzeCapacity(image: File): Promise<CapacityAnalysis> {
  const formData = new FormData();
  formData.append('image', image);

  const response = await fetch(`${API_BASE}/analyze-capacity`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to analyze image capacity');
  }

  return response.json();
}

export interface SteganalysisResult {
  verdict: string;
  confidence: string;
  score: number;
  max_score: number;
  analysis: {
    chi_square?: number;
    rs_score?: number;
    spa_score?: number;
    lsb_ratio: number;
    lsb_entropy: number;
    detected_payload_bytes?: number;
  };
  reasons: string[];
  methods_used: string[];
}

export async function detectSteganography(image: File): Promise<SteganalysisResult> {
  const formData = new FormData();
  formData.append('image', image);

  const response = await fetch(`${API_BASE}/detect-steganography`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to analyze image');
  }

  return response.json();
}

export interface ShareResponse {
  share_id: string;
  share_url: string;
  message: string;
}

export async function createShareLink(image: File): Promise<ShareResponse> {
  const formData = new FormData();
  formData.append('image', image);

  const response = await fetch(`${API_BASE}/share`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to create share link');
  }

  return response.json();
}

export interface SharedImage {
  share_id: string;
  image_base64: string;
  created_at: string;
  views: number;
}

export async function getSharedImage(shareId: string): Promise<SharedImage> {
  const response = await fetch(`${API_BASE}/share/${shareId}`);
  
  if (!response.ok) {
    throw new Error('Share link not found or expired');
  }

  return response.json();
}

export async function decodeSharedImage(
  shareId: string,
  password: string
): Promise<{ decodedMessage?: string; message?: string }> {
  const formData = new FormData();
  formData.append('password', password);

  const response = await fetch(`${API_BASE}/share/${shareId}/decode`, {
    method: 'POST',
    body: formData,
  });

  return response.json();
}

export interface HistogramData {
  width: number;
  height: number;
  histograms: {
    red: number[];
    green: number[];
    blue: number[];
    lsb: { zeros: number; ones: number };
  };
}

export async function getImageHistogram(image: File): Promise<HistogramData> {
  const formData = new FormData();
  formData.append('image', image);

  const response = await fetch(`${API_BASE}/image-histogram`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to get histogram');
  }

  return response.json();
}

// ============= CONVERSATION HISTORY =============

export interface ConversationItem {
  image_hash: string;
  created_at: string;
  encrypted_message: string;
  type: 'encode' | 'decode';
  status: string;
}

export async function getConversations(): Promise<ConversationItem[]> {
  const response = await fetch(`${API_BASE}/conversations`, {
    method: 'GET',
    headers: {
      ...authHeaders(),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch conversations');
  }

  const data = await response.json();
  return data.conversations || [];
}
