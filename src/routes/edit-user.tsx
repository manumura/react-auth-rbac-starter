import { UUID } from 'crypto';
import { FormProvider, useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { IUser } from '../types/custom-types';
import { Form, Params, redirect, useLoaderData, useNavigate, useNavigation } from 'react-router-dom';
import FormSelect from '../components/FormSelect';
import FormInput from '../components/FormInput';
import { getUserByUuid } from '../lib/api';
import { AxiosError } from 'axios';

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const name = formData.get('name') as string;
  const role = formData.get('role') as string;
  const password = formData.get('password') as string;
  const passwordConfirm = formData.get('passwordConfirm') as string;

  try {
    console.log('Edit user form submitted');
  } catch (error) {
    // You cannot `useLoaderData` in an errorElemen
    console.error(error);
    let message = 'Unknown error';
    if (error instanceof AxiosError && error.response?.data.message) {
      message = error.response.data.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    return { user: undefined, error: new Error(message) };
  }
};

export const loader = async ({ params }: { request: Request, params: Params }) => {
  try {
    const userUuid = params.userUuid as UUID;
    if (!userUuid) {
      console.error('No user UUID found');
      return redirect('/');
    }

    const user = await getUserByUuid(userUuid);
    if (!user) {
      console.error('Invalid user UUID');
      return redirect('/');
    }

    return { user };
  } catch (error) {
    console.error(error);
    return redirect('/');
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

export default function EditUser(): React.ReactElement {
  const navigation = useNavigation();
  const isLoading = navigation.state === 'submitting';
  const navigate = useNavigate();
  const { user } = useLoaderData() as { user: IUser };

  const methods = useForm({
    defaultValues: {
      name: user.name,
      email: user.email,
      password: '',
      passwordConfirm: '',
      role: user.role,
    },
    mode: 'all',
  });

  const {
    watch,
    handleSubmit,
    formState: { isValid, errors },
    setError,
  } = methods;

  // const mutation = useMutation({
  //   mutationFn: ({
  //     uuid,
  //     name,
  //     email,
  //     role,
  //     password,
  //   }: {
  //     uuid: UUID;
  //     name: string;
  //     email: string;
  //     role: string;
  //     password: string;
  //   }) => onMutate(uuid, name, email, role, password),
  //   async onSuccess(userUpdated, variables, context) {
  //     toast(`User updated successfully ${userUpdated?.name}!`, {
  //       type: 'success',
  //       position: 'bottom-right',
  //     });

  //     await queryClient.invalidateQueries({ queryKey: ['userByUuid', user.uuid] });
  //     router.back();
  //   },
  //   onError(error, variables, context) {
  //     toast(error?.message, {
  //       type: 'error',
  //       position: 'bottom-right',
  //     });
  //   },
  // });

  // const onMutate = async (
  //   uuid,
  //   name,
  //   email,
  //   role,
  //   password,
  // ): Promise<IUser> => {
  //   try {
  //     const response = await updateUser(uuid, name, email, role, password);
  //     const user = response.data;
  //     return user;
  //   } catch (error) {
  //     if (error instanceof AxiosError && error.response?.data.message) {
  //       throw new Error(error.response.data.message);
  //     }
  //     if (error instanceof Error) {
  //       throw new Error(error.message);
  //     }
  //     throw new Error('Edit user failed');
  //   }
  // };

  // const onSubmit = async (formData): Promise<void> => {
  //   if (!formData || !user) {
  //     return;
  //   }

  //   mutation.mutate({
  //     uuid: user.uuid,
  //     email: formData.email,
  //     name: formData.name,
  //     role: formData.role,
  //     password: formData.password,
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
    pattern: {
      value: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
      message: 'Email address is invalid',
    },
  };
  const passwordConstraints = {
    // required: { value: true, message: 'Password is required' },
    minLength: {
      value: 8,
      message: 'Password is min 8 characters',
    },
  };
  const passwordConfirmConstraints = {
    // required: { value: true, message: 'Confirm Password is required' },
    validate: (value: string): string | undefined => {
      if (watch('password') !== value) {
        return 'Passwords do no match';
      }
    },
  };
  const roleConstraints = {
    required: { value: true, message: 'Role is required' },
  };

  const roles = [
    { label: '--- Please select a role ---', value: '' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'User', value: 'USER' },
  ];

  const editUserForm = (
    <div className='w-full py-10'>
      <FormProvider {...methods}>
        <Form
          method='post'
          id='edit-user-form'
          className='mx-auto w-full max-w-md space-y-5 overflow-hidden rounded-2xl bg-slate-50 p-8 shadow-lg'
        >
          <h2 className='mb-4 text-center text-2xl font-[600]'>Edit user</h2>
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
  );

  return <section className='h-section bg-slate-200'>{editUserForm}</section>;
}
