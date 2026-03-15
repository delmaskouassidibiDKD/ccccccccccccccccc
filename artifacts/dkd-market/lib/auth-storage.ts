import AsyncStorage from "@react-native-async-storage/async-storage";

export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: "dkd_access_token",
  REFRESH_TOKEN: "dkd_refresh_token",
  USER: "dkd_user",
};

export function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_API_DOMAIN;
  if (domain) return `https://${domain}`;
  return "https://api.dkd-market.com";
}

let _getAccessToken: (() => Promise<string | null>) | null = null;
let _refreshAuth: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  _getAccessToken = fn;
}

export function setRefresher(fn: () => Promise<string | null>) {
  _refreshAuth = fn;
}

export function clearHandlers() {
  _getAccessToken = null;
  _refreshAuth = null;
}

export function getStoredAccessToken(): Promise<string | null> {
  if (_getAccessToken) return _getAccessToken();
  return AsyncStorage.getItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
}

export function refreshAuthToken(): Promise<string | null> {
  if (_refreshAuth) return _refreshAuth();
  return Promise.resolve(null);
}
