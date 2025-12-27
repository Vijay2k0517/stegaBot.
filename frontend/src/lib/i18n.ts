// Simple i18n system for StegaBot
// Supports: English, Hindi, Tamil

export type Language = 'en' | 'hi' | 'ta';

export const LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
];

export const translations = {
  en: {
    // Nav
    launchChat: 'Launch Chat',
    
    // Hero
    tagline: 'Hide Secrets in Plain Sight',
    heroTitle1: 'Your secrets,',
    heroTitle2: 'hiding in pixels.',
    heroDescription: "Ever wanted to send a secret message that nobody else can see? StegaBot lets you hide encrypted messages inside regular images. It looks totally normal to everyone else - only you and your recipient know what's really there.",
    startChat: 'Start Secure Chat',
    learnMore: 'Learn More',
    
    // Features
    feature1Title: 'Bank-Level Security',
    feature1Desc: "Same encryption that banks use. If it's good enough for your money, it's good enough for your secrets.",
    feature2Title: 'Actually Invisible',
    feature2Desc: 'The message hides in the image pixels themselves. Your eyes literally cannot tell the difference.',
    feature3Title: 'Super Easy to Use',
    feature3Desc: 'No tech degree needed. Just chat with the bot, upload your image, and boom - secret message hidden.',
    feature4Title: 'Detective Mode',
    feature4Desc: 'Curious if an image has hidden data? Our analyzer can sniff it out using some clever math tricks.',
    feature5Title: 'Easy Sharing',
    feature5Desc: 'Get a special link to share. Whoever you send it to can decode without making an account.',
    feature6Title: 'Size Check',
    feature6Desc: 'Before you encode, see exactly how much text your image can hold. No surprises.',
    
    // How it works
    howItWorks: "Dead Simple. Here's How.",
    step1: "Say 'encode' or 'decode' in the chat",
    step2: 'Drop in your image',
    step3: 'Type your secret + pick a password',
    step4: "Download & share. That's it!",
    
    // Footer
    footer: 'Made with ☕ and a healthy dose of paranoia. Keep your secrets safe out there.',
    
    // Login
    welcomeBack: 'Welcome Back',
    loginSubtitle: "Let's get you into the secret zone",
    email: 'Email',
    password: 'Password',
    letMeIn: 'Let me in',
    signMeUp: 'Sign me up',
    hangOn: 'Hang on...',
    createAccount: 'Create account',
    haveAccount: 'Have an account? Login',
    backHome: 'Back home',
    
    // Chat
    steganalysisLab: 'Steganalysis Lab',
    logout: 'Logout',
    typeMessage: 'Type a message...',
    uploadImage: 'Upload Image',
    
    // Analyze page
    analyzeTitle: 'Steganalysis Lab',
    analyzeSubtitle: 'Drop an image to scan for hidden messages',
    dropImage: 'Drop image here or click to browse',
    supports: 'Supports PNG, JPG up to 5MB',
    analyzing: 'Analyzing...',
    detection: 'Steganalysis Detection',
    capacity: 'Storage Capacity',
    histogram: 'LSB Histogram',
  },
  
  hi: {
    // Nav
    launchChat: 'चैट शुरू करें',
    
    // Hero
    tagline: 'रहस्य छुपाएं सबकी नज़रों से',
    heroTitle1: 'आपके राज़,',
    heroTitle2: 'पिक्सल में छुपे।',
    heroDescription: 'कभी ऐसा संदेश भेजना चाहते थे जो कोई और न देख सके? StegaBot आपको साधारण तस्वीरों में एन्क्रिप्टेड संदेश छुपाने देता है। बाकी सबको यह एक सामान्य तस्वीर लगती है।',
    startChat: 'सुरक्षित चैट शुरू करें',
    learnMore: 'और जानें',
    
    // Features
    feature1Title: 'बैंक-स्तर की सुरक्षा',
    feature1Desc: 'वही एन्क्रिप्शन जो बैंक इस्तेमाल करते हैं। आपके पैसों के लिए अच्छा है, तो आपके रहस्यों के लिए भी।',
    feature2Title: 'बिल्कुल अदृश्य',
    feature2Desc: 'संदेश तस्वीर के पिक्सल में ही छुप जाता है। आपकी आंखें सच में फर्क नहीं बता सकतीं।',
    feature3Title: 'बेहद आसान',
    feature3Desc: 'तकनीकी ज्ञान की जरूरत नहीं। बस बॉट से बात करें, तस्वीर अपलोड करें, और बस!',
    feature4Title: 'डिटेक्टिव मोड',
    feature4Desc: 'जानना है कि किसी तस्वीर में छुपा डेटा है? हमारा एनालाइज़र इसे खोज निकालता है।',
    feature5Title: 'आसान शेयरिंग',
    feature5Desc: 'एक खास लिंक पाएं। जिसे भेजेंगे वो बिना अकाउंट बनाए डीकोड कर सकता है।',
    feature6Title: 'साइज़ चेक',
    feature6Desc: 'एनकोड करने से पहले जानें कि आपकी तस्वीर में कितना टेक्स्ट आ सकता है।',
    
    // How it works
    howItWorks: 'बिल्कुल आसान। देखिए कैसे।',
    step1: "चैट में 'encode' या 'decode' बोलें",
    step2: 'अपनी तस्वीर डालें',
    step3: 'अपना राज़ + पासवर्ड टाइप करें',
    step4: 'डाउनलोड करें और शेयर करें। बस!',
    
    // Footer
    footer: '☕ और थोड़ी सावधानी से बनाया। अपने राज़ सुरक्षित रखें।',
    
    // Login
    welcomeBack: 'वापस स्वागत है',
    loginSubtitle: 'चलिए आपको अंदर ले चलते हैं',
    email: 'ईमेल',
    password: 'पासवर्ड',
    letMeIn: 'अंदर आने दो',
    signMeUp: 'साइन अप करो',
    hangOn: 'रुको...',
    createAccount: 'अकाउंट बनाएं',
    haveAccount: 'अकाउंट है? लॉगिन करें',
    backHome: 'होम पर जाएं',
    
    // Chat
    steganalysisLab: 'स्टेगनालिसिस लैब',
    logout: 'लॉगआउट',
    typeMessage: 'मैसेज लिखें...',
    uploadImage: 'तस्वीर अपलोड करें',
    
    // Analyze page
    analyzeTitle: 'स्टेगनालिसिस लैब',
    analyzeSubtitle: 'छुपे संदेश खोजने के लिए तस्वीर डालें',
    dropImage: 'तस्वीर यहां डालें या ब्राउज़ करें',
    supports: 'PNG, JPG 5MB तक',
    analyzing: 'जांच हो रही है...',
    detection: 'स्टेगनालिसिस डिटेक्शन',
    capacity: 'स्टोरेज क्षमता',
    histogram: 'LSB हिस्टोग्राम',
  },
  
  ta: {
    // Nav
    launchChat: 'அரட்டை தொடங்கு',
    
    // Hero
    tagline: 'ரகசியங்களை கண்முன்னே மறை',
    heroTitle1: 'உங்கள் ரகசியங்கள்,',
    heroTitle2: 'பிக்சல்களில் மறைந்து.',
    heroDescription: 'யாரும் பார்க்க முடியாத ரகசிய செய்தி அனுப்ப நினைத்தீர்களா? StegaBot சாதாரண படங்களில் என்க்ரிப்ட் செய்த செய்திகளை மறைக்க உதவுகிறது.',
    startChat: 'பாதுகாப்பான அரட்டை',
    learnMore: 'மேலும் அறிக',
    
    // Features
    feature1Title: 'வங்கி-நிலை பாதுகாப்பு',
    feature1Desc: 'வங்கிகள் பயன்படுத்தும் அதே என்க்ரிப்ஷன். உங்கள் பணத்துக்கு நல்லது என்றால், ரகசியங்களுக்கும் நல்லது.',
    feature2Title: 'முற்றிலும் கண்ணுக்கு தெரியாது',
    feature2Desc: 'செய்தி படத்தின் பிக்சல்களிலேயே மறைகிறது. உங்கள் கண்களால் வேறுபாடு காண இயலாது.',
    feature3Title: 'மிக எளிது',
    feature3Desc: 'தொழில்நுட்ப அறிவு தேவையில்லை. போட்டுடன் பேசுங்கள், படம் பதிவேற்றுங்கள், முடிந்தது!',
    feature4Title: 'துப்பறியும் பயன்முறை',
    feature4Desc: 'ஒரு படத்தில் மறைந்த தரவு உள்ளதா என்று தெரிய வேண்டுமா? எங்கள் பகுப்பாய்வி கண்டுபிடிக்கும்.',
    feature5Title: 'எளிய பகிர்வு',
    feature5Desc: 'சிறப்பு இணைப்பு பெறுங்கள். பெறுநர் கணக்கு இல்லாமலே டீகோட் செய்யலாம்.',
    feature6Title: 'அளவு சோதனை',
    feature6Desc: 'என்கோட் செய்வதற்கு முன், உங்கள் படத்தில் எவ்வளவு உரை பொருந்தும் என்று பாருங்கள்.',
    
    // How it works
    howItWorks: 'மிக எளிது. இதோ எப்படி.',
    step1: "அரட்டையில் 'encode' அல்லது 'decode' சொல்லுங்கள்",
    step2: 'உங்கள் படத்தை போடுங்கள்',
    step3: 'ரகசியம் + கடவுச்சொல் தட்டச்சு செய்யுங்கள்',
    step4: 'பதிவிறக்கி பகிருங்கள். அவ்வளவுதான்!',
    
    // Footer
    footer: '☕ உடன் உருவாக்கப்பட்டது. உங்கள் ரகசியங்களை பாதுகாப்பாக வைத்திருங்கள்.',
    
    // Login
    welcomeBack: 'மீண்டும் வரவேற்கிறோம்',
    loginSubtitle: 'உள்ளே அழைத்துச் செல்கிறோம்',
    email: 'மின்னஞ்சல்',
    password: 'கடவுச்சொல்',
    letMeIn: 'உள்ளே விடு',
    signMeUp: 'பதிவு செய்',
    hangOn: 'காத்திருங்கள்...',
    createAccount: 'கணக்கு உருவாக்கு',
    haveAccount: 'கணக்கு உள்ளதா? உள்நுழைக',
    backHome: 'முகப்புக்கு',
    
    // Chat
    steganalysisLab: 'ஸ்டெகனாலிசிஸ் லேப்',
    logout: 'வெளியேறு',
    typeMessage: 'செய்தி தட்டச்சு செய்க...',
    uploadImage: 'படம் பதிவேற்று',
    
    // Analyze page
    analyzeTitle: 'ஸ்டெகனாலிசிஸ் லேப்',
    analyzeSubtitle: 'மறைந்த செய்திகளை தேட படம் போடுங்கள்',
    dropImage: 'படத்தை இங்கே போடுங்கள்',
    supports: 'PNG, JPG 5MB வரை',
    analyzing: 'பகுப்பாய்வு...',
    detection: 'ஸ்டெகனாலிசிஸ் கண்டறிதல்',
    capacity: 'சேமிப்பு திறன்',
    histogram: 'LSB ஹிஸ்டோகிராம்',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const stored = sessionStorage.getItem('language');
  if (stored && ['en', 'hi', 'ta'].includes(stored)) {
    return stored as Language;
  }
  return 'en';
}

export function setStoredLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem('language', lang);
}

export function t(key: TranslationKey, lang: Language = 'en'): string {
  return translations[lang][key] || translations.en[key] || key;
}
