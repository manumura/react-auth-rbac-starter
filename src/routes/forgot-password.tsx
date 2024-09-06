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
  useSubmit,
} from 'react-router-dom';
import { toast } from 'react-toastify';
import FormInput from '../components/FormInput';
import { forgotPassword, validateRecaptcha } from '../lib/api';
import { ValidationError } from '../types/custom-errors';

export const action = async ({
  request,
}: {
  request: Request;
}): Promise<{
  message: string | undefined;
  error: Error | undefined;
}> => {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const token = formData.get('token') as string;

  try {
    if (!email) {
      throw new ValidationError('Invalid form data', { email });
    }

    if (!token) {
      throw new ValidationError('Recaptcha token not found', { email });
    }
    const isCaptchaValid = await validateRecaptcha(token);
    if (!isCaptchaValid) {
      throw new ValidationError('Captcha validation failed', { email });
    }

    const response = await forgotPassword(email);
    if (!response.message) {
      throw new ValidationError('Invalid response', { email });
    }
    return { message: response.message, error: undefined };
  } catch (error) {
    // You cannot `useLoaderData` in an errorElemen
    console.error(error);
    let message = 'Unknown error';
    if (error instanceof AxiosError && error.response?.data.message) {
      message = error.response.data.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    return { message: undefined, error: new Error(message) };
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

export default function ForgotPassword(): React.ReactElement {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const response = useActionData() as {
    message: string | undefined;
    error: Error | undefined;
  };
  const submit = useSubmit();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const isLoading = navigation.state === 'submitting';

  const methods = useForm({
    mode: 'all',
  });
  const {
    getValues,
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
    const token = await executeRecaptcha('onSubmit');
    const { email } = getValues();

    const formData = new FormData();
    formData.append('email', email);
    formData.append('token', token);
    submit(formData, { method: 'post' });
  };

  useEffect(() => {
    if (response) {
      if (response?.error) {
        toast(response.error?.message, {
          type: 'error',
          position: 'bottom-right',
        });
      }

      if (response?.message) {
        toast('Please follow the link sent to your email', {
          type: 'success',
          position: 'bottom-right',
        });
        navigate('/login');
      }
    }
  }, [response]);

  const emailConstraints = {
    required: { value: true, message: 'Email is required' },
  };

  return (
    <section className='h-section w-full bg-slate-200 py-20'>
      <FormProvider {...methods}>
        <Form
          method='post'
          onSubmit={(event) => onSubmit(event)}
          id='forgot-password-form'
          className='mx-auto w-full max-w-md space-y-5 overflow-hidden rounded-2xl bg-slate-50 p-8 shadow-lg'
        >
          <h1 className='mb-4 text-center text-4xl font-[600]'>
            Forgot password?
          </h1>
          <FormInput
            label='Email'
            name='email'
            type='email'
            constraints={emailConstraints}
          />

          <SubmitButton isValid={isValid} isLoading={isLoading} />
          <div className='text-center'>
            <Link to='/login' className='text-secondary'>
              Cancel
            </Link>
          </div>
        </Form>
      </FormProvider>
    </section>
  );
}
