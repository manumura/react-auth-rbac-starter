// Runtime environment configuration
// This file is processed by docker-entrypoint.sh at container startup
// Environment variables are injected using envsubst
globalThis._env_ = {
  VITE_BASE_URL: "${VITE_BASE_URL}",
  VITE_WEBSOCKET_BASE_URL: "${VITE_WEBSOCKET_BASE_URL}",
  VITE_RECAPTCHA_SITE_KEY: "${VITE_RECAPTCHA_SITE_KEY}",
  VITE_ID_TOKEN_PUBLIC_KEY_AS_BASE64: "${VITE_ID_TOKEN_PUBLIC_KEY_AS_BASE64}",
  VITE_GOOGLE_CLIENT_ID: "${VITE_GOOGLE_CLIENT_ID}",
};
