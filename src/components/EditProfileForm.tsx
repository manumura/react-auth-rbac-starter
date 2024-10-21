import React, { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { Form } from 'react-router-dom';
import { IUser } from '../types/custom-types';
import DropBox from './DropBox';
import FormInput from './FormInput';

export default function EditProfileForm({
  user,
  editProfileMethods,
  isLoading,
  onEditProfile,
  onDrop,
  onCancel,
}: {
  readonly user: IUser;
  readonly editProfileMethods: any;
  readonly isLoading: boolean;
  readonly onEditProfile: (event: React.FormEvent<HTMLFormElement>) => void;
  readonly onDrop: (acceptedFiles: Blob[]) => void;
  readonly onCancel: () => void;
}): React.ReactElement {
   // @ts-expect-error - skip variable usage check for now
  const [uploadProgress, setUploadProgress] = useState(0);

  // const onUploadProgress = (progressEvent: AxiosProgressEvent): void => {
  //   const { loaded, total } = progressEvent;
  //   if (total && progressEvent.bytes) {
  //     const progress = Math.round((loaded / total) * 100);
  //     setUploadProgress(progress);
  //   }
  // };

  const {
    formState: { isValid: isEditProfileValid },
  } = editProfileMethods;

  const nameConstraints = {
    required: { value: true, message: 'Full Name is required' },
    minLength: {
      value: 5,
      message: 'Full Name is min 5 characters',
    },
  };

  const btnDisabled = (
    <button className='btn btn-disabled btn-primary'>Save</button>
  );
  const btnLoading = (
    <button className='btn btn-disabled w-full'>
      <span className='loading loading-spinner'></span>
      Save
    </button>
  );
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
  const editProfileButton = !isEditProfileValid
    ? btnDisabled
    : isLoading
    ? btnLoading
    : btnEditProfile;

  const uploadProgressStyle = {
    '--size': '3.2rem',
    '--value': uploadProgress,
  } as React.CSSProperties;

  return (
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
                  onClick={onCancel}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </FormProvider>
  );
}
