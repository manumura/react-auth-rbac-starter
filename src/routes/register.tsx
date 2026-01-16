import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';
import { AxiosError } from 'axios';
import React, { useEffect, useState } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { FormProvider, useForm } from 'react-hook-form';
import { IoEyeOffSharp, IoEyeSharp } from 'react-icons/io5';
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
import { appConstant, appMessages } from '../config/constant';
import { register, validateRecaptcha } from '../lib/api';
import useMessageStore from '../lib/message-store';
import { validatePassword } from '../lib/utils';
import { ValidationError } from '../types/custom-errors';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

// https://zxcvbn-ts.github.io/zxcvbn/guide/getting-started/
const options = {
  translations: zxcvbnEnPackage.translations,
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
};
zxcvbnOptions.setOptions(options);

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

    const { isValid: isPasswordValid, errors } = validatePassword(password);
    if (!isPasswordValid) {
      let message = '';
      if (errors.length > 0) {
        message = errors.join(' ');
      }
      throw new ValidationError(message || 'Password is invalid.', {
        name,
        email,
        password,
      });
    }

    const user = await register(email, password, name);
    if (!user) {
      throw new ValidationError('Invalid response', { name, email, password });
    }

    const time = Date.now();
    useMessageStore.getState().setMessage({
      type: appMessages.REGISTER_SUCCESS.type,
      text: appMessages.REGISTER_SUCCESS.text,
      id: time,
    });
    return redirect('/login');
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
  const [passwordScore, setPasswordScore] = useState(-1);

  const calculatePasswordScore = (password: string): number => {
    const res = zxcvbn(password);
    setPasswordScore(res.score);
    return res.score;
  };

  const iconEye = <IoEyeSharp size={24} className='cursor-pointer' />;
  const iconEyeOff = <IoEyeOffSharp size={24} className='cursor-pointer' />;
  const [type, setType] = useState('password');
  const [icon, setIcon] = useState(iconEyeOff);
  const onPasswordToggle = () => {
    if (type === 'password') {
      setIcon(iconEye);
      setType('text');
    } else {
      setIcon(iconEyeOff);
      setType('password');
    }
  };
  const [typeConfirm, setTypeConfirm] = useState('password');
  const [iconConfirm, setIconConfirm] = useState(iconEyeOff);
  const onPasswordConfirmToggle = () => {
    if (typeConfirm === 'password') {
      setIconConfirm(iconEye);
      setTypeConfirm('text');
    } else {
      setIconConfirm(iconEyeOff);
      setTypeConfirm('password');
    }
  };

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
    clearErrors,
    getValues,
    formState: { isValid, errors },
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
    pattern: {
      value: appConstant.EMAIL_VALIDATION_REGEX,
      message: 'Email is invalid',
    },
  };
  const passwordConstraints = {
    required: { value: true, message: 'Password is required' },
    // minLength: {
    //   value: 8,
    //   message: 'Password is min 8 characters',
    // },
    // maxLength: {
    //   value: 70,
    //   message: 'Password is max 70 characters',
    // },
    validate: (value: string): string | undefined => {
      calculatePasswordScore(value);
      const { isValid, errors } = validatePassword(value);
      if (!isValid) {
        let message = '';
        if (errors.length > 0) {
          message = errors.join('\n');
        }
        return message || 'Password is invalid';
      }
      if (watch('passwordConfirm') && watch('passwordConfirm') !== value) {
        return 'Passwords do no match';
      }
      clearErrors('passwordConfirm');
    },
  };
  const passwordConfirmConstraints = {
    required: { value: true, message: 'Confirm Password is required' },
    validate: (value: string): string | undefined => {
      if (watch('password') !== value) {
        return 'Passwords do no match';
      }
      if (errors.password?.message === 'Passwords do no match') {
        clearErrors('password');
      }
    },
  };

  return (
    <section className='h-section w-full py-20 bg-slate-200'>
      <FormProvider {...methods}>
        <Form
          // method='post'
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
            type={type}
            constraints={passwordConstraints}
            iconEnd={icon}
            onClickIconEnd={onPasswordToggle}
          />
          {passwordScore >= 0 && (
            <PasswordStrengthMeter passwordScore={passwordScore} />
          )}
          <FormInput
            label='Confirm Password'
            name='passwordConfirm'
            type={typeConfirm}
            constraints={passwordConfirmConstraints}
            iconEnd={iconConfirm}
            onClickIconEnd={onPasswordConfirmToggle}
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
