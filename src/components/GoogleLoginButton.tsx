import { CredentialResponse, GoogleLogin } from '@react-oauth/google';
import { ActionFunction, redirect } from 'react-router-dom';
import { appMessageKeys } from '../config/constant';
import { googleLogin } from '../lib/api';
import { getUserFromIdToken } from '../lib/jwt.utils';
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

export default function GoogleLoginButton({
  onGoogleLoginSuccess,
  onGoogleLoginFailed,
}: {
  readonly onGoogleLoginSuccess: (
    credentialResponse: CredentialResponse | null
  ) => void;
  readonly onGoogleLoginFailed: () => void;
}): React.ReactElement {
  return (
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
