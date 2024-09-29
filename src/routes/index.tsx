import React, { useEffect } from 'react';
import { Await, defer, useLoaderData, useSearchParams } from 'react-router-dom';
import { info, welcome } from '../lib/api';
import { InfoResponse, MessageResponse } from '../types/custom-types';
import { toast } from 'react-toastify';
import { appMessageKeys, appMessages } from '../config/constant';
import useUserStore from '../lib/user-store';

export async function loader() {
  const data = Promise.all([info(), welcome()]);
  return defer({
    data,
  });
}

export default function Home(): React.ReactElement {
  const user = useUserStore().user;
  const { data } = useLoaderData() as { data: Promise<[InfoResponse, string]> };
  const [searchParams, setSearchParams] = useSearchParams();
  const msg = searchParams.get('msg');
  const time = searchParams.get('t');

  useEffect(() => {
    if (msg) {
      const toastId = `${msg}-${time}`;
      let message = appMessages[msg as keyof typeof appMessages];
      if (msg === appMessageKeys.LOGIN_SUCCESS) {
        message += ` ${user?.name}`;
      }
      setSearchParams({});
      
      if (!toast.isActive(toastId)) {
        toast(message, {
          type: 'success',
          position: 'bottom-right',
          toastId,
        });
      }
    }
  }, [msg]);

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
      <p className='text-3xl font-semibold'>{welcome?.message || 'Welcome !'}</p>
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
