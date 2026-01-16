import axios, { AxiosError, AxiosProgressEvent, AxiosResponse } from "axios";
import { UUID } from "node:crypto";
import appConfig from "../config/config";
import {
  IGetUsersResponse,
  InfoResponse,
  IUser,
  LoginResponse,
  MessageResponse,
} from "../types/custom-types";
import useCsrfTokenStore from "./csrf-token-store";
import { getUserFromIdToken } from "./jwt.utils";
import { clearAuthentication, saveAuthentication } from "./storage";
import useUserStore from "./user-store";

const BASE_URL = appConfig.baseUrl;
const REFRESH_TOKEN_ENDPOINT = "/v1/refresh-token";

// No interceptor for refresh token
const axiosPublicInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Expires: "0",
  },
  withCredentials: true, // for cookies
});

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (!error?.config) {
      return Promise.reject(new Error("Unknown error"));
    }

    if (error.response?.status !== 401) {
      console.error("Axios interceptor error: ", error?.response?.data);
      return Promise.reject(error);
    }

    const config = error.config;
    // Avoid infinite loop
    if (config.url?.includes(`${REFRESH_TOKEN_ENDPOINT}`)) {
      return Promise.reject(error);
    }

    try {
      const { accessToken, accessTokenExpiresAt, refreshToken, idToken } =
        await postRefreshToken();

      saveAuthentication(
        accessToken,
        accessTokenExpiresAt,
        refreshToken,
        idToken
      );
      const user = await getUserFromIdToken(idToken);
      if (user) {
        useUserStore.getState().setUser(user);
      }

      return axiosInstance(config);
    } catch (error) {
      const err = error as AxiosError;
      console.error(
        "Axios interceptor unexpected error: ",
        err?.response?.data
      );
      if (err?.status === 401) {
        useUserStore.getState().setUser(null);
        clearAuthentication();
      }
      return Promise.reject(err);
    }
  }
);

////////////////////////////////////////////////////////////////
// Refresh token API
const postRefreshToken = async (): Promise<LoginResponse> => {
  return await axiosPublicInstance
    .post(
      REFRESH_TOKEN_ENDPOINT,
      {},
      {
        headers: {
          "X-CSRF-Token": useCsrfTokenStore.getState().csrfToken,
        },
      }
    )
    .then((response) => {
      const headers = response?.headers;
      const csrfToken = headers["x-csrf-token"];
      if (csrfToken) {
        useCsrfTokenStore.getState().setCsrfToken(csrfToken);
      } else {
        console.error("No CSRF token in refresh token response");
      }
      return response.data;
    });
};

////////////////////////////////////////////////////////////////
// Public APIs
export const info = async (): Promise<InfoResponse> => {
  return axiosPublicInstance.get("/v1/info").then((response) => response.data);
};

export const welcome = async (): Promise<MessageResponse> => {
  return axiosPublicInstance.get("/v1/index").then((response) => response.data);
};

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  return axiosPublicInstance
    .post("/v1/login", { email, password })
    .then((response) => {
      const headers = response?.headers;
      const csrfToken = headers["x-csrf-token"];
      if (csrfToken) {
        useCsrfTokenStore.getState().setCsrfToken(csrfToken);
      } else {
        console.error("No CSRF token in login response");
      }
      return response.data;
    });
};

export const googleLogin = async (token: string): Promise<LoginResponse> => {
  return axiosPublicInstance
    .post("/v1/oauth2/google", { token })
    .then((response) => response.data);
};

export const register = async (
  email: string,
  password: string,
  name: string
): Promise<IUser> => {
  return axiosPublicInstance
    .post("/v1/register", { email, password, name })
    .then((response) => response.data);
};

export const forgotPassword = async (
  email: string
): Promise<MessageResponse> => {
  return axiosPublicInstance
    .post("/v1/forgot-password", { email })
    .then((response) => response.data);
};

export const resetPassword = async (
  password: string,
  token: string
): Promise<IUser> => {
  return axiosPublicInstance
    .post("/v1/new-password", { password, token })
    .then((response) => response.data);
};

