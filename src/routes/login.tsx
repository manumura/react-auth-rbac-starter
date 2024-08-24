import { AxiosError } from 'axios';
import { useEffect } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Form,
  Link,
  useActionData,
  useNavigate,
  useNavigation,
  useRouteError,
  useSubmit,
} from 'react-router-dom';
import { toast } from 'react-toastify';
import FormInput from '../components/FormInput';
import { login, validateRecaptcha } from '../lib/api';
import { getUserFromIdToken } from '../lib/jwt.utils';
import { saveAuthentication } from '../lib/storage';
import useUserStore from '../lib/user-store';
import { IUser } from '../types/custom-types';
import { ValidationError } from '../types/custom-errors';

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const token = formData.get('token') as string;

  try {
    if (!token) {
      throw new ValidationError('Recaptcha token not found', {
        email,
        password,
      });
    }

    const isCaptchaValid = await validateRecaptcha(token);
    if (!isCaptchaValid) {
      throw new ValidationError('Captcha validation failed', {
        email,
        password,
      });
    }

    const response = await login(email, password);
    if (!response) {
      throw new ValidationError('Invalid response', { email, password });
    }

    const { accessToken, refreshToken, idToken } = response;
    if (!idToken || !accessToken || !refreshToken) {
      throw new ValidationError('Invalid response', { email, password });
    }

    saveAuthentication(accessToken, refreshToken, idToken);
    const user = await getUserFromIdToken(idToken);
    if (!user) {
      throw new ValidationError('Invalid user', { email, password });
    }

    return user;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    if (error instanceof AxiosError && error.response?.data.message) {
      throw new ValidationError(error.response.data.message, {
        email,
        password,
      });
    }

    if (error instanceof Error) {
      throw new ValidationError(error.message, { email, password });
    }

    throw new ValidationError('Unknown error', { email, password });
  }
};

function SubmitButton({
  isValid,
  isLoading,
  onSubmit,
}: {
  isValid: boolean;
  isLoading: boolean;
  onSubmit: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}): React.ReactElement {
  const btn = (
    <button
      className='btn btn-primary w-full'
      onClick={(event) => onSubmit(event)}
    >
      Login
    </button>
  );
  const btnDisabled = (
    <button className='btn btn-disabled btn-primary w-full'>Login</button>
  );
  const btnLoading = (
    <button className='btn btn-disabled btn-primary w-full'>
      <span className='loading loading-spinner'></span>
      Login
    </button>
  );

  return !isValid ? btnDisabled : isLoading ? btnLoading : btn;
}

export default function Login(): React.ReactElement {
  const userStore = useUserStore();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const user = useActionData() as IUser;
  const error = useRouteError() as Error;
  const submit = useSubmit();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const isLoading = navigation.state === 'submitting';

  const onSubmit = async (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (!executeRecaptcha) {
      console.error('Recaptcha not loaded');
      event.preventDefault();
      return;
    }
    const token = await executeRecaptcha('onSubmit');
    const { email, password } = getValues();

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('token', token);
    submit(formData, { method: 'post' });
  };

  useEffect(() => {
    if (error) {
      console.log('Error:', error);
      if (error instanceof ValidationError) {
        console.log('Validation Error:', error.data);
      }

      toast(error?.message, {
        type: 'error',
        position: 'bottom-right',
      });
    }
  }, [error]);

  useEffect(() => {
    if (user) {
      userStore.setUser(user);

      toast(`Welcome ${user?.name}!`, {
        type: 'success',
        position: 'bottom-right',
      });
      navigate('/');
    }
  }, [user]);

  const methods = useForm({
    mode: 'all',
  });
  const {
    getValues,
    formState: { isValid },
  } = methods;

  const emailConstraints = {
    required: { value: true, message: 'Email is required' },
  };
  const passwordConstraints = {
    required: { value: true, message: 'Password is required' },
  };

  return (
    <section className='h-section py-20 w-full bg-slate-200'>
      <FormProvider {...methods}>
        <Form
          id='login-form'
          className='mx-auto w-full max-w-md space-y-5 p-8 overflow-hidden rounded-2xl bg-slate-50 shadow-lg'
        >
          <h1 className='mb-4 text-center text-4xl font-[600]'>
            Login to MyApp
          </h1>
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

          <div className='text-right'>
            <Link to='/forgot-password' className='text-secondary'>
              Forgot Password?
            </Link>
          </div>

          <SubmitButton
            isValid={isValid}
            isLoading={isLoading}
            onSubmit={onSubmit}
          />
          <span className='block'>
            Need an account?{' '}
            <Link to='/register' className='text-secondary'>
              Sign Up Here
            </Link>
          </span>
        </Form>
      </FormProvider>
    </section>
  );
}
