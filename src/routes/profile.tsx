import { useEffect } from 'react';
import { FaFacebook } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import {
  LoaderFunction,
  redirect,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { toast } from 'react-toastify';
import { appMessages } from '../config/constant';
import { getProfile } from '../lib/api';
import { IOauthProvider, IUser } from '../types/custom-types';
import { OauthProvider } from '../types/provider.model';

export const loader: LoaderFunction<any> = async () => {
  try {
    const user = await getProfile();
    if (!user) {
      console.error('Invalid user');
      return redirect('/');
    }

    return { user };
  } catch (error) {
    console.error(error);
    return redirect('/');
  }
};

export default function Profile(): React.ReactElement {
  const navigate = useNavigate();
  const { user } = useLoaderData() as { user: IUser };
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const msg = searchParams.get('msg');
    const time = searchParams.get('t');

    if (msg) {
      setSearchParams({});
      const toastId = `${msg}-${time}`;
      const message = appMessages[msg as keyof typeof appMessages];

      if (!toast.isActive(toastId)) {
        toast(message, {
          type: 'success',
          position: 'bottom-right',
          toastId,
        });
      }
    }
  }, [searchParams]);

  const handleEdit = (): void => {
    navigate('/edit-profile');
  };

  const avatar = user?.imageUrl ? (
    <div className='avatar'>
      <div className='w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 relative'>
        <img alt='my avatar' src={user.imageUrl} className='rounded-full' />
      </div>
    </div>
  ) : (
    <div className='avatar placeholder'>
      <div className='w-24 rounded-full bg-neutral-focus text-neutral-content ring ring-primary ring-offset-base-100 ring-offset-24'>
        <span className='text-3xl'>
          {user?.name?.substring(0, 2).toUpperCase()}
        </span>
      </div>
    </div>
  );

  const providers = user.providers?.map((oauthProvider: IOauthProvider) => {
    let icon;
    if (oauthProvider.provider === OauthProvider.Facebook) {
      icon = <FaFacebook className='text-2xl' />;
    } else if (oauthProvider.provider === OauthProvider.Google) {
      icon = <FcGoogle className='text-2xl' />;
    }

    return (
      <>
        <div className='text-right'>Authentication Provider:</div>
        <div
          className='col-span-4 flex items-center'
          key={oauthProvider.externalUserId}
        >
          {icon && <div className='pr-2'>{icon}</div>}
          <div>
            {oauthProvider.email} (ID {oauthProvider.externalUserId})
          </div>
        </div>
      </>
    );
  });

  return (
    <section className='h-section bg-slate-200'>
      <div className='flex flex-col items-center pt-10'>
        <div className='card w-3/4 max-w-screen-lg bg-slate-50 shadow-xl'>
          <div className='card-body'>
            <div className='card-title'>
              <h1>My Profile</h1>
            </div>
            <div className='grid auto-cols-auto grid-cols-5 gap-4'>
              <div className='text-right'>
                <h2>Image:</h2>
              </div>
              <div className='col-span-4'>{avatar}</div>
              <div className='text-right'>
                <h2>Full Name:</h2>
              </div>
              <div className='col-span-4'>
                <h2>{user.name}</h2>
              </div>
              {user?.email && (
                <>
                  <div className='text-right'>Email:</div>
                  <div className='col-span-4'>{user.email}</div>
                </>
              )}
              {providers?.length > 0 && providers}
              <div className='text-right'>
                <h3>Role:</h3>
              </div>
              <div className='col-span-4'>
                <h3>{user.role}</h3>
              </div>
            </div>
            <div className='card-actions justify-end'>
              <button className='btn' onClick={handleEdit}>
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
