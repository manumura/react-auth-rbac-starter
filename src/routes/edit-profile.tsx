import { AxiosProgressEvent } from 'axios';
import { useCallback, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useRouteError,
} from 'react-router-dom';
import DropBox from '../components/DropBox';
import FormInput from '../components/FormInput';
import { getProfile } from '../lib/api';
import { IUser } from '../types/custom-types';

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const token = formData.get('token') as string;

  if (intent === 'edit-profile') {
    console.log('Edit profile');
    return redirect('/profile');
  }

  if (intent === 'change-password') {
    console.log('Change password');
    return redirect('/profile');
  }
};

export default function EditProfile(): React.ReactElement {
  const [images, setImages] = useState([] as any[]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigation = useNavigation();
  const navigate = useNavigate();
  const { user } = useLoaderData() as { user: IUser };
  const userUpdated = useActionData() as IUser;
  const error = useRouteError() as Error;
  const isLoading = navigation.state === 'submitting';

  const onDrop = useCallback(
    (acceptedFiles: Blob[]) => {
      acceptedFiles.map((file: Blob, index: number) => {
        console.log('index', index);
        const reader = new FileReader();

        reader.onabort = (): void => console.log('file reading was aborted');
        reader.onerror = (): void => console.error('file reading has failed');
        // reader.onprogress = (e) => console.log('file reading in progress ', e);
        reader.onload = (): void => {
          // Do whatever you want with the file contents
          // const binaryStr = reader.result;
          // console.log(binaryStr);
          setImages([...images, file]);
        };

        reader.readAsDataURL(file);
        return file;
      });
    },
    [images]
  );
  const onUploadProgress = (progressEvent: AxiosProgressEvent): void => {
    const { loaded, total } = progressEvent;
    if (total && progressEvent.bytes) {
      const progress = Math.round((loaded / total) * 100);
      setUploadProgress(progress);
    }
  };

  const handleCancel = (): void => {
    navigate(-1);
  };

  //----------------- Edit Profile -------------------
  const editProfileMethods = useForm({
    defaultValues: {
      name: user.name,
    },
  });

  const {
    formState: { isValid: isEditProfileValid },
    // watch,
    setError: setEditProfileError,
  } = editProfileMethods;

  // const mutationProfile = useMutation({
  //   mutationFn: ({ name }: { name: string }) => onMutateProfile(name),
  //   async onSuccess(user, variables, context) {
  //     toast('Profile successfully updated!', {
  //       type: 'success',
  //       position: 'bottom-right',
  //     });

  //     await queryClient.invalidateQueries({ queryKey: ['profile'] });
  //     router.push('/profile');
  //   },
  //   onError(error, variables, context) {
  //     toast(error?.message, {
  //       type: 'error',
  //       position: 'bottom-right',
  //     });
  //   },
  // });

  // const onMutateProfile = async (name): Promise<IUser> => {
  //   try {
  //     const response = await updateProfile(name);
  //     const user = response.data;

  //     if (images.length <= 0) {
  //       return user;
  //     }

  //     // Upload profile image
  //     console.log('Uploading image');
  //     const formData = new FormData();
  //     formData.append('image', images[0]);

  //     const uploadResponse = await updateProfileImage(formData, onUploadProgress);
  //     if (uploadResponse.status !== 200) {
  //       throw new Error('Profile image upload failed');
  //     }
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

  // const onProfileEdited = async (formData): Promise<void> => {
  //   if (!formData?.name && images.length <= 0) {
  //     setEditProfileError('name', { message: 'Please edit at least 1 field' });
  //     // setError('password', { message: 'Please edit at least 1 field' });
  //     return;
  //   }

  //   mutationProfile.mutate({
  //     name: formData.name,
  //   });
  // };
  // ------------------------------------------------

  //----------------- Change Password -------------------
  const changePasswordMethods = useForm({
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
    },
  });

  const {
    formState: { isValid: isChangePasswordValid, errors },
    watch,
    setError: setChangePasswordError,
  } = changePasswordMethods;

  // const mutationPassword = useMutation({
  //   mutationFn: ({
  //     oldPassword,
  //     newPassword,
  //   }: {
  //     oldPassword: string;
  //     newPassword: string;
  //   }) => onMutatePassword(oldPassword, newPassword),
  //   async onSuccess(user, variables, context) {
  //     toast(`${user.name} successfully changed password!`, {
  //       type: 'success',
  //       position: 'bottom-right',
  //     });

  //     router.push('/profile');
  //   },
  //   onError(error, variables, context) {
  //     toast(error?.message, {
  //       type: 'error',
  //       position: 'bottom-right',
  //     });
  //   },
  // });

  // const onMutatePassword = async (oldPassword, newPassword): Promise<IUser> => {
  //   try {
  //     const response = await updatePassword(oldPassword, newPassword);
  //     const user = response?.data;
  //     return user;
  //   } catch (error) {
  //     if (error instanceof AxiosError && error.response?.data.message) {
  //       throw new Error(error.response.data.message);
  //     }
  //     if (error instanceof Error) {
  //       throw new Error(error.message);
  //     }
  //     throw new Error('Edit password failed');
  //   }
  // };

  // const onPasswordChanged = async (formData): Promise<void> => {
  //   if (!formData?.oldPassword || !formData?.newPassword) {
  //     setChangePasswordError('oldPassword', {
  //       message: 'Please enter current and new password',
  //     });
  //     setChangePasswordError('newPassword', {
  //       message: 'Please enter current and new password',
  //     });
  //     return;
  //   }

  //   mutationPassword.mutate({
  //     oldPassword: formData.oldPassword,
  //     newPassword: formData.newPassword,
  //   });
  // };
  // ------------------------------------------------

  const nameConstraints = {
    required: { value: true, message: 'Full Name is required' },
    minLength: {
      value: 5,
      message: 'Full Name is min 5 characters',
    },
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
      if (watch('newPassword') !== value) {
        return 'Passwords do no match';
      }
    },
  };

  const btnEditProfile = (
    <button
      type='submit'
      name='intent'
      value='edit-profile'
      className='btn btn-primary'
    >
      Save
    </button>
  );
  const btnChangePassword = (
    <button
      type='submit'
      name='intent'
      value='change-password'
      className='btn btn-primary'
    >
      Save
    </button>
  );
  const btnDisabled = (
    <button className='btn btn-disabled btn-primary'>Save</button>
  );
  const btnLoading = (
    <button className='btn btn-disabled w-full'>
      <span className='loading loading-spinner'></span>
      Save
    </button>
  );
  const editProfileButton = !isEditProfileValid
    ? btnDisabled
    : isLoading
    ? btnLoading
    : btnEditProfile;
  const changePasswordButton = !isChangePasswordValid
    ? btnDisabled
    : isLoading
    ? btnLoading
    : btnChangePassword;
  const uploadProgressStyle = {
    '--size': '3.2rem',
    '--value': uploadProgress,
  } as React.CSSProperties;

  return (
    <section className='min-h-screen bg-slate-200'>
      <FormProvider {...editProfileMethods}>
        <Form
          method='post'
          id='edit-profile-form'
          className='mx-auto flex max-w-2xl flex-col items-center overflow-hidden pt-10'
        >
          <div className='card w-3/4 bg-slate-50 shadow-xl'>
            <div className='card-body'>
              <div className='card-title'>
                <h1>Edit my Profile</h1>
              </div>
              <FormInput
                label='Full Name'
                name='name'
                constraints={nameConstraints}
              />
              Image
              <DropBox onDrop={onDrop} imgSrc={user.imageUrl} />
              {/* <FormInput label='Image' name='image' type='file' /> */}
              <div className='card-actions justify-end'>
                {uploadProgress > 0 && (
                  <div className='radial-progress' style={uploadProgressStyle}>
                    {uploadProgress}%
                  </div>
                )}
                <div>{editProfileButton}</div>
                <div>
                  <button
                    type='button'
                    className={`btn btn-outline btn-accent ${
                      isLoading ? 'btn-disabled' : ''
                    }`}
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Form>
      </FormProvider>

      <FormProvider {...changePasswordMethods}>
        <Form
          method='post'
          id='change-password-form'
          className='mx-auto flex max-w-2xl flex-col items-center overflow-hidden py-5'
        >
          <div className='card w-3/4 bg-slate-50 shadow-xl'>
            <div className='card-body'>
              <div className='card-title'>
                <h1>Change my Password</h1>
              </div>
              <FormInput
                label='Current Password'
                name='oldPassword'
                type='password'
                constraints={passwordConstraints}
              />
              <FormInput
                label='New Password'
                name='newPassword'
                type='password'
                constraints={passwordConstraints}
              />
              <FormInput
                label='Confirm New Password'
                name='newPasswordConfirm'
                type='password'
                constraints={passwordConfirmConstraints}
              />
              <div className='card-actions justify-end'>
                <div>{changePasswordButton}</div>
                <div>
                  <button
                    type='button'
                    className={`btn btn-outline btn-accent ${
                      isLoading ? 'btn-disabled' : ''
                    }`}
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Form>
      </FormProvider>
    </section>
  );
}
