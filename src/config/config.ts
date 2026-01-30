// Runtime environment variables (injected by Docker at runtime)
declare global {
  interface Window {
    _env_?: {
      VITE_BASE_URL?: string;
      VITE_WEBSOCKET_BASE_URL?: string;
      VITE_RECAPTCHA_SITE_KEY?: string;
      VITE_ID_TOKEN_PUBLIC_KEY_AS_BASE64?: string;
      VITE_GOOGLE_CLIENT_ID?: string;
    };
  }
}

// Helper function to get environment variable with runtime fallback
const getEnvVar = (key: string): string => {
  // First check runtime config (Docker), then build-time config (Vite)
  const runtimeValue = window._env_?.[key as keyof typeof window._env_];
  // console.log(`Runtime env var ${key}:`, runtimeValue);
  // Check if runtime value exists and is not a placeholder (starts with $)
  if (runtimeValue && !runtimeValue.startsWith('${')) {
    return runtimeValue;
  }
  // Fallback to build-time environment variable
  return import.meta.env[key] as string ?? '';
};

const appConfig: {
  baseUrl: string;
  websocketBaseUrl: string;
  reCaptchaKey: string;
  idTokenPublicKeyAsBase64: string;
  googleClientId: string;
  defaultRowsPerPage: number;
  homeRoute: string;
  publicRoutes: string[];
  protectedRoutes: string[];
  adminRoutes: string[];
  domain: string;
  plausibleApiHost?: string;
} = {
  baseUrl: getEnvVar('VITE_BASE_URL'),
  websocketBaseUrl: getEnvVar('VITE_WEBSOCKET_BASE_URL'),
  reCaptchaKey: getEnvVar('VITE_RECAPTCHA_SITE_KEY'),
  idTokenPublicKeyAsBase64: getEnvVar('VITE_ID_TOKEN_PUBLIC_KEY_AS_BASE64'),
  googleClientId: getEnvVar('VITE_GOOGLE_CLIENT_ID'),
  defaultRowsPerPage: 5,
  homeRoute : '/',
  publicRoutes: ['/login', '/register', '/forgot-password', '/reset-password'],
  protectedRoutes: ['/profile', '/edit-profile', '/users', '/create-user'],
  adminRoutes: ['/users', '/create-user'],
  domain: 'manumura.com',
  plausibleApiHost: 'https://plausible.manumura.com',
};

export default appConfig;
