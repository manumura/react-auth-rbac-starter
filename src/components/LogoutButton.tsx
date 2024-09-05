import { useEffect } from 'react';
import { useFetcher, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { appMessageKeys, appMessages } from '../config/constant';
import { logout } from '../lib/api';
import { clearAuthentication } from '../lib/storage';
import useUserStore from '../lib/user-store';

export const action = async () => {
  try {
    await logout();
    return 'success';
  } catch (error) {
    return 'failed';
  }
};

const LogoutButton = ({ id }: { id: string }) => {
  const navigate = useNavigate();
  const userStore = useUserStore();
  const fetcher = useFetcher();

  const isLoading = fetcher.state === 'submitting';
  const success = fetcher.data === 'success';
  const failed = fetcher.data === 'failed';

  useEffect(() => {
    if (success) {
      userStore.setUser(null);
      clearAuthentication();
      toast(
        appMessages[appMessageKeys.LOGOUT_SUCCESS as keyof typeof appMessages],
        {
          type: 'success',
          position: 'bottom-right',
        }
      );
      navigate('/');
    }
  }, [success]);

  useEffect(() => {
    if (failed) {
      toast('Logout failed', {
        type: 'error',
        position: 'bottom-right',
      });
    }
  }, [failed]);

  const btn = (
    <fetcher.Form method='post' action='/logout' className='m-0 p-0'>
      <button id={id} type='submit' className='btn-outline btn'>
        Logout
      </button>
    </fetcher.Form>
  );
  const btnLoading = (
    <button id={id} className='btn-outline btn'>
      <span className='loading loading-spinner'></span>
      Logout
    </button>
  );

  return isLoading ? btnLoading : btn;
};

export default LogoutButton;
