import { getApps, initializeApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  type ConfirmationResult,
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.warn('Firebase client is missing required NEXT_PUBLIC_FIREBASE_* configuration.');
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Get the initial auth instance
const initialAuth = getAuth(app);

// In development mode, patch the auth instance with settings
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  try {
    const authObj = initialAuth as any;
    if (!authObj.settings) {
      authObj.settings = {};
    }
    authObj.settings.appVerificationDisabledForTesting = true;
    console.log('[Firebase] Development mode initialized with reCAPTCHA testing disabled');
  } catch (e) {
    console.warn('[Firebase] Could not initialize development settings:', e);
  }
}

export const auth = initialAuth;

const isDevelopment = process.env.NODE_ENV !== 'production';

// Custom mock RecaptchaVerifier for development that bypasses Firebase reCAPTCHA issues
class MockRecaptchaVerifier {
  private containerId: string;
  private callback: (() => void) | undefined;

  constructor(container: string | HTMLElement, options: any = {}, authInstance: any = null) {
    this.containerId = typeof container === 'string' ? container : container?.id || 'recaptcha-container';
    this.callback = options?.callback;
    
    console.log('[MockRecaptchaVerifier] Constructor called with container:', this.containerId);
    
    // Simulate render
    if (typeof container === 'string') {
      const elem = document.getElementById(container);
      if (elem) {
        elem.innerHTML = '<div style="padding: 10px; background: #f0f0f0; border-radius: 3px; font-size: 12px;">reCAPTCHA (Development Mode)</div>';
      }
    } else if (container instanceof HTMLElement) {
      container.innerHTML = '<div style="padding: 10px; background: #f0f0f0; border-radius: 3px; font-size: 12px;">reCAPTCHA (Development Mode)</div>';
    }
    
    console.log('[MockRecaptchaVerifier] Initialized in development mode');
  }

  verify() {
    // Simulate successful verification in development
    if (this.callback) {
      this.callback();
    }
    return Promise.resolve();
  }

  clear() {
    console.log('[MockRecaptchaVerifier] Cleared');
  }

  render() {
    return Promise.resolve(undefined);
  }

  getResponse() {
    // Return a fake token for development
    return 'dev-mode-token-' + Math.random().toString(36).substr(2, 9);
  }

  reset() {
    console.log('[MockRecaptchaVerifier] Reset');
  }

  _reset() {
    console.log('[MockRecaptchaVerifier] _reset called');
  }
}

class FakeConfirmationResult {
  private phoneNumber: string;

  constructor(phoneNumber: string) {
    this.phoneNumber = phoneNumber;
  }

  async confirm(code: string) {
    console.log('[Firebase] Development mode fake confirmation used for', this.phoneNumber, 'code:', code);
    return {
      user: {
        getIdToken: async () => {
          return `dev-token-${Math.random().toString(36).slice(2, 10)}`;
        },
      },
    };
  }
}

// Use mock in development, real RecaptchaVerifier in production
const RecaptchaVerifierClass = isDevelopment ? MockRecaptchaVerifier : RecaptchaVerifier;

export function getRecaptchaVerifier(containerId = 'recaptcha-container') {
  console.log('[Firebase] Using RecaptchaVerifier class:', RecaptchaVerifierClass === MockRecaptchaVerifier ? 'MockRecaptchaVerifier' : 'FirebaseRecaptchaVerifier');
  if (typeof window === 'undefined') return null;

  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Check your Firebase configuration.');
  }

  const containerElement = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!containerElement) {
    throw new Error(`reCAPTCHA container not found: ${containerId}`);
  }

  // Clear existing verifier
  const windowWithRecaptcha = window as unknown as { recaptchaVerifier?: unknown };
  const existing = windowWithRecaptcha.recaptchaVerifier;
  if (existing) {
    const existingVerifier = existing as { reset?: () => void; _reset?: () => void; clear?: () => void };
    if (typeof existingVerifier.reset === 'function') {
      try {
        existingVerifier.reset();
      } catch (resetError) {
        console.warn('Failed to reset existing reCAPTCHA verifier:', resetError);
      }
    }
    if (typeof existingVerifier._reset === 'function') {
      try {
        existingVerifier._reset();
      } catch (resetError) {
        console.warn('Failed to _reset existing reCAPTCHA verifier:', resetError);
      }
    }
    if (typeof existingVerifier.clear === 'function') {
      try {
        existingVerifier.clear();
      } catch (clearError) {
        console.warn('Failed to clear existing reCAPTCHA verifier:', clearError);
      }
    }
    delete windowWithRecaptcha.recaptchaVerifier;
  }

  // Create verifier using appropriate class
  const verifier = new (RecaptchaVerifierClass as any)(
    containerElement,
    {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA verified');
        if (process.env.NODE_ENV === 'development') {
          console.log('[Development] Using mock reCAPTCHA verification');
        }
      },
      'expired-callback': () => {
        console.warn('reCAPTCHA expired. Please try again.');
      },
    },
    auth
  );

  windowWithRecaptcha.recaptchaVerifier = verifier;
  return verifier;
}

export const storage = getStorage(app);

