import FacebookLogin, {
  FailResponse,
  ProfileSuccessResponse,
  SuccessResponse,
} from '@greatsumini/react-facebook-login';
import { FaFacebook } from 'react-icons/fa';
import { ActionFunction, redirect } from 'react-router-dom';
import appConfig from '../config/config';
import { appMessages } from '../config/constant';
import { facebookLogin } from '../lib/api';
import { getUserFromIdToken } from '../lib/jwt.utils';
import useMessageStore from '../lib/message-store';
import { saveAuthentication } from '../lib/storage';
import { IAuthenticatedUser } from '../types/custom-types';

export const action: ActionFunction<any> = async ({
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
  useMessageStore.getState().setMessage({
    type: appMessages.LOGIN_SUCCESS.type,
    text: appMessages.LOGIN_SUCCESS.text.replace("${name}", user.name),
    id: time,
  });
  return redirect('/');
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

    const { accessToken, accessTokenExpiresAt, refreshToken, idToken } =
      response;
    if (!idToken || !accessToken || !refreshToken) {
      return null;
    }

    const user = await getUserFromIdToken(idToken);
    if (!user) {
      return null;
    }

    saveAuthentication(
      accessToken,
      accessTokenExpiresAt,
      refreshToken,
      idToken
    );
    return user;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// https://medium.com/@syedmahmad/login-with-facebook-meta-in-react-app-88efb7a9fc0a
export default function FacebookLoginButton({
  onFacebookLoginFailed,
  onFacebookLoginSuccess,
  onFacebookProfileSuccess,
}: {
  readonly onFacebookLoginFailed: (error: FailResponse | null) => void;
  readonly onFacebookLoginSuccess: (response: SuccessResponse | null) => void;
  readonly onFacebookProfileSuccess: (
    response: ProfileSuccessResponse | null
  ) => void;
}): React.ReactElement {
  return (
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
