import { useRouteError, useRouteLoaderData } from 'react-router-dom';
import Navbar from './components/Navbar';
import { IAuthenticatedUser } from './types/custom-types';

export default function ErrorPage() {
  const currentUser = useRouteLoaderData('root') as IAuthenticatedUser | null;
  const error: any = useRouteError();
  console.error(error);

  return (
    <>
    <Navbar user={currentUser} />
    <section id='error-page' className='h-section bg-slate-200 pt-20'>
      <div className='mx-auto flex h-[20rem] max-w-4xl flex-col items-center justify-center rounded-md bg-slate-50'>
        <div>
          <h1 className='text-2xl font-semibold'>Oops!</h1>
          <p className='text-xl font-semibold'>Sorry, an unexpected error has occurred.</p>
          <p className='text-xl font-semibold'>
            <i>{error.statusText || error.message}</i>
          </p>
        </div>
      </div>
    </section>
    </>
  );
}
