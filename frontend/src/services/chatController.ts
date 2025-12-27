export type Intent = 'encode' | 'decode' | 'help' | 'security' | 'greeting' | 'unknown';
export type FlowStep = 
  | 'idle'
  | 'encode_awaiting_image'
  | 'encode_awaiting_message'
  | 'encode_awaiting_password'
  | 'encode_processing'
  | 'decode_awaiting_image'
  | 'decode_awaiting_password'
  | 'decode_processing';

export interface ChatState {
  currentFlow: FlowStep;
  encodeImage: File | null;
  encodeMessage: string;
  encodePassword: string;
  decodeImage: File | null;
  decodePassword: string;
}

export function createInitialState(): ChatState {
  return {
    currentFlow: 'idle',
    encodeImage: null,
    encodeMessage: '',
    encodePassword: '',
    decodeImage: null,
    decodePassword: '',
  };
}

const ENCODE_PATTERNS = [
  /\b(encode|hide|embed|conceal|secure|encrypt|put|store|save)\b.*\b(message|secret|text|data)\b/i,
  /\b(hide|encode|embed|encrypt)\b/i,
  /\bsecret\s+message\b/i,
  /\bi\s+want\s+to\s+(hide|encode|secure|encrypt)\b/i,
];

const DECODE_PATTERNS = [
  /\b(decode|extract|reveal|decrypt|read|get|retrieve|find|uncover)\b.*\b(message|secret|text|hidden)\b/i,
  /\b(decode|extract|reveal|decrypt)\b/i,
  /\bhidden\s+message\b/i,
  /\bi\s+want\s+to\s+(decode|extract|reveal|decrypt)\b/i,
  /\bwhat('s| is)\s+(hidden|inside|in)\b/i,
];

const HELP_PATTERNS = [
  /\b(help|how|what|explain|tutorial|guide|instructions?)\b/i,
  /\bhow\s+(does|do|can|to)\b/i,
  /\bwhat\s+(is|are)\b/i,
];

const SECURITY_PATTERNS = [
  /\b(secure|security|safe|aes|encryption|steganography|png|lsb)\b/i,
  /\bhow\s+secure\b/i,
  /\bwhy\s+png\b/i,
  /\bis\s+(it|this)\s+safe\b/i,
];

const GREETING_PATTERNS = [
  /^(hi|hello|hey|yo|sup|greetings|howdy)\b/i,
  /\bgood\s+(morning|afternoon|evening|day)\b/i,
];

export function classifyIntent(text: string): Intent {
  const normalized = text.toLowerCase().trim();
  
  if (GREETING_PATTERNS.some(p => p.test(normalized))) return 'greeting';
  if (ENCODE_PATTERNS.some(p => p.test(normalized))) return 'encode';
  if (DECODE_PATTERNS.some(p => p.test(normalized))) return 'decode';
  if (SECURITY_PATTERNS.some(p => p.test(normalized))) return 'security';
  if (HELP_PATTERNS.some(p => p.test(normalized))) return 'help';
  
  return 'unknown';
}

export function isAffirmative(text: string): boolean {
  return /^(yes|yeah|yep|sure|ok|okay|y|yup|affirmative|absolutely|definitely|go ahead|proceed|do it)\b/i.test(text.trim());
}

export function isNegative(text: string): boolean {
  return /^(no|nope|nah|cancel|stop|never|quit|exit|back)\b/i.test(text.trim());
}

export function validatePassword(password: string): { valid: boolean; warning?: string } {
  if (password.length < 4) {
    return { valid: false, warning: 'Password must be at least 4 characters.' };
  }
  if (password.length < 8) {
    return { valid: true, warning: 'Tip: Longer passwords (8+ characters) are more secure!' };
  }
  return { valid: true };
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload a PNG or JPG image.' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'Image must be under 5MB.' };
  }
  return { valid: true };
}

