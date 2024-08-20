console.log('process.env.VITE_BASE_URL', import.meta.env.VITE_BASE_URL);

const appConfig: {
  defaultRowsPerPage: number;
  baseUrl: string;
  homeRoute: string;
  publicRoutes: string[];
  protectedRoutes: string[];
  adminRoutes: string[];
  defaultProto: string;
  reCaptchaKey: string;
  idTokenPublicKeyAsBase64: string;
  domain: string;
  nodeEnv: string;
} = {
  defaultRowsPerPage: 5,
  baseUrl: import.meta.env.VITE_BASE_URL as string,
  homeRoute : '/',
  publicRoutes: ['/login', '/register', '/forgot-password', '/reset-password'],
  protectedRoutes: ['/profile', '/edit-profile', '/users', '/create-user'],
  adminRoutes: ['/users', '/create-user'],
  defaultProto: import.meta.env.NODE_ENV === 'production' ? 'https' : 'http',
  reCaptchaKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '',
  idTokenPublicKeyAsBase64: import.meta.env.VITE_ID_TOKEN_PUBLIC_KEY_AS_BASE64 as string,
  domain: import.meta.env.DOMAIN ?? '',
  nodeEnv: import.meta.env.NODE_ENV ?? '',
};

export default appConfig;
