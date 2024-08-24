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
import FormInput from '../components/FormInput';
import { ValidationError } from '../types/custom-errors';
import { forgotPassword, validateRecaptcha } from '../lib/api';
import { AxiosError } from 'axios';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const token = formData.get('token') as string;

  try {
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
    return response.message;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }

    if (error instanceof AxiosError && error.response?.data.message) {
      throw new ValidationError(error.response.data.message, {
        email,
      });
    }

    if (error instanceof Error) {
      throw new ValidationError(error.message, { email });
    }

    throw new ValidationError('Unknown error', { email });
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
  const methods = useForm();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const message = useActionData() as string;
  const error = useRouteError() as Error;
  const submit = useSubmit();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const isLoading = navigation.state === 'submitting';

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
    if (error) {
      toast(error?.message, {
        type: 'error',
        position: 'bottom-right',
      });
    }
  }, [error]);

  useEffect(() => {
    if (message) {
      toast('Please follow the link sent to your email', {
        type: 'success',
        position: 'bottom-right',
      });
      navigate('/login');
    }
  }, [message]);

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
