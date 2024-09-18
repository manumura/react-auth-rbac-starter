export type IAuthenticatedUser = {
  uuid: UUID;
  name: string;
  role: string;
};

export type IUser = {
  uuid: UUID;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  imageUrl: string;
  providers: IOauthProvider[];
};

export type IOauthProvider = {
  externalUserId: string;
  provider: OauthProvider;
  email?: string | null;
};

export type IdTokenPayload = {
  user: IUser;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  accessTokenExpiresAt: Date;
};

export type InfoResponse = {
  env: string;
  userAgent: string;
  ip: string;
};

export type MessageResponse = {
  message: string;
};

export type IGetUsersResponse = {
  elements: IUser[];
  totalElements: number;
};

export type EventMessage = {
  eventType: string;
  user: IUser;
  message: string;
};
