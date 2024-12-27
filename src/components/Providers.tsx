import { GoogleOAuthProvider } from '@react-oauth/google';
import React from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { ToastContainer } from 'react-toastify';

// To avoid tailwind to purge toastify styles
// import 'react-toastify/dist/ReactToastify.min.css';
import appConfig from '../config/config';

export function Providers({
  children,
}: {
  readonly children: React.ReactElement;
}) {
  // https://livefiredev.com/in-depth-guide-sign-in-with-google-in-a-react-js-application/
  return (
    <GoogleReCaptchaProvider reCaptchaKey={appConfig.reCaptchaKey}>
      <GoogleOAuthProvider clientId={appConfig.googleClientId}>
        {children}
        <ToastContainer />
      </GoogleOAuthProvider>
    </GoogleReCaptchaProvider>
  );
}
