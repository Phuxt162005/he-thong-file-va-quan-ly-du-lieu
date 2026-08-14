const ACCESS_TOKEN_KEY = "accessToken";
const USER_KEY = "user";

export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const setAccessToken = (token) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const removeAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const getCurrentUser = () => {
  const data = localStorage.getItem(USER_KEY);
  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const setCurrentUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeCurrentUser = () => {
  localStorage.removeItem(USER_KEY);
};

export const clearAuth = () => {
  removeAccessToken();
  removeCurrentUser();
};
