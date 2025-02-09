import { AxiosError, AxiosProgressEvent } from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from 'react-router-dom';
import { toast } from 'react-toastify';
import ChangePasswordForm from '../components/ChangePasswordForm';
import DeleteProfileForm from '../components/DeleteProfileForm';
import EditProfileForm from '../components/EditProfileForm';
import { handleLogout } from '../components/LogoutButton';
import { appMessageKeys } from '../config/constant';
import {
  deleteProfile,
  updatePassword,
  updateProfile,
  updateProfileImage,
} from '../lib/api';
import { validatePassword } from '../lib/utils';
import { ValidationError } from '../types/custom-errors';
import { IUser } from '../types/custom-types';

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
        throw new ValidationError('Profile update failed', { name, image });
      }
      return redirect(
        '/profile?msg=' + appMessageKeys.PROFILE_UPDATE_SUCCESS + '&t=' + time
      );
    } else if (intent === 'delete-profile') {
      const user = await removeProfile();
      if (!user) {
        throw new ValidationError('Profile delete failed', {});
      }
      await handleLogout();
      return redirect(
        '/?msg=' + appMessageKeys.PROFILE_DELETE_SUCCESS + '&t=' + time
      );
    } else if (intent === 'change-password') {
      const oldPassword = formData.get('oldPassword') as string;
      const newPassword = formData.get('newPassword') as string;
      const user = await changePassword(oldPassword, newPassword);
      if (!user) {
        throw new ValidationError('Change password failed', {
          oldPassword,
          newPassword,
        });
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
  const submit = useSubmit();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const { user } = useLoaderData() as { user: IUser };
  const response = useActionData() as {
    error: Error | undefined;
    time: number | undefined;
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
    // setValue: setEditProfileValue,
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
    setError: setChangePasswordError,
  } = changePasswordMethods;
  // ------------------------------------------------

  const shouldShowChangePasswordForm = !user.providers || user.providers?.length <= 0;

  return (
    <section className='min-h-screen bg-slate-200'>
      <EditProfileForm
        user={user}
        onEditProfile={onEditProfile}
        onDrop={onDrop}
        onCancel={handleCancel}
        isLoading={isLoading}
        editProfileMethods={editProfileMethods}
      />

      {shouldShowChangePasswordForm && (
        <ChangePasswordForm
          onPasswordChanged={onPasswordChanged}
          onCancel={handleCancel}
          isLoading={isLoading}
          changePasswordMethods={changePasswordMethods}
        />
      )}

      <DeleteProfileForm
        onDeleteProfile={onDeleteProfile}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </section>
  );
}
