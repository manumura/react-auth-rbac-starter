import { useNavigate } from "react-router-dom";

const LoginButton = ({ id }) => {
  const navigation = useNavigate();

  const handleLogin = (): void => {
    // navigation
  };

  const btn = (
    <button className='btn-outline btn' id={id} onClick={handleLogin}>
      Login
    </button>
  );

  return btn;
};

export default LoginButton;
