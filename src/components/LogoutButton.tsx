import useUserStore from '../lib/user-store';

const LogoutButton = ({ id }) => {
  const userStore = useUserStore();
  
  let isPending = false;

  const handleLogout = async (): Promise<void> => {
    console.log('LogoutButton handleLogout');
  };

  const btn = (
    <button className='btn-outline btn' id={id} onClick={handleLogout}>
      Logout
    </button>
  );
  const btnLoading = (
    <button className='btn-outline btn' id={id}>
      <span className='loading loading-spinner'></span>
      Logout
    </button>
  );

  return isPending ? btnLoading : btn;
};

export default LogoutButton;
