import * as jose from 'jose';
import appConfig from '../config/config';
import { appConstant } from '../config/constant';
import { IAuthenticatedUser } from '../types/custom-types';

if (!appConfig.idTokenPublicKeyAsBase64) {
  throw new Error('No idTokenPublicKeyAsBase64 found in appConfig');
}
const idTokenPublicKey = atob(appConfig.idTokenPublicKeyAsBase64);
    // : Buffer.from(appConfig.idTokenPublicKeyAsBase64, 'base64').toString(
    //     'utf8'
    //   );

export const getUserFromIdToken = async (
  idToken: string
): Promise<IAuthenticatedUser | null> => {
  if (!idToken) {
    console.error('No idToken found');
    return null;
  }

  try {
    const publicKey = await jose.importSPKI(idTokenPublicKey, appConstant.ALG);
    const { payload } = await jose.jwtVerify(idToken, publicKey);
    // const idToken = jose.decodeJwt(res.data.idToken) as IdTokenPayload;
    const user = payload?.user as IAuthenticatedUser;
    return user;
  } catch (error) {
    console.error('Error verifying idToken', error);
    return null;
  }
};
