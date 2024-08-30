import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Providers } from './components/Providers';
import ErrorPage from './error-page';
import './index.css';
import Home, { loader as homeLoader } from './routes';
import Contact, {
  loader as contactLoader,
  action as favoriteAction,
} from './routes/contact';
import { action as destroyAction } from './routes/contact-destroy';
import EditContact, { action as editAction } from './routes/contact-edit';
import CreateUser, { action as createUserAction } from './routes/create-user';
import EditProfile, {
  action as editProfileAction,
} from './routes/edit-profile';
import ForgotPassword, {
  action as forgotPasswordAction,
} from './routes/forgot-password';
import Layout from './routes/layout';
import Login, { action as loginAction } from './routes/login';
import Profile, { loader as profileLoader } from './routes/profile';
import Register, { action as registerAction } from './routes/register';
import ResetPassword, {
  action as resetPasswordAction,
  loader as resetPasswordLoader,
} from './routes/reset-password';
import Users, { loader as usersLoader, action as deleteUserAction } from './routes/users';

// TODO protected / public loader
// TODO logout form fetcher
// TODO validate formdata in action
// TODO setValue after error
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
            action: loginAction,
          },
          {
            path: 'register',
            element: <Register />,
            errorElement: <Register />,
            action: registerAction,
          },
          {
            path: 'forgot-password',
            element: <ForgotPassword />,
            errorElement: <ForgotPassword />,
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
            action: createUserAction,
          },
          {
            path: 'contacts/:contactId',
            element: <Contact />,
            loader: contactLoader,
            action: favoriteAction,
          },
          {
            path: 'contacts/:contactId/edit',
            element: <EditContact />,
            loader: contactLoader,
            action: editAction,
          },
          {
            path: 'contacts/:contactId/destroy',
            action: destroyAction,
            errorElement: <div>Oops! There was an error.</div>,
          },
        ],
      },
    ],
  },
  // {
  //   path: "contacts/:contactId",
  //   element: <Contact />,
  // },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </React.StrictMode>
);
