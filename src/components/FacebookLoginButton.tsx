import FacebookLogin, {
  FailResponse,
  ProfileSuccessResponse,
  SuccessResponse,
} from '@greatsumini/react-facebook-login';
import { useEffect } from 'react';
import { FaFacebook } from 'react-icons/fa';
import { redirect, useFetcher } from 'react-router-dom';
import { toast } from 'react-toastify';
import appConfig from '../config/config';
import { appMessageKeys } from '../config/constant';
import { facebookLogin } from '../lib/api';
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
  const profile = formData.get('profile') as ProfileSuccessResponse;

  if (!profile) {
    return { error: new Error('Invalid profile') };
  }

  const user = await getUser(profile);
  if (!user) {
    return { error: new Error('Invalid user') };
  }

  const time = new Date().getTime();
  return redirect('/?msg=' + appMessageKeys.LOGIN_SUCCESS + '&t=' + time);
};

const getUser = async (
  profile: ProfileSuccessResponse
): Promise<IAuthenticatedUser | null> => {
  if (!profile) {
    return null;
  }

  try {
    const response = await facebookLogin(profile);
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

// https://medium.com/@syedmahmad/login-with-facebook-meta-in-react-app-88efb7a9fc0a
export default function FacebookLoginButton(): React.ReactElement {
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

  const onFacebookLoginFailed = (error: FailResponse | null) => {
    console.error('Login Failed!', error);
    toast('Login failed', {
      type: 'error',
      position: 'bottom-right',
    });
  };

  const onFacebookLoginSuccess = async (response: SuccessResponse | null) => {
    console.log('Login Success!', response);
  };

  const onFacebookProfileSuccess = async (
    response: ProfileSuccessResponse | null
  ) => {
    if (!response) {
      toast('Login failed', {
        type: 'error',
        position: 'bottom-right',
      });
      return;
    }

    const formData = new FormData();
    formData.append('profile', JSON.stringify(response));
    fetcher.submit(formData, { method: 'post', action: '/oauth/facebook' });
  };
  
  return isSubmitting ? (
    <LoadingSpinner label='Loading' isHorizontal={true} />
  ) : (
    <FacebookLogin
      appId={appConfig.facebookAppId}
      initParams={{
        version: 'v16.0',
      }}
      className='btn w-full bg-[#4267b2] hover:bg-[#3B5998] text-[#fff] text-md rounded-md'
      onSuccess={(response: SuccessResponse) => {
        onFacebookLoginSuccess(response);
      }}
      onFail={(error: FailResponse) => {
        onFacebookLoginFailed(error);
      }}
      onProfileSuccess={(response: ProfileSuccessResponse) => {
        onFacebookProfileSuccess(response);
      }}
    >
      <FaFacebook className='text-2xl' />
      <span>Continue with Facebook</span>
    </FacebookLogin>
  );
}
