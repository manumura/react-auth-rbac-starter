import axios, { AxiosError, AxiosResponse } from 'axios';
import { UUID } from 'node:crypto';
import appConfig from '../config/config';
import {
  IGetUsersResponse,
  InfoResponse,
  IUser,
  LoginResponse,
  MessageResponse,
} from '../types/custom-types';

const BASE_URL = appConfig.baseUrl;
const REFRESH_TOKEN_ENDPOINT = '/v1/refresh-token';

// No interceptor for refresh token
const axiosPublicInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Expires: '0',
  },
  withCredentials: true, // for cookies
});

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (!error?.config) {
      return Promise.reject(new Error('Unknown error'));
    }

    if (error.response?.status !== 401) {
      console.error('Axios interceptor error: ', error?.response?.data);
      return Promise.reject(error);
    }

    const config = error.config;
    // Avoid infinite loop
    if (config.url?.includes(`${REFRESH_TOKEN_ENDPOINT}`)) {
      return Promise.reject(error);
    }

    try {
      const response = await axios.post(
        REFRESH_TOKEN_ENDPOINT,
        {},
        {
          baseURL: `${BASE_URL}/api`,
          headers: {
            'Content-Type': 'application/json',
            Cookie: config.headers.Cookie,
          },
          withCredentials: true, // for cookies
        }
      );

      // Update cookies
      if (response?.status === 200 && response?.data) {
        config.headers.set('set-cookie', response.headers['set-cookie']);
        console.log('Token refreshed succesfully');
      }

      // retun config;
      return axiosInstance(config);
    } catch (error) {
      const err = error as AxiosError;
      console.error('Axios interceptor error: ', err?.response?.data);
      return Promise.reject(err);
    }
  }
);

////////////////////////////////////////////////////////////////
// Public APIs
export const info = async (): Promise<InfoResponse> => {
  return axiosPublicInstance.get('/v1/info').then((response) => response.data);
};

export const welcome = async (): Promise<MessageResponse> => {
  return axiosPublicInstance.get('/v1/index').then((response) => response.data);
};

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  return axiosPublicInstance
    .post('/v1/login', { email, password })
    .then((response) => response.data);
};

export const register = async (
  email: string,
  password: string,
  name: string
): Promise<IUser> => {
  return axiosPublicInstance
    .post('/v1/register', { email, password, name })
    .then((response) => response.data);
};

export const forgotPassword = async (
  email: string
): Promise<MessageResponse> => {
  return axiosPublicInstance
    .post('/v1/forgot-password', { email })
    .then((response) => response.data);
};

export const resetPassword = async (
  password: string,
  token: string
): Promise<AxiosResponse<IUser>> => {
  return axiosPublicInstance.post('/v1/new-password', { password, token });
};

export const getUserFromToken = async (
  token: string
): Promise<AxiosResponse<IUser>> => {
  return axiosPublicInstance.get(`/v1/token/${token}`);
};

export const validateRecaptcha = async (token: string): Promise<boolean> => {
  return axiosPublicInstance
    .post('/v1/recaptcha', { token })
    .then((response) => response.data);
};

////////////////////////////////////////////////////////////////
// Authenticated-only APIs
export const logout = async (): Promise<void> => {
  return axiosInstance.post('/v1/logout').then((response) => response.data);
};

export const getProfile = async (): Promise<AxiosResponse<IUser>> => {
  return axiosInstance.get('/v1/profile');
};

export const updateProfile = async (
  name: string
): Promise<AxiosResponse<IUser>> => {
  return axiosInstance.put('/v1/profile', {
    name,
  });
};

export const updatePassword = async (
  oldPassword: string,
  newPassword: string
): Promise<AxiosResponse<IUser>> => {
  return axiosInstance.put('/v1/profile/password', {
    oldPassword,
    newPassword,
  });
};

export const updateProfileImage = async (
  image: FormData,
  onUploadProgress: any
): Promise<AxiosResponse<IUser>> => {
  return axiosInstance.put('/v1/profile/image', image, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
};

export const getUsers = async (
  page: number | undefined,
  pageSize: number | undefined,
  role: string | undefined
): Promise<AxiosResponse<IGetUsersResponse>> => {
  const p: string[][] = [];
  if (page) {
    p.push(['page', page.toString()]);
  }
  if (pageSize) {
    p.push(['pageSize', pageSize.toString()]);
  }
  if (role) {
    p.push(['role', role]);
  }

  const params = new URLSearchParams(p);
  return axiosInstance.get(`/v1/users?${params}`);
};

export const getUserByUuid = async (
  uuid: UUID
): Promise<AxiosResponse<IUser>> => {
  return axiosInstance.get(`/v1/users/${uuid}`);
};

export const createUser = async (
  email: string,
  name: string,
  role: string
): Promise<AxiosResponse<IUser>> => {
  return axiosInstance.post('/v1/users', { email, name, role });
};

export const updateUser = async (
  uuid: UUID,
  name: string,
  email: string,
  role: string,
  password?: string
): Promise<AxiosResponse<IUser>> => {
  return axiosInstance.put(`/v1/users/${uuid}`, {
    name,
    email,
    role,
    ...(password ? { password } : {}),
  });
};

export const deleteUser = async (
  userUuid: UUID
): Promise<AxiosResponse<IUser>> => {
  return axiosInstance.delete(`/v1/users/${userUuid}`);
};
