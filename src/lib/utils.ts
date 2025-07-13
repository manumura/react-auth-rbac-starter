import { redirect } from 'react-router-dom';

export const sleep = async (ms: number): Promise<void> => {
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
    message: 'Minimum 8 and maximum 70 characters long.',
  },
  hasNumber: {
    regex: /\d/,
    message: 'At least 1 number.',
  },
  hasLowercaseCharacter: {
    regex: /[a-z]/,
    message: 'At least 1 lowercase letter.',
  },
  hasUppercaseCharacter: {
    regex: /[A-Z]/,
    message: 'At least 1 uppercase letter.',
  },
  hasSpecialCharacter: {
    regex: /[^A-Za-z0-9]/,
    message: 'At least 1 special character.',
  },
};

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  let isValid: boolean = true;
  // @ts-expect-error - skip variable usage check for now
  for (const [name, rule] of Object.entries(passwordRules)) {
    const valid = rule.regex.test(password);
    if (!valid) {
      isValid = false;
      errors.push(rule.message);
    }
  }

  return { errors, isValid };
}