const RESPONSES = {
  greeting: [
    "Hey! So you wanna hide some secrets? I gotchu. Just say 'encode' or 'decode' and we'll get started.",
    "Yo! Welcome to the secret message zone. Need to hide something or dig out a hidden message?",
    "Heyy, ready to do some sneaky stuff with images? Tell me if you wanna encode or decode!",
    "What's up! I help people hide messages in plain sight. Pretty cool right? Just lmk what you need.",
  ],
  help: `Alright so here's the deal:

**Encode** - I'll hide your secret message inside a normal-looking image. Nobody will know it's there (trust me).

**Decode** - Got an image with hidden stuff? I'll pull it out for you.

The tech nerd stuff: I use AES-256 encryption (same as banks lol) + steganography. Your message literally becomes invisible pixels.

Just type "encode" or "decode" to start!`,
  security: `Ok so you're curious about the security stuff? Nice, I respect that.

🔐 **AES-256** - Bank-level encryption. Like, the real deal.

🖼️ **LSB Steganography** - I hide data in the tiniest parts of pixels. Your eyes literally can't see the difference.

📁 **Why PNG?** - JPG compresses stuff and would mess up the hidden data. PNG keeps everything intact.

🔑 **Your password** - It generates a unique key. No password = no access. Period.

Basically even if someone intercepts your image, they just see... an image. The secret stays secret unless they have your password.`,
  unknown: "Hmm not sure what you mean there. Try 'encode' to hide a message, 'decode' to reveal one, or 'help' if you're lost!",
  encode_start: "Alright let's do this! First I need an image - just drop a PNG or JPG here (keep it under 5MB). This'll be your secret's new home.",
  encode_got_image: "Nice pic! Now what's the message you wanna hide in there?",
  encode_got_message: "Got it! Now pick a password - make it something you'll remember cuz you'll need it to decode later. Don't lose it!",
  encode_processing: "Hang on a sec...\n\n🔐 Encrypting your stuff...\n🖼️ Weaving it into the pixels...",
  encode_success: "Done! Your message is now invisible. Download the image and send it wherever - only someone with your password can see what's hidden.",
  decode_start: "Time to reveal some secrets! Drop the encoded image here. Heads up - PNG works best, JPG might've messed with the data.",
  decode_got_image: "Got it! Now gimme the password that was used when encoding.",
  decode_processing: "Let me dig through these pixels...\n\n🔍 Finding the hidden bits...\n🔓 Decrypting...",
  decode_success: "Found it! Here's what was hiding in there:",
  decode_fail: "Hmm couldn't get the message out. Could be:\n• Wrong password (double check??)\n• This image wasn't encoded by me\n• Someone edited/compressed it after encoding\n\nWanna try again?",
  cancel: "No worries, cancelled! What else you wanna do?",
};

export function getRandomGreeting(): string {
  return RESPONSES.greeting[Math.floor(Math.random() * RESPONSES.greeting.length)];
}

export function getResponse(key: keyof typeof RESPONSES): string {
  const response = RESPONSES[key];
  return Array.isArray(response) ? response[Math.floor(Math.random() * response.length)] : response;
}

export function processMessage(
  text: string,
  state: ChatState,
  hasFile?: File
): { response: string; newState: ChatState; action?: 'request_file' | 'encode' | 'decode' | 'download' } {
  const intent = classifyIntent(text);
  
  if (isNegative(text) && state.currentFlow !== 'idle') {
    return {
      response: getResponse('cancel'),
      newState: createInitialState(),
    };
  }

  switch (state.currentFlow) {
    case 'idle':
      if (intent === 'greeting') {
        return { response: getRandomGreeting(), newState: state };
      }
      if (intent === 'encode') {
        return {
          response: getResponse('encode_start'),
          newState: { ...state, currentFlow: 'encode_awaiting_image' },
          action: 'request_file',
        };
      }
      if (intent === 'decode') {
        return {
          response: getResponse('decode_start'),
          newState: { ...state, currentFlow: 'decode_awaiting_image' },
          action: 'request_file',
        };
      }
      if (intent === 'security') {
        return { response: getResponse('security'), newState: state };
      }
      if (intent === 'help') {
        return { response: getResponse('help'), newState: state };
      }
      return { response: getResponse('unknown'), newState: state };

    case 'encode_awaiting_image':
      if (hasFile) {
        const validation = validateImageFile(hasFile);
        if (!validation.valid) {
          return { response: validation.error!, newState: state, action: 'request_file' };
        }
        return {
          response: getResponse('encode_got_image'),
          newState: { ...state, currentFlow: 'encode_awaiting_message', encodeImage: hasFile },
        };
      }
      return { response: "I'm waiting for an image. Please upload a PNG or JPG file.", newState: state, action: 'request_file' };

    case 'encode_awaiting_message':
      if (text.trim().length < 1) {
        return { response: "Please enter a message to hide.", newState: state };
      }
      return {
        response: getResponse('encode_got_message'),
        newState: { ...state, currentFlow: 'encode_awaiting_password', encodeMessage: text },
      };

    case 'encode_awaiting_password':
      const encodeValidation = validatePassword(text);
      if (!encodeValidation.valid) {
        return { response: encodeValidation.warning!, newState: state };
      }
      const warningMsg = encodeValidation.warning ? `\n\n${encodeValidation.warning}` : '';
      return {
        response: getResponse('encode_processing') + warningMsg,
        newState: { ...state, currentFlow: 'encode_processing', encodePassword: text },
        action: 'encode',
      };

    case 'decode_awaiting_image':
      if (hasFile) {
        const validation = validateImageFile(hasFile);
        if (!validation.valid) {
          return { response: validation.error!, newState: state, action: 'request_file' };
        }
        return {
          response: getResponse('decode_got_image'),
          newState: { ...state, currentFlow: 'decode_awaiting_password', decodeImage: hasFile },
        };
      }
      return { response: "I'm waiting for the encoded image. Please upload it.", newState: state, action: 'request_file' };

    case 'decode_awaiting_password':
      const decodeValidation = validatePassword(text);
      if (!decodeValidation.valid) {
        return { response: decodeValidation.warning!, newState: state };
      }
      return {
        response: getResponse('decode_processing'),
        newState: { ...state, currentFlow: 'decode_processing', decodePassword: text },
        action: 'decode',
      };

    default:
      return { response: getResponse('unknown'), newState: state };
  }
}
