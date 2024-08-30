import { AxiosError, AxiosProgressEvent } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Form,
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit
} from 'react-router-dom';
import { toast } from 'react-toastify';
import DropBox from '../components/DropBox';
import FormInput from '../components/FormInput';
import { appMessageKeys } from '../config/constant';
import { updatePassword, updateProfile, updateProfileImage } from '../lib/api';
import { ValidationError } from '../types/custom-errors';
import { IUser } from '../types/custom-types';

export const action = async ({ request }: { request: Request }) => {
  const formData = await request.formData();
  const intent = formData.get('intent');
  const name = formData.get('name') as string;
  const image = formData.get('image') as Blob;
  const oldPassword = formData.get('oldPassword') as string;
  const newPassword = formData.get('newPassword') as string;

  if (intent === 'edit-profile') {
    const response = await editProfile(name, image);
    // if (Object.hasOwn(response, 'error')) {
    if (response.error) {
      return { error: response.error, name };
    }
    return redirect('/profile?msg=' + appMessageKeys.PROFILE_UPDATE_SUCCESS);
  }

  if (intent === 'change-password') {
    const response = await changePassword(oldPassword, newPassword);
    if (response.error) {
      return { error: response.error, newPassword };
    }
    return redirect('/profile?msg=' + appMessageKeys.PASSWORD_CHANGE_SUCCESS);
  }
};

async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<{ user: IUser | undefined; error: Error | undefined }> {
  try {
    const user = await updatePassword(oldPassword, newPassword);
    if (!user) {
      throw new ValidationError('Change password failed', {
        oldPassword,
        newPassword,
      });
    }
    return { user, error: undefined };
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
}

async function editProfile(
  name: string,
  image: Blob | null
): Promise<{ user: IUser | undefined; error: Error | undefined }> {
  try {
    const user = await updateProfile(name);
    if (!user) {
      throw new ValidationError('Profile update failed', { name });
    }

    if (!image) {
      return { user, error: undefined };
    }

    // Upload profile image
    console.log('Uploading image');
    const formData = new FormData();
    formData.append('image', image);

    const onUploadProgress = (progressEvent: AxiosProgressEvent): void => {
      const { loaded, total } = progressEvent;
      if (total && progressEvent.bytes) {
        const progress = Math.round((loaded / total) * 100);
        // setUploadProgress(progress);
        console.log('Upload progress:', progress);
      }
    };

    const userUpdated = await updateProfileImage(formData, onUploadProgress);
    if (!userUpdated) {
      throw new ValidationError('Profile update failed', { name });
    }
    return { user: userUpdated, error: undefined };
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
}

export default function EditProfile(): React.ReactElement {
  const [images, setImages] = useState([] as Blob[]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const submit = useSubmit();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const { user } = useLoaderData() as { user: IUser };
  const response = useActionData() as {
    error: Error | undefined;
    name: string | undefined;
    newPassword: string | undefined;
  };
  const isLoading = navigation.state === 'submitting';

  const onPasswordChanged = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { intent, oldPassword, newPassword } = getChangePasswordValues();

    if (!oldPassword || !newPassword) {
      setChangePasswordError('oldPassword', {
        message: 'Please enter current and new password',
      });
      setChangePasswordError('newPassword', {
        message: 'Please enter current and new password',
      });
      return;
    }

    const formData = new FormData();
    formData.append('intent', intent);
    formData.append('oldPassword', oldPassword);
    formData.append('newPassword', newPassword);
    submit(formData, { method: 'post' });
  };

  const onEditProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { intent, name } = getEditProfileValues();

    if (!name && images.length <= 0) {
      setEditProfileError('name', { message: 'Please edit at least 1 field' });
      return;
    }

    const formData = new FormData();
    formData.append('intent', intent);
    formData.append('name', name);
    if (images.length > 0) {
      formData.append('image', images[0]);
    }
    submit(formData, { method: 'post', encType: 'multipart/form-data' });
  };

  useEffect(() => {
    if (response) {
      if (response.error) {
        toast(response.error.message, {
          type: 'error',
          position: 'bottom-right',
        });

        if (response.name) {
          setEditProfileValue('name', response.name);
        }
        if (response.newPassword) {
          setChangePasswordValue('newPassword', response.newPassword);
          setChangePasswordValue('newPasswordConfirm', response.newPassword);
        }
      }
    }
  }, [response]);

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

  // const onUploadProgress = (progressEvent: AxiosProgressEvent): void => {
  //   const { loaded, total } = progressEvent;
  //   if (total && progressEvent.bytes) {
  //     const progress = Math.round((loaded / total) * 100);
  //     setUploadProgress(progress);
  //   }
  // };

  const handleCancel = (): void => {
    navigate(-1);
  };

  //----------------- Edit Profile -------------------
  const editProfileMethods = useForm({
    defaultValues: {
      intent: 'edit-profile',
      name: user.name,
    },
    mode: 'all',
  });

  const {
    getValues: getEditProfileValues,
    setValue: setEditProfileValue,
    formState: { isValid: isEditProfileValid },
    // watch,
    setError: setEditProfileError,
  } = editProfileMethods;
  // ------------------------------------------------

  //----------------- Change Password -------------------
  const changePasswordMethods = useForm({
    defaultValues: {
      intent: 'change-password',
      oldPassword: '',
      newPassword: '',
      newPasswordConfirm: '',
    },
    mode: 'all',
  });

  const {
    getValues: getChangePasswordValues,
    setValue: setChangePasswordValue,
    formState: { isValid: isChangePasswordValid },
    watch,
    setError: setChangePasswordError,
  } = changePasswordMethods;
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
          onSubmit={(event) => onEditProfile(event)}
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
          onSubmit={(event) => onPasswordChanged(event)}
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
