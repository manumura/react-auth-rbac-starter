import { AxiosError } from 'axios';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Form,
  redirect,
  useNavigate,
  useNavigation,
  useRouteError,
} from 'react-router-dom';
import { toast } from 'react-toastify';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import { appMessageKeys } from '../config/constant';
import { createUser } from '../lib/api';
import { ValidationError } from '../types/custom-errors';

export const action = async ({ request }: { request: Request }) => {
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
    if (error instanceof ValidationError) {
      throw error;
    }

    if (error instanceof AxiosError && error.response?.data.message) {
      throw new ValidationError(error.response.data.message, {
        email,
        name,
        role,
      });
    }

    if (error instanceof Error) {
      throw new ValidationError(error.message, { email, name, role });
    }

    throw new ValidationError('Unknown error', { email, name, role });
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
  const error = useRouteError() as Error;
  const isLoading = navigation.state === 'submitting';

  const methods = useForm({
    mode: 'all',
  });

  const {
    formState: { isValid },
  } = methods;

  useEffect(() => {
    if (error) {
      toast(error?.message, {
        type: 'error',
        position: 'bottom-right',
      });
    }
  }, [error]);

  // const mutation = useMutation({
  //   mutationFn: ({
  //     email,
  //     name,
  //     role,
  //   }: {
  //     email: string;
  //     name: string;
  //     role: string;
  //   }) => onMutate(email, name, role),
  //   async onSuccess(user, variables, context) {
  //     toast(`User created successfully ${user?.name}`, {
  //       type: 'success',
  //       position: 'bottom-right'
  //     });

  //     router.replace('/users');
  //   },
  //   onError(error, variables, context) {
  //     toast(error?.message, {
  //       type: 'error',
  //       position: 'bottom-right',
  //     });
  //   },
  // });

  // const onMutate = async (email, name, role): Promise<IUser> => {
  //   try {
  //     const response = await createUser(email, name, role);
  //     const user = response.data;
  //     return user;
  //   } catch (error) {
  //     if (error instanceof AxiosError && error.response?.data.message) {
  //       throw new Error(error.response.data.message);
  //     }
  //     if (error instanceof Error) {
  //       throw new Error(error.message);
  //     }
  //     throw new Error('Create user failed');
  //   }
  // };

  // const onSubmit = async (formData): Promise<void> => {
  //   if (!formData) {
  //     return;
  //   }

  //   mutation.mutate({
  //     email: formData.email,
  //     name: formData.name,
  //     role: formData.role,
  //   });
  // };

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