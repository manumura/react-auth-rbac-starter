import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useUserStore from '../lib/user-store';
import { getCurrentUserFromStorage, isAdmin } from '../lib/utils';
import { IUser } from '../types/custom-types';
import LoadingOverlay from './LoadingOverlay';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';

function getNavItems(user: IUser | null | undefined): React.JSX.Element[] {
  const navItems: React.JSX.Element[] = [];

  if (!user) {
    const registerLink = (
      <Link to='/register' id='register-link' className='text-neutral'>
        Register
      </Link>
    );
    const loginLink = <LoginButton id='login-link' />;
    navItems.push(registerLink);
    navItems.push(loginLink);
    return navItems;
  }

  if (isAdmin(user)) {
    const usersLink = (
      <Link to='/users' id='users-link' className='text-neutral'>
        Users
      </Link>
    );
    navItems.push(usersLink);
  }
  const profileLink = (
    <Link to='/profile' id='profile-link' className='text-neutral'>
      Profile
    </Link>
  );
  const logoutLink = <LogoutButton id='logout-link' />;
  navItems.push(profileLink);
  navItems.push(logoutLink);
  return navItems;
}

export default function Navbar(): React.ReactElement {
  const userStore = useUserStore();
  const [loading, setLoading] = useState(true);
  const [navItems, setNavItems] = useState<React.JSX.Element[]>([]);

  const closeDrawer = (): void => {
    const elem = document.activeElement as HTMLElement;
    if (elem) {
      elem?.blur();
    }
  };

  useEffect(() => {
    // Initialize navItems on load
    getCurrentUserFromStorage().then((currentUser) => {
      console.log('Navbar current user', currentUser);
      userStore.setUser(currentUser);
      setNavItems(getNavItems(currentUser));
      setLoading(false);
    });

    // Re-render navItems when user changes
    const unsubscribe = useUserStore.subscribe((userState) => {
      console.log('Navbar user updated', userState.user);
      setNavItems(getNavItems(userState.user));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div>
        <LoadingOverlay label='Loading...' />
      </div>
    );
  }

  const navItemsList = navItems.map((item: React.JSX.Element) => {
    return <li key={item.props.id}>{item}</li>;
  });

  // const navbar = (
  //   <div className='navbar w-full'>
  //     <div
  //       className='btn btn-square btn-ghost flex-none lg:hidden'
  //       onClick={toggleDrawer}
  //     >
  //       {/* <label htmlFor='my-drawer' className='btn btn-square btn-ghost'> */}
  //       <svg
  //         xmlns='http://www.w3.org/2000/svg'
  //         fill='none'
  //         viewBox='0 0 24 24'
  //         className='inline-block h-6 w-6 stroke-current'
  //       >
  //         <path
  //           strokeLinecap='round'
  //           strokeLinejoin='round'
  //           strokeWidth='2'
  //           d='M4 6h16M4 12h16M4 18h16'
  //         ></path>
  //       </svg>
  //       {/* </label> */}
  //     </div>
  //     <div className='mx-2 flex-1 px-2'>
  //       <div className='flex items-center'>
  //         {/* Website logo */}
  //         <Link to='/'>
  //           {/* <Image src={logo} height='20' alt='Logo' placeholder='empty' /> */}
  //           <img src='/vite.svg' alt='Logo' className='h-10 w-10' />
  //         </Link>
  //         <Link to='/'>
  //           <span className='pl-5 text-2xl font-semibold text-neutral'>
  //             MyApp
  //           </span>
  //         </Link>
  //       </div>
  //     </div>
  //     {/* Desktop menu only shows for lg and up devices */}
  //     <div className='hidden flex-none lg:block'>
  //       <ul className='menu menu-horizontal px-2'>{navItemsList}</ul>
  //     </div>
  //   </div>
  // );

  // return (
  //   <div className='drawer'>
  //     <input
  //       id='my-drawer'
  //       type='checkbox'
  //       className='drawer-toggle'
  //       checked={open}
  //       onChange={toggleDrawer}
  //     />
  //     <div className='drawer-content flex flex-col'>
  //       {navbar}
  //       <Outlet />
  //     </div>
  //     <div className='drawer-side'>
  //       <label htmlFor='my-drawer' className='drawer-overlay'></label>
  //       <ul
  //         className='menu min-h-full w-80 bg-slate-100 p-4'
  //         onClick={toggleDrawer}
  //       >
  //         {navItemsList}
  //       </ul>
  //     </div>
  //   </div>
  // );

  return (
    <div className='navbar'>
      <div className='navbar-start'>
        <div className='dropdown'>
          <div tabIndex={0} role='button' className='btn btn-ghost lg:hidden'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M4 6h16M4 12h8m-8 6h16'
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className='menu menu-md dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow'
            onClick={closeDrawer}
          >
            {navItemsList}
          </ul>
        </div>
        <Link to='/'>
          <img src='/vite.svg' alt='Logo' className='h-10 w-10' />
        </Link>
        <Link to='/'>
          <span className='pl-5 text-2xl font-semibold text-neutral'>
            MyApp
          </span>
        </Link>
      </div>
      <div className='navbar-end hidden lg:flex'>
        <ul className='menu menu-horizontal px-1'>{navItemsList}</ul>
      </div>
    </div>
  );
}
