import { AxiosError } from 'axios';
import React, { useEffect } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Form,
  Link,
  redirect,
  useActionData,
  useNavigation,
  useSubmit,
} from 'react-router-dom';
import { toast } from 'react-toastify';
import FormInput from '../components/FormInput';
import { appMessageKeys } from '../config/constant';
import { register, validateRecaptcha } from '../lib/api';
import { validatePassword } from '../lib/utils';
import { ValidationError } from '../types/custom-errors';

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
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const token = formData.get('token') as string;

  try {
    if (!email || !password || !name) {
      throw new ValidationError('Invalid form data', { name, email, password });
    }

    if (!token) {
      throw new ValidationError('Recaptcha token not found', {
        name,
        email,
        password,
      });
    }
    const isCaptchaValid = await validateRecaptcha(token);
    if (!isCaptchaValid) {
      throw new ValidationError('Captcha validation failed', {
        name,
        email,
        password,
      });
    }

    const { isValid: isPasswordValid, message } = validatePassword(password);
    if (!isPasswordValid) {
      throw new ValidationError(
        'Password must be at least 8 characters long, and contain at least 1 number, 1 uppercase letter, 1 lowercase letter, and 1 special character',
        {
          name,
          email,
          password,
        }
      );
    }

    const user = await register(email, password, name);
    if (!user) {
      throw new ValidationError('Invalid response', { name, email, password });
    }

    const time = new Date().getTime();
    return redirect(
      '/login?msg=' + appMessageKeys.REGISTER_SUCCESS + '&t=' + time
    );
  } catch (error) {
    // You cannot `useLoaderData` in an errorElemen
    console.error(error);
    let message = 'Unknown error';
    if (error instanceof AxiosError && error.response?.data.message) {
      message = error.response.data.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    return { error: new Error(message) };
  }
};

function SubmitButton({
  isValid,
  isLoading,
}: {
  isValid: boolean;
  isLoading: boolean;
}): React.ReactElement {
  const btn = <button className='btn btn-primary w-full'>Register</button>;
  const btnDisabled = (
    <button className='btn btn-disabled btn-primary w-full'>Register</button>
  );
  const btnLoading = (
    <button className='btn btn-disabled btn-primary w-full'>
      <span className='loading loading-spinner'></span>
      Register
    </button>
  );

  return !isValid ? btnDisabled : isLoading ? btnLoading : btn;
}

export default function Register(): React.ReactElement {
  const navigation = useNavigation();
  const response = useActionData() as {
    error: Error | undefined;
  };
  const submit = useSubmit();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const isLoading = navigation.state === 'submitting';

  useEffect(() => {
    if (response?.error) {
      toast(response.error?.message, {
        type: 'error',
        position: 'bottom-right',
      });
    }
  }, [response]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!executeRecaptcha) {
      toast('Recaptcha not loaded', {
        type: 'error',
        position: 'bottom-right',
      });
      return;
    }
    const token = await executeRecaptcha('onSubmit');
    const { email, password, name } = getValues();

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('name', name);
    formData.append('token', token);
    submit(formData, { method: 'post' });
  };

  const methods = useForm({
    mode: 'all',
  });

  const {
    getValues,
    formState: { isValid },
    watch,
  } = methods;

  const nameConstraints = {
    required: { value: true, message: 'Full Name is required' },
    minLength: {
      value: 5,
      message: 'Full Name is min 5 characters',
    },
  };
  const emailConstraints = {
    required: { value: true, message: 'Email is required' },
  };
  const passwordConstraints = {
    required: { value: true, message: 'Password is required' },
    minLength: {
      value: 8,
      message: 'Password is min 8 characters',
    },
    validate: (value: string): string | undefined => {
      const { isValid, message } = validatePassword(value);
      if (message) {
        return message; // 'Password must be at least 8 characters long, and contain at least 1 number, 1 uppercase letter, 1 lowercase letter, and 1 special character';
      }
    },
    // validate: {
    //   isMinLength: (value: string): string | undefined => {
    //     const rule = passwordRules.isMinLength;
    //     return rule.regex.test(value) ? undefined : rule.message;
    //   },
    //   hasNumber: (value: string): string | undefined => {
    //     const rule = passwordRules.hasNumber;
    //     return rule.regex.test(value) ? undefined : rule.message;
    //   },
    //   hasUppercaseCharacter: (value: string): string | undefined => {
    //     const rule = passwordRules.hasUppercaseCharacter;
    //     return rule.regex.test(value) ? undefined : rule.message;
    //   },
    //   hasLowercaseCharacter: (value: string): string | undefined => {
    //     const rule = passwordRules.hasLowercaseCharacter;
    //     return rule.regex.test(value) ? undefined : rule.message;
    //   },
    //   hasSpecialCharacter: (value: string): string | undefined => {
    //     const rule = passwordRules.hasSpecialCharacter;
    //     return rule.regex.test(value) ? undefined : rule.message;
    //   },
    // },
  };
  const passwordConfirmConstraints = {
    required: { value: true, message: 'Confirm Password is required' },
    validate: (value: string): string | undefined => {
      if (watch('password') !== value) {
        return 'Passwords do no match';
      }
    },
  };

  return (
    <section className='h-section w-full py-20 bg-slate-200'>
      <FormProvider {...methods}>
        <Form
          method='post'
          onSubmit={(event) => onSubmit(event)}
          id='register-form'
          className='mx-auto w-full max-w-md space-y-5 overflow-hidden rounded-2xl bg-slate-50 p-8 shadow-lg'
        >
          <h1 className='mb-4 text-center text-4xl font-[600]'>
            Register to MyApp!
          </h1>
          <FormInput
            label='Full Name'
            name='name'
            constraints={nameConstraints}
          />
          <FormInput
            label='Email'
            name='email'
            type='email'
            constraints={emailConstraints}
          />
          <FormInput
            label='Password'
            name='password'
            type='password'
            constraints={passwordConstraints}
          />
          <FormInput
            label='Confirm Password'
            name='passwordConfirm'
            type='password'
            constraints={passwordConfirmConstraints}
          />
          <span className='block'>
            Already have an account?{' '}
            <Link to='/login' className='text-secondary'>
              Login Here
            </Link>
          </span>
          <SubmitButton isValid={isValid} isLoading={isLoading} />
        </Form>
      </FormProvider>
    </section>
  );
}
