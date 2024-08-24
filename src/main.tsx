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
import Layout from './routes/layout';
import Login, { action as loginAction } from './routes/login';
import Register, { action as registerAction } from './routes/register';
import ForgotPassword, { action as forgotPasswordAction } from './routes/forgot-password';

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
