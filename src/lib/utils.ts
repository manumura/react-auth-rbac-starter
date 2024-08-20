import { IUser } from "../types/custom-types";
import { getUserFromIdToken } from "./jwt.utils";
import { getSavedIdToken } from "./storage";

export const sleep = async (ms: number): Promise<void> => {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
};

export const isAdmin = (user: IUser): boolean => {
  return user && user.role === 'ADMIN';
};

export const getCurrentUserFromStorage = async (): Promise<IUser | null> => {
  const idToken = getSavedIdToken();
  const currentUser = idToken ? await getUserFromIdToken(idToken) : null;
  return currentUser;
};
