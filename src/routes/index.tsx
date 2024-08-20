import React from 'react';
import { Await, defer, useLoaderData } from 'react-router-dom';
import { info, welcome } from '../lib/api';
import { InfoResponse } from '../types/custom-types';

export async function loader() {
  const data = Promise.all([info(), welcome()]);
  return defer({
    data,
  });
}

export default function Home(): React.ReactElement {
  const { data } = useLoaderData() as { data: Promise<[InfoResponse, string]> };

  return (
    <section className='h-section bg-slate-200 pt-20'>
      <div className='mx-auto flex h-[20rem] max-w-4xl flex-col items-center justify-center rounded-md bg-slate-50'>
        <React.Suspense
          fallback={<p className='text-2xl font-semibold'>Loading...</p>}
        >
          <Await
            resolve={data}
            errorElement={
              <p className='text-2xl font-semibold'>
                Error loading information!
              </p>
            }
          >
            {([information, message]) => (
              <HomeSection information={information} message={message} />
            )}
          </Await>
        </React.Suspense>
      </div>
    </section>
  );
}

function HomeSection({
  information,
  message,
}: {
  readonly information: InfoResponse;
  readonly message: string;
}): React.ReactElement {
  return (
    <>
      <p className='text-3xl font-semibold'>{message || 'Welcome !'}</p>
      <p className='text-2xl font-semibold'>
        {information?.env || 'Env not found'}
      </p>
      <p className='text-2xl font-semibold'>
        {information?.userAgent || 'User Agent not found'}
      </p>
      <p className='text-2xl font-semibold'>
        {information?.ip || 'IP not found'}
      </p>
    </>
  );
}
