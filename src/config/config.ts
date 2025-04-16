const appConfig: {
  defaultRowsPerPage: number;
  baseUrl: string;
  websocketBaseUrl: string;
  homeRoute: string;
  publicRoutes: string[];
  protectedRoutes: string[];
  adminRoutes: string[];
  defaultProto: string;
  reCaptchaKey: string;
  idTokenPublicKeyAsBase64: string;
  googleClientId: string;
  facebookAppId: string;
  nodeEnv: string;
  domain: string;
  plausibleApiHost?: string;
} = {
  defaultRowsPerPage: 5,
  baseUrl: import.meta.env.VITE_BASE_URL as string,
  websocketBaseUrl: import.meta.env.VITE_WEBSOCKET_BASE_URL as string,
  homeRoute : '/',
  publicRoutes: ['/login', '/register', '/forgot-password', '/reset-password'],
  protectedRoutes: ['/profile', '/edit-profile', '/users', '/create-user'],
  adminRoutes: ['/users', '/create-user'],
  defaultProto: import.meta.env.NODE_ENV === 'production' ? 'https' : 'http',
  reCaptchaKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '',
  idTokenPublicKeyAsBase64: import.meta.env.VITE_ID_TOKEN_PUBLIC_KEY_AS_BASE64 as string,
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
  facebookAppId: import.meta.env.VITE_FACEBOOK_APP_ID as string,
  nodeEnv: import.meta.env.NODE_ENV ?? '',
  domain: 'manumura.com',
  plausibleApiHost: 'https://plausible.manumura.com',
};

export default appConfig;
