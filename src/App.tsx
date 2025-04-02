import Plausible from 'plausible-tracker';
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css';
import { action as facebookLoginAction } from './components/FacebookLoginButton';
import { action as googleLoginAction } from './components/GoogleLoginButton';
import LoadingOverlay from './components/LoadingOverlay';
import { action as logoutAction } from './components/LogoutButton';
import { Providers } from './components/Providers';
import appConfig from './config/config';
import ErrorPage from './error-page';
import './index.css';
import Home, { loader as homeLoader } from './routes';
import CreateUser, {
    action as createUserAction,
    loader as createUserLoader,
} from './routes/create-user';
import EditProfile, {
    action as editProfileAction,
} from './routes/edit-profile';
import EditUser, {
    action as editUserAction,
    loader as userLoader,
} from './routes/edit-user';
import ForgotPassword, {
    action as forgotPasswordAction,
} from './routes/forgot-password';
import Layout, { loader as rootLoader } from './routes/layout';
import Login, {
    action as loginAction,
    loader as loginLoader,
} from './routes/login';
import Profile, { loader as profileLoader } from './routes/profile';
import Register, { action as registerAction } from './routes/register';
import ResetPassword, {
    action as resetPasswordAction,
    loader as resetPasswordLoader,
} from './routes/reset-password';
import Users, {
    action as deleteUserAction,
    loader as usersLoader,
} from './routes/users';
import VerifyEmail, {
    loader as verifyEmailLoader,
} from './routes/verify-email';

const router = createBrowserRouter([
  {
    path: '/',
    id: 'root',
    element: <Layout />,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <LoadingOverlay label='Loading...' />,
    loader: rootLoader,
    children: [
      {
        errorElement: <ErrorPage />,
        children: [
          { index: true, element: <Home />, loader: homeLoader },
          {
            path: 'login',
            element: <Login />,
            errorElement: <Login />,
            loader: loginLoader,
            action: loginAction,
          },
          {
            path: 'register',
            element: <Register />,
            errorElement: <Register />,
            loader: loginLoader,
            action: registerAction,
          },
          {
            path: 'forgot-password',
            element: <ForgotPassword />,
            errorElement: <ForgotPassword />,
            loader: loginLoader,
            action: forgotPasswordAction,
          },
          {
            path: 'reset-password',
            element: <ResetPassword />,
            errorElement: <ResetPassword />,
            loader: resetPasswordLoader,
            action: resetPasswordAction,
          },
          {
            path: 'verify-email',
            element: <VerifyEmail />,
            errorElement: <VerifyEmail />,
            loader: verifyEmailLoader,
          },
          {
            path: 'profile',
            element: <Profile />,
            errorElement: <Profile />,
            loader: profileLoader,
          },
          {
            path: 'edit-profile',
            element: <EditProfile />,
            errorElement: <EditProfile />,
            loader: profileLoader,
            action: editProfileAction,
          },
          {
            path: 'users',
            element: <Users />,
            errorElement: <Users />,
            loader: usersLoader,
            action: deleteUserAction,
          },
          {
            path: 'create-user',
            element: <CreateUser />,
            errorElement: <CreateUser />,
            loader: createUserLoader,
            action: createUserAction,
          },
          {
            path: 'users/:userUuid',
            element: <EditUser />,
            loader: userLoader,
            action: editUserAction,
          },
        ],
      },
    ],
  },
  {
    path: '/oauth/google',
    errorElement: <ErrorPage />,
    action: googleLoginAction,
  },
  {
    path: '/oauth/facebook',
    errorElement: <ErrorPage />,
    action: facebookLoginAction,
  },
  {
    path: '/logout',
    errorElement: <ErrorPage />,
    action: logoutAction,
  },
]);

const { enableAutoPageviews } = Plausible({
  domain: appConfig.domain,
  apiHost: appConfig.plausibleApiHost,
});
enableAutoPageviews();

export default function App() {
  return (
    <React.StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </React.StrictMode>
  );
}
