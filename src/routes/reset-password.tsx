import { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from 'react-router-dom';
import { toast } from 'react-toastify';
import FormInput from '../components/FormInput';
import { appMessageKeys } from '../config/constant';
import { getUserFromToken, resetPassword, validateRecaptcha } from '../lib/api';
import { ValidationError } from '../types/custom-errors';
import { validatePassword } from '../lib/utils';
import { IoEyeOffSharp, IoEyeSharp } from 'react-icons/io5';

export const loader = async ({ request }: { request: Request }) => {
  try {
    const searchParams = new URL(request.url).searchParams;
    const token = searchParams.get('token');
    if (!token) {
      console.error('No token found');
      return redirect('/');
    }

    const user = await getUserFromToken(token);
    if (!user) {
      console.error('Invalid token');
      return redirect('/');
    }

    return { token };
  } catch (error) {
    console.error(error);
    return redirect('/');
  }
};

export const action = async ({
  request,
}: {
  request: Request;
}): Promise<
  | Response
  | {
      error: Error | undefined;
      password: string | undefined;
    }
> => {
  const formData = await request.formData();
  const password = formData.get('password') as string;
  const token = formData.get('token') as string;
  const recaptchaToken = formData.get('recaptchaToken') as string;

  try {
    if (!recaptchaToken) {
      throw new ValidationError('Recaptcha token not found', {
        password,
      });
    }
    const isCaptchaValid = await validateRecaptcha(recaptchaToken);
    if (!isCaptchaValid) {
      throw new ValidationError('Captcha validation failed', {
        password,
      });
    }

    const { isValid: isPasswordValid, message } = validatePassword(password);
    if (!isPasswordValid) {
      throw new ValidationError(message || 'Password is invalid.', {
        password,
      });
    }

    const user = await resetPassword(password, token);
    if (!user) {
      throw new ValidationError('Invalid response', { password });
    }
    return redirect('/login?msg=' + appMessageKeys.PASSWORD_RESET_SUCCESS);
  } catch (error) {
    // You cannot `useLoaderData` in an errorElemen
    console.error(error);
    let message = 'Unknown error';
    if (error instanceof AxiosError && error.response?.data.message) {
      message = error.response.data.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    return { error: new Error(message), password };
  }
};

function SubmitButton({
  isValid,
  isLoading,
}: {
  isValid: boolean;
  isLoading: boolean;
}): React.ReactElement {
  const btn = <button className='btn btn-primary w-full'>Submit</button>;
  const btnDisabled = (
    <button className='btn btn-disabled btn-primary w-full'>Submit</button>
  );
  const btnLoading = (
    <button className='btn btn-disabled btn-primary w-full'>
      <span className='loading loading-spinner'></span>
      Submit
    </button>
  );

  return !isValid ? btnDisabled : isLoading ? btnLoading : btn;
}

export default function ResetPassword(): React.ReactElement {
  const { token } = useLoaderData() as { token: string };
  const navigation = useNavigation();
  const response = useActionData() as {
    error: Error | undefined;
    password: string | undefined;
  };
  const submit = useSubmit();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const isLoading = navigation.state === 'submitting';

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

  const methods = useForm({
    mode: 'all',
  });
  const {
    clearErrors,
    getValues,
    setValue,
    watch,
    formState: { isValid },
  } = methods;

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!executeRecaptcha) {
      toast('Recaptcha not loaded', {
        type: 'error',
        position: 'bottom-right',
      });
      return;
    }
    const recaptchaToken = await executeRecaptcha('onSubmit');
    const { password } = getValues();

    const formData = new FormData();
    formData.append('token', token);
    formData.append('password', password);
    formData.append('recaptchaToken', recaptchaToken);
    submit(formData, { method: 'post' });
  };

  useEffect(() => {
    if (response) {
      if (response.error) {
        toast(response.error.message, {
          type: 'error',
          position: 'bottom-right',
        });

        if (response.password) {
          setValue('password', response.password);
        }
      }
    }
  }, [response]);

  const passwordConstraints = {
    required: { value: true, message: 'Password is required' },
    minLength: {
      value: 8,
      message: 'Password is min 8 characters',
    },
    maxLength: {
      value: 70,
      message: 'Password is max 70 characters',
    },
    validate: (value: string): string | undefined => {
      const { isValid, message } = validatePassword(value);
      if (!isValid) {
        return message || 'Password is invalid';
      }
      if (watch('passwordConfirm') && watch('passwordConfirm') !== value) {
        return 'Passwords do no match';
      }
      clearErrors("passwordConfirm");
    },
  };
  const passwordConfirmConstraints = {
    required: { value: true, message: 'Confirm Password is required' },
    validate: (value: string): string | undefined => {
      if (watch('password') !== value) {
        return 'Passwords do no match';
      }
      clearErrors("password");
    },
  };

  return (
    <section className='h-section w-full bg-slate-200 py-20'>
      <FormProvider {...methods}>
        <Form
          method='post'
          onSubmit={(event) => onSubmit(event)}
          id='reset-password-form'
          className='mx-auto w-full max-w-md space-y-5 overflow-hidden rounded-2xl bg-slate-50 p-8 shadow-lg'
        >
          <h1 className='mb-4 text-center text-4xl font-[600]'>
            Reset password
          </h1>
          <FormInput
            label='New Password'
            name='password'
            type={type}
            constraints={passwordConstraints}
            iconEnd={icon}
            onClickIconEnd={onPasswordToggle}
          />
          <FormInput
            label='Confirm New Password'
            name='passwordConfirm'
            type={typeConfirm}
            constraints={passwordConfirmConstraints}
            iconEnd={iconConfirm}
            onClickIconEnd={onPasswordConfirmToggle}
          />

          <SubmitButton isValid={isValid} isLoading={isLoading} />
          <div className='text-center'>
            <Link to='/' className='text-secondary'>
              Cancel
            </Link>
          </div>
        </Form>
      </FormProvider>
    </section>
  );
}
