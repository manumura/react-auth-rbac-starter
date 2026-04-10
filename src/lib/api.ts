import ky, { BeforeRequestState, HTTPError, KyInstance } from "ky";
import type { UUID } from "node:crypto";
import appConfig from "../config/config";
import { appConstant } from "../config/constant";
import {
  IGetUsersResponse,
  InfoResponse,
  IUser,
  LoginResponse,
  MessageResponse,
} from "../types/custom-types";
import { getCookie } from "./cookies.utils";
import { getUserFromIdToken } from "./jwt.utils";
import { clearStorage, saveIdToken } from "./storage";
import useUserStore from "./user-store";

const BASE_URL = appConfig.baseUrl;
const REFRESH_TOKEN_ENDPOINT = "v1/refresh-token";

// No retry/refresh logic for public endpoints
const httpClientPublicInstance: KyInstance = ky.create({
  prefix: `${BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  credentials: "include",
});

export const httpClientInstance: KyInstance = ky.create({
  prefix: `${BASE_URL}/api`,
  headers: {
    // "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  },
  credentials: "include",
  hooks: {
    beforeRequest: [
      (beforeRequestState: BeforeRequestState) => {
        const method = beforeRequestState.request.method.toUpperCase();
        if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
          const csrfToken = getCookie(appConstant.CSRF_COOKIE_NAME);
          if (csrfToken) {
            beforeRequestState.request.headers.set("X-CSRF-Token", csrfToken);
          }
        }
      },
    ],
    afterResponse: [
      async ({ request, response }) => {
        if (response.status !== 401) {
          return;
        }

        // Avoid infinite loop on refresh token endpoint
        if (request.url.includes(REFRESH_TOKEN_ENDPOINT)) {
          useUserStore.getState().setUser(null);
          clearStorage();
          return;
        }

        try {
          const { idToken } = await postRefreshToken();
          if (!idToken) {
            throw new Error("Failed to refresh token");
          }
          console.log('Token refreshed successfully');
          saveIdToken(idToken);
          const user = await getUserFromIdToken(idToken);
          if (!user) {
            throw new Error("Failed to get user from token");
          }
          useUserStore.getState().setUser(user);
          const newCsrfToken = getCookie(appConstant.CSRF_COOKIE_NAME);
          // Retry original request with updated CSRF token
          const retryRequest = request.clone();
          if (newCsrfToken) {
            request.headers.set("X-CSRF-Token", newCsrfToken);
          }
          console.log(
            'Retrying original request after token refresh:',
            retryRequest.method,
            retryRequest.url,
          );
          return httpClientInstance(retryRequest);
        } catch (error) {
          const err = error as HTTPError;
          console.error("retry hook error:", err);
          if (err?.response?.status === 401) {
            useUserStore.getState().setUser(null);
            clearStorage();
          }
          throw err;
        }
      },
    ],
  },
});

////////////////////////////////////////////////////////////////
// Refresh token API
const postRefreshToken = async (): Promise<LoginResponse> => {
  const csrfToken = getCookie(appConstant.CSRF_COOKIE_NAME);
  const headers: Record<string, string> = {};
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }
  return httpClientPublicInstance
    .post(REFRESH_TOKEN_ENDPOINT, { json: {}, headers })
    .json<LoginResponse>();
};

////////////////////////////////////////////////////////////////
// Public APIs
export const info = async (): Promise<InfoResponse> => {
  return httpClientPublicInstance.get("v1/info").json<InfoResponse>();
};

export const welcome = async (): Promise<MessageResponse> => {
  return httpClientPublicInstance.get("v1/index").json<MessageResponse>();
};

export const login = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  return httpClientPublicInstance
    .post("v1/login", { json: { email, password } })
    .json<LoginResponse>();
};

export const googleLogin = async (token: string): Promise<LoginResponse> => {
  return httpClientPublicInstance
    .post("v1/oauth2/google", { json: { token } })
    .json<LoginResponse>();
};

export const register = async (
  email: string,
  password: string,
  name: string,
): Promise<IUser> => {
  return httpClientPublicInstance
    .post("v1/register", { json: { email, password, name } })
    .json<IUser>();
};

export const forgotPassword = async (
  email: string,
): Promise<MessageResponse> => {
  return httpClientPublicInstance
    .post("v1/forgot-password", { json: { email } })
    .json<MessageResponse>();
};

export const resetPassword = async (
  password: string,
  token: string,
): Promise<IUser> => {
  return httpClientPublicInstance
    .post("v1/new-password", { json: { password, token } })
    .json<IUser>();
};

export const getUserFromToken = async (token: string): Promise<IUser> => {
  return httpClientPublicInstance.get(`v1/token/${token}`).json<IUser>();
};

export const verifyEmail = async (token: string): Promise<IUser> => {
  return httpClientPublicInstance
    .post("v1/verify-email", { json: { token } })
    .json<IUser>();
};

export const validateRecaptcha = async (token: string): Promise<boolean> => {
  return httpClientPublicInstance
    .post("v1/recaptcha", { json: { token } })
    .json<boolean>();
};

////////////////////////////////////////////////////////////////
// Authenticated-only APIs
export const logout = async (): Promise<void> => {
  await httpClientInstance.post("v1/logout", { json: {} });
};

export const getProfile = async (): Promise<IUser> => {
  return httpClientInstance.get("v1/profile").json<IUser>();
};

export const updateProfile = async (name: string): Promise<IUser> => {
  return httpClientInstance.put("v1/profile", { json: { name } }).json<IUser>();
};

export const deleteProfile = async (): Promise<IUser> => {
  return httpClientInstance.delete("v1/profile").json<IUser>();
};

export const updatePassword = async (
  oldPassword: string,
  newPassword: string,
): Promise<IUser> => {
  return httpClientInstance
    .put("v1/profile/password", { json: { oldPassword, newPassword } })
    .json<IUser>();
};

export const updateProfileImage = async (image: FormData): Promise<IUser> => {
  return httpClientInstance
    .put("v1/profile/image", {
      body: image,
      // headers: { "Content-Type": undefined },
    })
    .json<IUser>();
};

export const getUsers = async (
  page: number | undefined,
  pageSize: number | undefined,
  role: string | undefined,
): Promise<IGetUsersResponse> => {
  const p: string[][] = [];
  if (page) {
    p.push(["page", page.toString()]);
  }
  if (pageSize) {
    p.push(["pageSize", pageSize.toString()]);
  }
  if (role) {
    p.push(["role", role]);
  }

  const params = new URLSearchParams(p);
  return httpClientInstance.get(`v1/users?${params}`).json<IGetUsersResponse>();
};

export const getUserByUuid = async (uuid: UUID): Promise<IUser> => {
  return httpClientInstance.get(`v1/users/${uuid}`).json<IUser>();
};

export const createUser = async (
  email: string,
  name: string,
  role: string,
): Promise<IUser> => {
  return httpClientInstance
    .post("v1/users", { json: { email, name, role } })
    .json<IUser>();
};

export const updateUser = async (
  uuid: UUID,
  name: string,
  email: string,
  role: string,
  password?: string,
): Promise<IUser> => {
  return httpClientInstance
    .put(`v1/users/${uuid}`, {
      json: {
        name,
        email,
        role,
        ...(password ? { password } : {}),
      },
    })
    .json<IUser>();
};

export const deleteUser = async (userUuid: UUID): Promise<IUser> => {
  return httpClientInstance.delete(`v1/users/${userUuid}`).json<IUser>();
};
