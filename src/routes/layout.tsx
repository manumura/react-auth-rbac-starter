import { Outlet, redirect, useNavigation } from 'react-router-dom';
import TopBarProgress from 'react-topbar-progress-indicator';
import Navbar from '../components/Navbar';
import { clearAuthentication } from '../lib/storage';
import useUserStore from '../lib/user-store';
import { getCurrentUserFromStorage } from '../lib/utils';

export const loader = async () => {
  try {
    const currentUser = await getCurrentUserFromStorage();
    useUserStore.getState().setUser(currentUser);

    if (!currentUser) {
      clearAuthentication();
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
      <Navbar />
      <Outlet />
    </>
  );
}
