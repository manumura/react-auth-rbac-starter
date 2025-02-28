import { FacebookLoginClient } from '@greatsumini/react-facebook-login';
import { googleLogout } from '@react-oauth/google';
import { useEffect } from 'react';
import { LoaderFunction, redirect, useFetcher } from 'react-router-dom';
import { toast } from 'react-toastify';
import { appMessages } from '../config/constant';
import { logout } from '../lib/api';
import useMessageStore from '../lib/message-store';
import { clearAuthentication } from '../lib/storage';
import useUserStore from '../lib/user-store';

export async function handleLogout() {
  await logout();
  useUserStore.getState().setUser(null);
  clearAuthentication();
  googleLogout();
  FacebookLoginClient.logout(() => {
    console.log('Logout completed!');
  });
}

export const action: LoaderFunction<any> = async () => {
  try {
    await handleLogout();
    const time = new Date().getTime();
    useMessageStore.getState().setMessage({
      type: appMessages.LOGOUT_SUCCESS.type,
      text: appMessages.LOGOUT_SUCCESS.text,
      id: time,
    });
    return redirect('/');
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
