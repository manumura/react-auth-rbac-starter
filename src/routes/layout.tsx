import { LoaderFunction, Outlet, redirect, useNavigation, useRouteLoaderData } from 'react-router-dom';
import TopBarProgress from 'react-topbar-progress-indicator';
import Navbar from '../components/Navbar';
import { clearAuthentication } from '../lib/storage';
import useUserStore from '../lib/user-store';
import { getCurrentUserFromStorage } from '../lib/utils';
import { IAuthenticatedUser } from '../types/custom-types';

export const loader: LoaderFunction<any> = async () => {
  try {
    const currentUser = await getCurrentUserFromStorage();
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
