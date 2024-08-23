import { useState } from 'react';
import { toast } from 'react-toastify';
import { logout } from '../lib/api';
import { clearAuthentication } from '../lib/storage';
import useUserStore from '../lib/user-store';
import { useLocation, useNavigate } from 'react-router-dom';

const LogoutButton = ({id}: {id: string}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userStore = useUserStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      await logout();

      userStore.setUser(null);
      clearAuthentication();
      setIsSubmitting(false);

      toast('Logout successfull', {
        type: 'success',
        position: 'bottom-right',
      });
      if (location?.pathname === '/') {
        navigate(0); // refresh the page
      }
      navigate('/');
    } catch (error) {
      console.error(error);
      toast('Logout failed', {
        type: 'error',
        position: 'bottom-right',
      });
      return;
    } finally {
      setIsSubmitting(false);
    }
  };

  const btn = (
    <button id={id} className='btn-outline btn' onClick={handleLogout}>
      Logout
    </button>
  );
  const btnLoading = (
    <button id={id} className='btn-outline btn'>
      <span className='loading loading-spinner'></span>
      Logout
    </button>
  );

  return isSubmitting ? btnLoading : btn;
};

export default LogoutButton;
