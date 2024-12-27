import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { FormProvider, useForm } from 'react-hook-form';
import { IoEyeOffSharp, IoEyeSharp } from 'react-icons/io5';
import {
  ActionFunction,
  Form,
  Link,
  LoaderFunction,
  redirect,
  useActionData,
  useNavigation,
  useSearchParams,
  useSubmit,
} from 'react-router-dom';
import { toast } from 'react-toastify';
import FacebookLoginButton from '../components/FacebookLoginButton';
import FormInput from '../components/FormInput';
import GoogleLoginButton from '../components/GoogleLoginButton';
import { appConstant, appMessageKeys, appMessages } from '../config/constant';
import { login, validateRecaptcha } from '../lib/api';
import { getUserFromIdToken } from '../lib/jwt.utils';
import { saveAuthentication } from '../lib/storage';
import useUserStore from '../lib/user-store';
import { getCurrentUserFromStorage } from '../lib/utils';
import { ValidationError } from '../types/custom-errors';

export const loader: LoaderFunction<any> = async () => {
  try {
    const currentUser = await getCurrentUserFromStorage();
    if (currentUser) {
      console.error('User already logged in');
      return redirect('/');
    }

    return { currentUser };
  } catch (error) {
    console.error(error);
    return redirect('/');
  }
};

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
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const token = formData.get('token') as string;

  try {
    if (!email || !password) {
      throw new ValidationError('Invalid form data', { email, password });
    }

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

    const { accessToken, accessTokenExpiresAt, refreshToken, idToken } = response;
    if (!idToken || !accessToken || !refreshToken) {
      throw new ValidationError('Invalid response', { email, password });
    }

    const user = await getUserFromIdToken(idToken);
    if (!user) {
      throw new ValidationError('Invalid user', { email, password });
    }

    saveAuthentication(accessToken, accessTokenExpiresAt, refreshToken, idToken);
    useUserStore.getState().setUser(user);
    const time = new Date().getTime();

    return redirect('/?msg=' + appMessageKeys.LOGIN_SUCCESS + '&t=' + time);
  } catch (error) {
    // You cannot `useLoaderData` in an errorElemen
    console.error(error);
    let message = 'Unknown error';
    if (error instanceof AxiosError && error.response?.data) {
      const err = error.response.data.error;
      message =
        err === 'email_not_verified'
          ? appMessages.loginFailedEmailNotVerified
          : error.response.data.message;
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
  const btn = <button className='btn btn-primary w-full'>Login</button>;
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
  const navigation = useNavigation();
  const response = useActionData() as {
    error: Error | undefined;
  };
  const submit = useSubmit();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const isLoading = navigation.state === 'submitting';
  const [searchParams, setSearchParams] = useSearchParams();

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

  useEffect(() => {
    const msg = searchParams.get('msg');
    const time = searchParams.get('t');

    if (msg) {
      setSearchParams({});
      const toastId = `${msg}-${time}`;
      const message = appMessages[msg as keyof typeof appMessages];

      if (!toast.isActive(toastId)) {
        toast(message, {
          type: 'success',
          position: 'bottom-right',
          toastId,
        });
      }
    }
  }, [searchParams]);

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
    const { email, password } = getValues();

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('token', token);
    submit(formData, { method: 'post' });
  };

  const methods = useForm({
    mode: 'all',
  });
  const {
    getValues,
    formState: { isValid },
  } = methods;

  const emailConstraints = {
    required: { value: true, message: 'Email is required' },
    pattern: {
      value: appConstant.EMAIL_VALIDATION_REGEX,
      message: 'Email is invalid',
    },
  };
  const passwordConstraints = {
    required: { value: true, message: 'Password is required' },
  };

  return (
    <section className='h-section py-20 w-full bg-slate-200'>
      <FormProvider {...methods}>
        <Form
          // method='post'
          onSubmit={(event) => onSubmit(event)}
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
            type={type}
            constraints={passwordConstraints}
            iconEnd={icon}
            onClickIconEnd={onPasswordToggle}
          />
          <div className='text-right'>
            <Link to='/forgot-password' className='text-secondary'>
              Forgot Password?
            </Link>
          </div>

          <SubmitButton isValid={isValid} isLoading={isLoading} />
          <span className='block'>
            Need an account?{' '}
            <Link to='/register' className='text-secondary'>
              Sign Up Here
            </Link>
          </span>

          <div className='divider'>OR</div>
          <GoogleLoginButton />
          <FacebookLoginButton />
        </Form>
      </FormProvider>
    </section>
  );
}
