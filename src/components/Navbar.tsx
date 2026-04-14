import React, { useEffect, useState } from "react";
import { Link, redirect } from "react-router-dom";
import useUserStore from "../lib/user-store";
import { isAdmin } from "../lib/user-utils";
import { IAuthenticatedUser } from "../types/custom-types";
import LoginButton from "./LoginButton";
import LogoutButton from "./LogoutButton";

function getNavItems(
  user: IAuthenticatedUser | null | undefined,
): React.JSX.Element[] {
  const registerLink = (
    <Link to="/register" id="register-link" className="text-neutral">
      Register
    </Link>
  );
  const loginLink = <LoginButton id="login-link" />;
  const usersLink = (
    <Link to="/users" id="users-link" className="text-neutral">
      Users
    </Link>
  );
  const profileLink = (
    <Link to="/profile" id="profile-link" className="text-neutral">
      Profile
    </Link>
  );
  const logoutLink = <LogoutButton id="logout-link" />;

  const unauthenticatedNavItems = [registerLink, loginLink];
  const authenticatedNavItems = [profileLink, logoutLink];
  const adminNavItems = [usersLink, ...authenticatedNavItems];

  if (user) {
    return isAdmin(user) ? adminNavItems : authenticatedNavItems;
  }
  return unauthenticatedNavItems;
}

export default function Navbar(): React.ReactElement {
  const currentUser = useUserStore((state) => state.user);
  const [navItems, setNavItems] = useState<React.JSX.Element[]>(
    getNavItems(currentUser),
  );

  useEffect(() => {
    // Re-render navItems when user changes
    const unsubscribe = useUserStore.subscribe((userState) => {
      console.log("Navbar user updated", userState.user);
      setNavItems(getNavItems(userState.user));

      // Redirect to home page on logout
      if (!userState.user) {
        console.log("User logged out, redirecting to home page");
        redirect("/");
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const navItemsList = navItems.map((item: React.JSX.Element) => {
    return <li key={item.props.id}>{item}</li>;
  });

  const closeDrawer = (): void => {
    const elem = document.activeElement as HTMLElement;
    if (elem) {
      elem?.blur();
    }
  };

  return (
    <div className="navbar">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-md dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow-sm"
            onClick={closeDrawer}
          >
            {navItemsList}
          </ul>
        </div>
        <Link to="/">
          <img src="/vite.svg" alt="Logo" className="h-10 w-10" />
        </Link>
        <Link to="/">
          <span className="pl-5 text-2xl font-semibold text-neutral">
            MyApp
          </span>
        </Link>
      </div>
      <div className="navbar-end hidden lg:flex">
        <ul className="menu menu-horizontal px-1">{navItemsList}</ul>
      </div>
    </div>
  );
}