export const getUserFromToken = async (token: string): Promise<IUser> => {
  return axiosPublicInstance
    .get(`/v1/token/${token}`)
    .then((response) => response.data);
};

export const verifyEmail = async (token: string): Promise<IUser> => {
  return axiosPublicInstance
    .post("/v1/verify-email", { token })
    .then((response) => response.data);
};

export const validateRecaptcha = async (token: string): Promise<boolean> => {
  return axiosPublicInstance
    .post("/v1/recaptcha", { token })
    .then((response) => response.data);
};

////////////////////////////////////////////////////////////////
// Authenticated-only APIs
export const logout = async (): Promise<IUser> => {
  return axiosInstance
    .post(
      "/v1/logout",
      {},
      {
        headers: {
          "X-CSRF-Token": useCsrfTokenStore.getState().csrfToken,
        },
      }
    )
    .then((response) => response.data);
};

export const getProfile = async (): Promise<IUser> => {
  return axiosInstance.get("/v1/profile").then((response) => {
    const headers = response?.headers;
    const csrfToken = headers["x-csrf-token"];
    if (csrfToken) {
      useCsrfTokenStore.getState().setCsrfToken(csrfToken);
    } else {
      console.error("No CSRF token in profile response");
    }
    return response.data;
  });
};

export const updateProfile = async (name: string): Promise<IUser> => {
  return axiosInstance
    .put(
      "/v1/profile",
      {
        name,
      },
      {
        headers: {
          "X-CSRF-Token": useCsrfTokenStore.getState().csrfToken,
        },
      }
    )
    .then((response) => response.data);
};

export const deleteProfile = async (): Promise<IUser> => {
  return axiosInstance
    .delete("/v1/profile", {
      headers: {
        "X-CSRF-Token": useCsrfTokenStore.getState().csrfToken,
      },
    })
    .then((response) => response.data);
};

export const updatePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<IUser> => {
  return axiosInstance
    .put(
      "/v1/profile/password",
      {
        oldPassword,
        newPassword,
      },
      {
        headers: {
          "X-CSRF-Token": useCsrfTokenStore.getState().csrfToken,
        },
      }
    )
    .then((response) => response.data);
};

export const updateProfileImage = async (
  image: FormData,
  onUploadProgress: (progressEvent: AxiosProgressEvent) => void
): Promise<IUser> => {
  return axiosInstance
    .put("/v1/profile/image", image, {
      headers: {
        "Content-Type": "multipart/form-data",
        "X-CSRF-Token": useCsrfTokenStore.getState().csrfToken,
      },
      onUploadProgress,
    })
    .then((response) => response.data);
};

export const getUsers = async (
  page: number | undefined,
  pageSize: number | undefined,
  role: string | undefined
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
  return axiosInstance
    .get(`/v1/users?${params}`)
    .then((response) => response.data);
};

export const getUserByUuid = async (uuid: UUID): Promise<IUser> => {
  return axiosInstance
    .get(`/v1/users/${uuid}`)
    .then((response) => response.data);
};

export const createUser = async (
  email: string,
  name: string,
  role: string
): Promise<IUser> => {
  return axiosInstance
    .post(
      "/v1/users",
      { email, name, role },
      {
        headers: {
          "X-CSRF-Token": useCsrfTokenStore.getState().csrfToken,
        },
      }
    )
    .then((response) => response.data);
};

export const updateUser = async (
  uuid: UUID,
  name: string,
  email: string,
  role: string,
  password?: string
): Promise<IUser> => {
  return axiosInstance
    .put(
      `/v1/users/${uuid}`,
      {
        name,
        email,
        role,
        ...(password ? { password } : {}),
      },
      {
        headers: {
          "X-CSRF-Token": useCsrfTokenStore.getState().csrfToken,
        },
      }
    )
    .then((response) => response.data);
};

export const deleteUser = async (userUuid: UUID): Promise<IUser> => {
  return axiosInstance
    .delete(`/v1/users/${userUuid}`, {
      headers: {
        "X-CSRF-Token": useCsrfTokenStore.getState().csrfToken,
      },
    })
    .then((response) => response.data);
};
