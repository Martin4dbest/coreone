import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "presense_token";
const USER_KEY = "presense_user";
const TENANT_KEY = "presense_tenant";


export async function saveAuth(
  token: string,
  user: object,
  tenant: object
) {
  await SecureStore.setItemAsync(
    TOKEN_KEY,
    token
  );

  await SecureStore.setItemAsync(
    USER_KEY,
    JSON.stringify(user)
  );

  await SecureStore.setItemAsync(
    TENANT_KEY,
    JSON.stringify(tenant)
  );
}


export async function getToken() {
  return await SecureStore.getItemAsync(
    TOKEN_KEY
  );
}


export async function getUser() {
  const value =
    await SecureStore.getItemAsync(USER_KEY);

  return value
    ? JSON.parse(value)
    : null;
}


export async function getTenant() {
  const value =
    await SecureStore.getItemAsync(TENANT_KEY);

  return value
    ? JSON.parse(value)
    : null;
}


export async function clearAuth() {
  await SecureStore.deleteItemAsync(
    TOKEN_KEY
  );

  await SecureStore.deleteItemAsync(
    USER_KEY
  );

  await SecureStore.deleteItemAsync(
    TENANT_KEY
  );
}
