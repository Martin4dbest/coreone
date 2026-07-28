import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";


const TOKEN_KEY = "presense_token";
const USER_KEY = "presense_user";
const TENANT_KEY = "presense_tenant";


async function setItem(
key:string,
value:string
){

if(Platform.OS === "web"){

localStorage.setItem(
key,
value
);

}
else{

await SecureStore.setItemAsync(
key,
value
);

}

}



async function getItem(
key:string
){

if(Platform.OS === "web"){

return localStorage.getItem(
key
);

}


return await SecureStore.getItemAsync(
key
);


}



async function removeItem(
key:string
){

if(Platform.OS === "web"){

localStorage.removeItem(
key
);

}
else{

await SecureStore.deleteItemAsync(
key
);

}

}



export async function saveAuth(
token:string,
user:object,
tenant:object
){

await setItem(
TOKEN_KEY,
token
);


await setItem(
USER_KEY,
JSON.stringify(user)
);


await setItem(
TENANT_KEY,
JSON.stringify(tenant)
);

}



export async function getToken(){

return await getItem(
TOKEN_KEY
);

}



export async function getUser(){

const value =
await getItem(
USER_KEY
);


return value
?
JSON.parse(value)
:
null;

}



export async function getTenant(){

const value =
await getItem(
TENANT_KEY
);


return value
?
JSON.parse(value)
:
null;

}



export async function clearAuth(){

await removeItem(
TOKEN_KEY
);


await removeItem(
USER_KEY
);


await removeItem(
TENANT_KEY
);

}
