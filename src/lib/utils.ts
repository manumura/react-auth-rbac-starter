import { redirect } from 'react-router-dom';
import { IAuthenticatedUser, IUser } from '../types/custom-types';
import { getUserFromIdToken } from './jwt.utils';
import { getSavedIdToken } from './storage';

export const sleep = async (ms: number): Promise<void> => {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
};

export const isAdmin = (user: IUser): boolean => {
  return user && user.role === 'ADMIN';
};

export const getCurrentUserFromStorage =
  async (): Promise<IAuthenticatedUser | null> => {
    const idToken = getSavedIdToken();
    const currentUser = idToken ? await getUserFromIdToken(idToken) : null;
    return currentUser;
  };

export function redirectToPathFrom(path: string, request: Request): Response {
  // Add / if path does not start with /
  const p = !path.startsWith('/') ? '/' + path : path;
  const params = new URLSearchParams();
  params.set('from', new URL(request.url).pathname);
  return redirect(p + '?' + params.toString());
}

export const passwordRules = {
  isMinLength: {
    regex: /.{8,}/,
    message: 'Password must be at least 8 characters long.',
  },
  hasNumber: {
    regex: /\d/,
    message: 'Password must contain at least 1 number.',
  },
  hasLowercaseCharacter: {
    regex: /[a-z]/,
    message: 'Password must contain 1 lowercase letter.',
  },
  hasUppercaseCharacter: {
    regex: /[A-Z]/,
    message: 'Password must contain 1 uppercase letter.',
  },
  hasSpecialCharacter: {
    regex: /[^A-Za-z0-9]/,
    message: 'Password must contain 1 special character.',
  },
};

export function validatePassword(password: string): {
  isValid: boolean;
  message: string;
} {
  let message: string = '';
  let isValid: boolean = true;
  for (const [name, rule] of Object.entries(passwordRules)) {
    const valid = rule.regex.test(password);
    if (!valid) {
      isValid = false;
      message += rule.message + ' ';
    }
  }
  message = message.trim();

  return { message, isValid };
}
