import { AxiosError } from 'axios';
import { useEffect } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useRouteError,
  useSubmit,
} from 'react-router-dom';
import { toast } from 'react-toastify';
import FormInput from '../components/FormInput';
import { getUserFromToken, resetPassword, validateRecaptcha } from '../lib/api';
import { ValidationError } from '../types/custom-errors';

export const loader = async ({ request }: { request: Request }) => {
  const searchParams = new URL(request.url).searchParams;
  const token = searchParams.get('token');
  if (!token) {
    throw new Response('', {
      status: 404,
      statusText: 'Invalid token',
    });
  }

  const user = await getUserFromToken(token);
  if (!user) {
    throw new Response('', {
      status: 404,
      statusText: 'Invalid token',
    });
  }

  return { token };
};

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const password = formData.get('password') as string;
  const token = formData.get('token') as string;
  const recaptchaToken = formData.get('recaptchaToken') as string;
  console.log('pasword token recaptchaToken', password, token, recaptchaToken);

  try {
    if (!recaptchaToken) {
      throw new ValidationError('Recaptcha token not found', {
        password,
        token,
      });
    }
    const isCaptchaValid = await validateRecaptcha(recaptchaToken);
    if (!isCaptchaValid) {
      throw new ValidationError('Captcha validation failed', {
        password,
        token,
      });
    }

    const user = await resetPassword(password, token);
    if (!user) {
      throw new ValidationError('Invalid response', { password, token });
    }
    return user;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    if (error instanceof AxiosError && error.response?.data.message) {
      throw new ValidationError(error.response.data.message, {
        password,
        token,
      });
    }

    if (error instanceof Error) {
      throw new ValidationError(error.message, { password, token });
    }

    throw new ValidationError('Unknown error', { password, token });
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
  const navigate = useNavigate();
  const user = useActionData() as string;
  const error = useRouteError() as Error;
  const submit = useSubmit();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const isLoading = navigation.state === 'submitting';

  const methods = useForm({
    mode: 'all',
  });
  const {
    getValues,
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
    if (error) {
      toast(error?.message, {
        type: 'error',
        position: 'bottom-right',
      });
    }
  }, [error]);

  useEffect(() => {
    if (user) {
      toast('Password successfully updated!', {
        type: 'success',
        position: 'bottom-right',
      });
      navigate('/login');
    }
  }, [user]);

  // const mutation = useMutation({
  //   mutationFn: ({ password, token }: { password: string; token: string; }) =>
  //     onMutate(password, token),
  //   async onSuccess(user, variables, context) {
  //     toast('Password successfully updated!', {
  //       type: 'success',
  //       position: 'bottom-right',
  //     });

  //     router.push('/login');
  //   },
  //   onError(error, variables, context) {
  //     toast(error?.message, {
  //       type: 'error',
  //       position: 'bottom-right',
  //     });
  //   },
  // });

  // const onMutate = async (password, token): Promise<IUser> => {
  //   let response: AxiosResponse<IUser>;
  //   try {
  //     response = await resetPassword(password, token);
  //   } catch (error) {
  //     if (error?.response) {
  //       throw new Error(error.response.data.message);
  //     }
  //     throw new Error(error.message);
  //   }

  //   if (response.status !== 200) {
  //     throw new Error('Reset password failed');
  //   }
  //   const user = response.data;
  //   return user;
  // };

  // const onSubmit = async (formData): Promise<void> => {
  //   if (!formData) {
  //     return;
  //   }

  //   mutation.mutate({ password: formData.password, token });
  // };

  const passwordConstraints = {
    required: { value: true, message: 'Password is required' },
    minLength: {
      value: 8,
      message: 'Password is min 8 characters',
    },
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
            type='password'
            constraints={passwordConstraints}
          />
          <FormInput
            label='Confirm New Password'
            name='passwordConfirm'
            type='password'
            constraints={passwordConfirmConstraints}
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
