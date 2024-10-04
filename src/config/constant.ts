export const appConstant = {
  ALG: 'RS256',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  ACCESS_TOKEN_EXPIRES_AT: 'accessTokenExpiresAt',
  ID_TOKEN: 'idToken',
  MAX_USER_EVENTS_TO_STORE: 1000,
  // https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
  EMAIL_VALIDATION_REGEX:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
};

export const appMessageKeys = {
  PASSWORD_RESET_SUCCESS: 'passwordResetSuccess',
  PROFILE_UPDATE_SUCCESS: 'profileUpdateSuccess',
  PROFILE_DELETE_SUCCESS: 'profileDeleteSuccess',
  PASSWORD_CHANGE_SUCCESS: 'passwordChangeSuccess',
  USER_CREATE_SUCCESS: 'userCreateSuccess',
  USER_UPDATE_SUCCESS: 'userUpdateSuccess',
  LOGIN_SUCCESS: 'loginSuccess',
  LOGOUT_SUCCESS: 'logoutSuccess',
  REGISTER_SUCCESS: 'registerSuccess',
};

export const appMessages = {
  passwordResetSuccess:
    'Password successfully reset! Please login with your new password.',
  profileUpdateSuccess: 'Profile successfully updated!',
  profileDeleteSuccess: 'Profile successfully deleted!',
  passwordChangeSuccess: 'Password successfully updated!',
  userCreateSuccess: 'User successfully created!',
  userUpdateSuccess: 'User successfully updated!',
  loginSuccess: 'Welcome',
  loginFailedEmailNotVerified: 'Please verify your email before logging in.',
  logoutSuccess: 'Logout successful',
  registerSuccess:
    'Registration successful! Please follow the link sent to your email to verify your account.',
};
