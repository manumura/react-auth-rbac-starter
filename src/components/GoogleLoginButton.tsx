import { redirect, useFetcher } from 'react-router-dom';
import { googleLogin } from '../lib/api';
import { getUserFromIdToken } from '../lib/jwt.utils';
import { saveAuthentication } from '../lib/storage';
import { IUser } from '../types/custom-types';
import { appMessageKeys } from '../config/constant';
import { sleep } from '../lib/utils';
import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import { useEffect } from 'react';
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
  // TODO remove test
  await sleep(2000);

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

const getUser = async (token: string): Promise<IUser | null> => {
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
      toast('Logout failed', {
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
    <div className='flex justify-center w-full'>
      <LoadingSpinner label='Loading' isHorizontal={true} />
    </div>
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
