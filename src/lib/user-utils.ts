import { IAuthenticatedUser } from '../types/custom-types';
import { getUserFromIdToken } from './jwt.utils';
import { getSavedIdToken } from './storage';

export const isAdmin = (user: IAuthenticatedUser): boolean => {
  return user && user.role === 'ADMIN';
};

export const getCurrentUserFromStorage =
  async (): Promise<IAuthenticatedUser | null> => {
    const idToken = getSavedIdToken();
    const currentUser = idToken ? await getUserFromIdToken(idToken) : null;
    return currentUser;
  };
