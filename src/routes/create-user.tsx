import { AxiosError } from 'axios';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Form,
  redirect,
  useActionData,
  useNavigate,
  useNavigation,
} from 'react-router-dom';
import { toast } from 'react-toastify';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import { appMessageKeys } from '../config/constant';
import { createUser } from '../lib/api';
import { getCurrentUserFromStorage, isAdmin } from '../lib/utils';
import { ValidationError } from '../types/custom-errors';

export const loader = async () => {
  try {
    const currentUser = await getCurrentUserFromStorage();
    if (!currentUser || !isAdmin(currentUser)) {
      console.error('No logged in ADMIN user');
      return redirect('/');
    }

    return { currentUser };
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
    }
> => {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const name = formData.get('name') as string;
  const role = formData.get('role') as string;

  try {
    if (!name || !email || !role) {
      throw new ValidationError('Invalid form data', { email, name, role });
    }

    const user = await createUser(email, name, role);
    if (!user) {
      throw new ValidationError('Invalid user', { email, name, role });
    }
    return redirect('/users?msg=' + appMessageKeys.USER_CREATE_SUCCESS);
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
  const btn = <button className='btn btn-primary mx-1'>Save</button>;
  const btnDisabled = (
    <button className='btn btn-disabled btn-primary mx-1'>Save</button>
  );
  const btnLoading = (
    <button className='btn btn-disabled btn-primary mx-1'>
      <span className='loading loading-spinner'></span>
      Save
    </button>
  );

  return !isValid ? btnDisabled : isLoading ? btnLoading : btn;
}

export default function CreateUser(): React.ReactElement {
  const navigation = useNavigation();
  const navigate = useNavigate();
  const response = useActionData() as {
    error: Error | undefined;
  };
  const isLoading = navigation.state === 'submitting';

  const methods = useForm({
    mode: 'all',
  });

  const {
    formState: { isValid },
  } = methods;

  useEffect(() => {
    if (response?.error) {
      toast(response.error.message, {
        type: 'error',
        position: 'bottom-right',
      });
    }
  }, [response]);

  const onCancel = (): void => {
    navigate(-1);
  };

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
  const roleConstraints = {
    required: { value: true, message: 'Role is required' },
  };

  const roles = [
    { label: '--- Please select a role ---', value: '' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'User', value: 'USER' },
  ];

  return (
    <section className='h-section bg-slate-200 py-20'>
      <div className='w-full'>
        <FormProvider {...methods}>
          <Form
            method='post'
            id='create-user-form'
            className='mx-auto w-full max-w-md space-y-5 overflow-hidden rounded-2xl bg-slate-50 p-8 shadow-lg'
          >
            <h2 className='mb-4 text-center text-2xl font-[600]'>
              Create a new user
            </h2>
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
            <FormSelect
              label='Role'
              name='role'
              options={roles}
              constraints={roleConstraints}
            />
            <div className='flex justify-center space-x-5'>
              <SubmitButton isValid={isValid} isLoading={isLoading} />
              <button
                type='button'
                id='btn-cancel'
                className={`btn btn-outline mx-1 ${
                  isLoading ? 'btn-disabled' : ''
                }`}
                onClick={onCancel}
              >
                Cancel
              </button>
            </div>
          </Form>
        </FormProvider>
      </div>
    </section>
  );
}
