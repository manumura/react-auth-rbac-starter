import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { action as logoutAction } from './components/LogoutButton';
import { Providers } from './components/Providers';
import ErrorPage from './error-page';
import './index.css';
import Home, { loader as homeLoader } from './routes';
import CreateUser, { loader as createUserLoader, action as createUserAction } from './routes/create-user';
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
import Layout from './routes/layout';
import Login, { loader as loginLoader, action as loginAction } from './routes/login';
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

// TODO validate formdata in action + set value when error
// TODO duplicate messages
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorPage />,
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
    path: '/logout',
    errorElement: <ErrorPage />,
    action: logoutAction,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      {/* <App /> */}
      <RouterProvider router={router} />
    </Providers>
  </React.StrictMode>
);
