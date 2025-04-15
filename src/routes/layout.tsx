import { useEffect } from 'react';
import {
  LoaderFunction,
  Outlet,
  redirect,
  useNavigation,
  useRouteLoaderData,
} from 'react-router-dom';
import TopBarProgress from 'react-topbar-progress-indicator';
import Navbar from '../components/Navbar';
import { clearAuthentication } from '../lib/storage';
import useUserStore from '../lib/user-store';
import { subscribeUserChangeEvents, subscribeUserChangeEventsWs } from '../lib/user_events';
import { getCurrentUserFromStorage, isAdmin } from '../lib/utils';
import { IAuthenticatedUser } from '../types/custom-types';

export const loader: LoaderFunction<any> = async () => {
  try {
    const currentUser = await getCurrentUserFromStorage();
    console.log(`===== Current user from loader: ${JSON.stringify(currentUser)} =====`);
    useUserStore.getState().setUser(currentUser);

    if (!currentUser) {
      clearAuthentication();
      return null;
    }
    return currentUser;
  } catch (error) {
    console.error(error);
    return redirect('/');
  }
};

export default function Layout() {
  const navigation = useNavigation();
  const loading = navigation.state === 'loading';
  const currentUser = useRouteLoaderData('root') as IAuthenticatedUser | null;
  const currentUserUuid = currentUser?.uuid;
  const userIsAdmin = currentUser && isAdmin(currentUser);

  useEffect(() => {
    console.log(`===== Current user: ${currentUserUuid} =====`);
    // const userChangeEventAbortController = new AbortController();
    let ws: WebSocket | null;

    if (userIsAdmin) {
      console.log('===== Subscribing to user change events =====');
      // TODO wss
      ws = new WebSocket('ws://localhost:9002/api/v1/ws/events/users');
      subscribeUserChangeEventsWs(currentUserUuid, ws);
      // subscribeUserChangeEvents(currentUserUuid, userChangeEventAbortController);
    }

    return () => {
      if (ws) {
        ws.close();
        console.log('===== WebSocket connection closed =====');
      }
      // userChangeEventAbortController.abort('User change event subscription aborted');
      // console.log(
      //   `===== Unsubscribed to user change events - signal aborted: ${userChangeEventAbortController.signal.aborted} =====`,
      // );
    };
  }, [currentUserUuid, userIsAdmin]);

  TopBarProgress.config({
    barColors: {
      '0': '#ff5350',
      '0.5': '#ff7f50',
      '1.0': '#ffab50',
    },
    barThickness: 5,
  });

  return loading ? (
    <TopBarProgress />
  ) : (
    <>
      <Navbar user={currentUser} />
      <Outlet />
    </>
  );
}
