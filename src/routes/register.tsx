import { AxiosError } from 'axios';
import React, { useEffect } from 'react';
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
import { register, validateRecaptcha } from '../lib/api';
import { IUser } from '../types/custom-types';

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const token = formData.get('token') as string;

  if (!token) {
    throw new Error('Recaptcha token not found');
  }

  try {
    const isCaptchaValid = await validateRecaptcha(token);
    if (!isCaptchaValid) {
      throw new Error('Captcha validation failed');
    }
  } catch (error) {
    console.error('Captcha validation failed', error);
    if (error instanceof AxiosError && error.response?.data.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }

  let user: IUser;
  try {
    user = await register(email, password, name);
  } catch (error) {
    console.error('Captcha validation failed2', error);
    if (error instanceof AxiosError && error.response?.data.message) {
      throw new Error(error.response.data.message);
    }
    throw error;
  }

  if (!user) {
    throw new Error('Invalid response');
  }
  return user;
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
      Register
    </button>
  );
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
    const { email, password, name } = getValues();

    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    formData.append('name', name);
    formData.append('token', token);
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
      toast(`Registration successful ${user?.name}!`, {
        type: 'success',
        position: 'bottom-right',
      });
      navigate('/login');
    }
  }, [user]);

  const methods = useForm({
    mode: 'all',
  });

  const {
    getValues,
    formState: { isValid },
    watch,
  } = methods;

  //   const mutation = useMutation({
  //     mutationFn: ({
  //       email,
  //       password,
  //       name,
  //     }: {
  //       email: string;
  //       password: string;
  //       name: string;
  //     }) => onMutate(email, password, name),
  //     async onSuccess(user, variables, context) {
  //       toast(`Registration successful ${user?.name}!`, {
  //         type: 'success',
  //         position: 'bottom-right',
  //       });

  //       router.push('/login');
  //     },
  //     onError(error, variables, context) {
  //       toast(error?.message, {
  //         type: 'error',
  //         position: 'bottom-right',
  //       });
  //     },
  //   });

  //   const onMutate = async (email, password, name): Promise<IUser> => {
  // if (!executeRecaptcha) {
  //   throw new Error('Recaptcha not loaded');
  // }
  // const token = await executeRecaptcha('onSubmit');
  // const isCaptchaValid = await validateRecaptcha(token);
  // if (!isCaptchaValid) {
  //   throw new Error('Captcha validation failed');
  // }

  // let response: AxiosResponse<IUser>;
  // try {
  //   response = await register(email, password, name);
  // } catch (error) {
  //   if (error?.response) {
  //     throw new Error(error.response.data.message);
  //   }
  //   throw new Error(error.message);
  // }
  // return response.data;
  //   };

  //   const onSubmit = async (formData): Promise<void> => {
  //     if (!formData) {
  //       return;
  //     }

  //     mutation.mutate({
  //       email: formData.email,
  //       password: formData.password,
  //       name: formData.name,
  //     });
  //   };

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
          <SubmitButton
            isValid={isValid}
            isLoading={isLoading}
            onSubmit={onSubmit}
          />
        </Form>
      </FormProvider>
    </section>
  );
}
