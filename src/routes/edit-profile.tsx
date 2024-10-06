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
  useSubmit,
} from 'react-router-dom';
import { toast } from 'react-toastify';
import DeleteProfileModal from '../components/DeleteProfileModal';
import DropBox from '../components/DropBox';
import FormInput from '../components/FormInput';
import { handleLogout } from '../components/LogoutButton';
import { appMessageKeys } from '../config/constant';
import {
  deleteProfile,
  updatePassword,
  updateProfile,
  updateProfileImage,
} from '../lib/api';
import { IUser } from '../types/custom-types';
import { IoEyeOffSharp, IoEyeSharp } from 'react-icons/io5';
import { validatePassword } from '../lib/utils';

export const action = async ({
  request,
}: {
  request: Request;
}): Promise<
  | Response
  | {
      error: Error | undefined;
      time: number | undefined;
    }
> => {
  const formData = await request.formData();
  const intent = formData.get('intent');
  const time = new Date().getTime();

  try {
    if (intent === 'edit-profile') {
      const name = formData.get('name') as string;
      const image = formData.get('image') as Blob;
      const user = await editProfile(name, image);
      // if (Object.hasOwn(response, 'error')) {
      if (!user) {
        throw new Error('Profile update failed');
      }
      return redirect(
        '/profile?msg=' + appMessageKeys.PROFILE_UPDATE_SUCCESS + '&t=' + time
      );
    }

    if (intent === 'delete-profile') {
      const user = await removeProfile();
      if (!user) {
        throw new Error('Profile delete failed');
      }
      await handleLogout();
      return redirect(
        '/?msg=' + appMessageKeys.PROFILE_DELETE_SUCCESS + '&t=' + time
      );
    }

    if (intent === 'change-password') {
      const oldPassword = formData.get('oldPassword') as string;
      const newPassword = formData.get('newPassword') as string;
      const user = await changePassword(oldPassword, newPassword);
      if (!user) {
        throw new Error('Change password failed');
      }
      return redirect(
        '/profile?msg=' + appMessageKeys.PASSWORD_CHANGE_SUCCESS + '&t=' + time
      );
    }

    console.error('Invalid intent', intent);
    return redirect('/');
  } catch (error) {
    // You cannot `useLoaderData` in an errorElemen
    console.error(error);
    let message = 'Unknown error';
    if (error instanceof AxiosError && error.response?.data) {
      message = error.response.data.message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    const time = new Date().getTime();
    return { error: new Error(message), time };
  }
};

async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<IUser> {
  if (!oldPassword || !newPassword) {
    throw new Error('Invalid form data');
  }

  const { isValid: isPasswordValid, message } = validatePassword(newPassword);
  if (!isPasswordValid) {
    throw new Error(message || 'Password is invalid');
  }

  const user = await updatePassword(oldPassword, newPassword);
  if (!user) {
    throw new Error('Change password failed');
  }
  return user;
}

async function editProfile(name: string, image: Blob | null): Promise<IUser> {
  if (!name) {
    throw new Error('Invalid form data');
  }

  const user = await updateProfile(name);
  if (!user) {
    throw new Error('Profile update failed');
  }

  if (!image) {
    return user;
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
    throw new Error('Profile update failed');
  }
  return user;
}

async function removeProfile(): Promise<IUser> {
  const user = await deleteProfile();
  if (!user) {
    throw new Error('Change password failed');
  }
  return user;
}

export default function EditProfile(): React.ReactElement {
  const [images, setImages] = useState([] as Blob[]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] =
    useState(false);
  const submit = useSubmit();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const { user } = useLoaderData() as { user: IUser };
  const response = useActionData() as {
    error: Error | undefined;
    time: number | undefined;
  };
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

  const [typeOld, setTypeOld] = useState('password');
  const [iconOld, setIconOld] = useState(iconEyeOff);
  const onOldPasswordToggle = () => {
    if (typeOld === 'password') {
      setIconOld(iconEye);
      setTypeOld('text');
    } else {
      setIconOld(iconEyeOff);
      setTypeOld('password');
    }
  };

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

  const onDeleteProfile = async () => {
    const formData = new FormData();
    formData.append('intent', 'delete-profile');
    submit(formData, { method: 'post' });
  };

  useEffect(() => {
    if (response?.error) {
      const time = response.time ?? new Date().getTime();
      const message = response.error?.message;
      const toastId = `${message}-${time}`;

      if (message && !toast.isActive(toastId)) {
        toast(message, {
          type: 'error',
          position: 'bottom-right',
          toastId,
        });
      }
    }
  }, [response]);

  const onDrop = useCallback(
    (acceptedFiles: Blob[]) => {
      acceptedFiles.forEach((file: Blob, index: number) => {
        console.log('File index', index);
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

  const openConfirmDeleteModal = (): void => {
    setIsConfirmDeleteModalOpen(true);
  };

  const onCloseConfirmDeleteModal = async (
    confirmed: boolean
  ): Promise<void> => {
    setIsConfirmDeleteModalOpen(false);
    if (confirmed) {
      onDeleteProfile();
    }
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
    // setValue: setEditProfileValue,
    formState: { isValid: isEditProfileValid },
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
    // setValue: setChangePasswordValue,
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
  const oldPasswordConstraints = {
    required: { value: true, message: 'Password is required' },
  };
  const passwordConstraints = {
    required: { value: true, message: 'Password is required' },
    minLength: {
      value: 8,
      message: 'Password is min 8 characters',
    },
    validate: (value: string): string | undefined => {
      const { isValid, message } = validatePassword(value);
      if (!isValid) {
        return message || 'Password is invalid';
      }
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
  const btnDeleteProfile = (
    <button
      className='btn btn-error text-red-100'
      onClick={(): void => openConfirmDeleteModal()}
    >
      Delete
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
  const btnDeleteLoading = (
    <button className='btn btn-disabled w-full'>
      <span className='loading loading-spinner'></span>
      Delete
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
  const deleteProfileButton = isLoading ? btnDeleteLoading : btnDeleteProfile;

  const uploadProgressStyle = {
    '--size': '3.2rem',
    '--value': uploadProgress,
  } as React.CSSProperties;

  const shouldShowChangePasswordForm = user.providers?.length <= 0;

  return (
    <section className='min-h-screen bg-slate-200'>
      <FormProvider {...editProfileMethods}>
        <Form
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

      {shouldShowChangePasswordForm && (
        <FormProvider {...changePasswordMethods}>
          <Form
            onSubmit={(event) => onPasswordChanged(event)}
            id='change-password-form'
            className='mx-auto flex max-w-2xl flex-col items-center overflow-hidden pt-5'
          >
            <div className='card w-3/4 bg-slate-50 shadow-xl'>
              <div className='card-body'>
                <div className='card-title'>
                  <h1>Change my Password</h1>
                </div>
                <FormInput
                  label='Current Password'
                  name='oldPassword'
                  type={typeOld}
                  constraints={oldPasswordConstraints}
                  iconEnd={iconOld}
                  onClickIconEnd={onOldPasswordToggle}
                />
                <FormInput
                  label='New Password'
                  name='newPassword'
                  type={type}
                  constraints={passwordConstraints}
                  iconEnd={icon}
                  onClickIconEnd={onPasswordToggle}
                />
                <FormInput
                  label='Confirm New Password'
                  name='newPasswordConfirm'
                  type={typeConfirm}
                  constraints={passwordConfirmConstraints}
                  iconEnd={iconConfirm}
                  onClickIconEnd={onPasswordConfirmToggle}
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
      )}

      <div className='mx-auto flex max-w-2xl flex-col items-center overflow-hidden py-5'>
        <div className='card w-3/4 bg-red-50 shadow-xl'>
          <div className='card-body'>
            <div className='card-title text-red-500'>
              <h1>Delete my Profile</h1>
            </div>
            <div className='card-actions justify-end'>
              <div>{deleteProfileButton}</div>
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
      </div>

      <DeleteProfileModal
        isOpen={isConfirmDeleteModalOpen}
        onClose={onCloseConfirmDeleteModal}
      />
    </section>
  );
}
