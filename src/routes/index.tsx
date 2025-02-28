import React, { useEffect } from 'react';
import { Await, useLoaderData } from 'react-router-dom';
import { toast } from 'react-toastify';
import { info, welcome } from '../lib/api';
import useMessageStore from '../lib/message-store';
import { InfoResponse, MessageResponse } from '../types/custom-types';

export async function loader() {
  const data = Promise.all([info(), welcome()]);
  return {
    data,
  };
}

export default function Home(): React.ReactElement {
  const { data } = useLoaderData() as {
    data: Promise<[InfoResponse, MessageResponse]>;
  };
  const message = useMessageStore().message;

  useEffect(() => {
    if (message) {
      const toastId = `${message.type}-${message.id}`;
      const msg = message.text;
      useMessageStore.getState().clearMessage();

      if (!toast.isActive(toastId)) {
        toast(msg, {
          type: 'success',
          position: 'bottom-right',
          toastId,
        });
      }
    }
  }, [message]);

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
            {([information, welcome]) => (
              <HomeSection information={information} welcome={welcome} />
            )}
          </Await>
        </React.Suspense>
      </div>
    </section>
  );
}

function HomeSection({
  information,
  welcome,
}: {
  readonly information: InfoResponse;
  readonly welcome: MessageResponse;
}): React.ReactElement {
  return (
    <>
      <p className='text-3xl font-semibold'>
        {welcome?.message || 'Welcome !'}
      </p>
      <p className='text-2xl font-semibold'>
        {information?.env || 'Env not found'}
      </p>
      <p className='text-2xl font-semibold'>
        {information?.userAgent || 'User Agent not found'}
      </p>
      <p className='text-2xl font-semibold'>
        {information?.ip || 'IP not found'}
      </p>
      <p className='text-2xl font-semibold'>
        {information?.hostname || 'Hostname not found'}
      </p>
    </>
  );
}
