import { redirect } from 'react-router-dom';

export const sleep = async (ms: number): Promise<void> => {
  // return new Promise((resolve, reject) => setTimeout(resolve, ms));
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export function redirectToPathFrom(path: string, request: Request): Response {
  // Add / if path does not start with /
  const p = !path.startsWith('/') ? '/' + path : path;
  const params = new URLSearchParams();
  params.set('from', new URL(request.url).pathname);
  return redirect(p + '?' + params.toString());
}

export const passwordRules = {
  isLengthValid: {
    regex: /^.{8,70}$/,
    message: 'Password must be minimum 8 and maximum 70 characters long.',
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
   // @ts-expect-error - skip variable usage check for now
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
