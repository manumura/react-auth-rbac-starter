import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { useEffect } from 'react';
import { redirect, useFetcher } from 'react-router-dom';
import { toast } from 'react-toastify';
import { appMessageKeys } from '../config/constant';
import { googleLogin } from '../lib/api';
import { getUserFromIdToken } from '../lib/jwt.utils';
import { saveAuthentication } from '../lib/storage';
import { IAuthenticatedUser } from '../types/custom-types';
import LoadingSpinner from './LoadingSpinner';

export const action = async ({
  request,
}: {
  request: Request;
}): Promise<
  | Response
  | {
      error: Error | undefined;
    }
> => {
  const formData = await request.formData();
  const token = formData.get('token') as string;

  if (!token) {
    return { error: new Error('Invalid token') };
  }

  const user = await getUser(token);
  if (!user) {
    return { error: new Error('Invalid user') };
  }

  const time = new Date().getTime();
  return redirect('/?msg=' + appMessageKeys.LOGIN_SUCCESS + '&t=' + time);
};

const getUser = async (token: string): Promise<IAuthenticatedUser | null> => {
  if (!token) {
    return null;
  }

  try {
    const response = await googleLogin(token);
    if (!response) {
      return null;
    }

    const { accessToken, refreshToken, idToken } = response;
    if (!idToken || !accessToken || !refreshToken) {
      return null;
    }

    const user = await getUserFromIdToken(idToken);
    if (!user) {
      return null;
    }

    saveAuthentication(accessToken, refreshToken, idToken);
    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export default function GoogleLoginButton(): React.ReactElement {
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === 'submitting';
  const error = fetcher.data?.error;

  useEffect(() => {
    if (error) {
      toast('Login failed', {
        type: 'error',
        position: 'bottom-right',
      });
    }
  }, [error]);

  const onGoogleLoginFailed = () => {
    toast('Login failed', {
      type: 'error',
      position: 'bottom-right',
    });
  };

  const onGoogleLoginSuccess = async (
    credentialResponse: CredentialResponse | null
  ) => {
    if (!credentialResponse?.credential) {
      toast('Login failed', {
        type: 'error',
        position: 'bottom-right',
      });
      return;
    }

    const payload = { token: credentialResponse.credential };
    fetcher.submit(payload, { method: 'post', action: '/oauth/google' });
  };

  return isSubmitting ? (
    <LoadingSpinner label='Loading' isHorizontal={true} />
  ) : (
    <GoogleLogin
      theme='filled_blue'
      size='large'
      onSuccess={(credentialResponse) => {
        onGoogleLoginSuccess(credentialResponse);
      }}
      onError={() => {
        onGoogleLoginFailed();
      }}
    />
  );
}
