import { useEffect } from 'react';
import { redirect, useFetcher } from 'react-router-dom';
import { toast } from 'react-toastify';
import { appMessageKeys } from '../config/constant';
import { logout } from '../lib/api';
import { clearAuthentication } from '../lib/storage';
import useUserStore from '../lib/user-store';

export const action = async () => {
  try {
    await logout();
    useUserStore.getState().setUser(null);
    clearAuthentication();

    return redirect('/?msg=' + appMessageKeys.LOGOUT_SUCCESS);
  } catch (error) {
    return 'failed';
  }
};

const LogoutButton = ({ id }: { id: string }) => {
  const fetcher = useFetcher();
  const isLoading = fetcher.state === 'submitting';
  const failed = fetcher.data === 'failed';

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
