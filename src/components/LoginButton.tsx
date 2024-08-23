import { useNavigate } from 'react-router-dom';

const LoginButton = ({ id }: { id: string }) => {
  const navigate = useNavigate();

  const handleLogin = (): void => {
    navigate('/login');
  };

  const btn = (
    <button id={id} className='btn-outline btn' onClick={handleLogin}>
      Login
    </button>
  );

  return btn;
};

export default LoginButton;
