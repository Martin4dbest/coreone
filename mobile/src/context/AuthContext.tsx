import {
createContext,
useContext,
useEffect,
useState,
ReactNode,
} from "react";

import api from "@/services/api";

import {
saveAuth,
getToken,
getUser,
getTenant,
clearAuth,
} from "@/storage/auth";

import {
User,
Tenant,
LoginResponse,
} from "@/types/auth";


interface AuthContextType {
user: User | null;
tenant: Tenant | null;
token: string | null;
loading: boolean;

login(
school_code: string,
email: string,
password: string
): Promise<any>;

logout(): Promise<void>;
}


const AuthContext =
createContext<AuthContextType | null>(null);



export function AuthProvider(
{ children }: { children: ReactNode }
) {


const [user, setUser] =
useState<User | null>(null);

const [tenant, setTenant] =
useState<Tenant | null>(null);

const [token, setToken] =
useState<string | null>(null);

const [loading, setLoading] =
useState(true);



useEffect(() => {

async function restoreSession() {

const savedToken =
await getToken();

const savedUser =
await getUser();

const savedTenant =
await getTenant();


setToken(savedToken);
setUser(savedUser);
setTenant(savedTenant);

setLoading(false);

}


restoreSession();

}, []);



async function login(
school_code: string,
email: string,
password: string
) {


console.log("========== MOBILE LOGIN ==========");
console.log("SCHOOL CODE:", school_code);
console.log("EMAIL:", email);


try {


const response =
await api.post<LoginResponse>(
"/auth/mobile-login",
{
school_code,
email,
password,
}
);


console.log(
"LOGIN RESPONSE:",
response.data
);



const data =
response.data;



await saveAuth(
data.access_token,
data.user,
data.tenant
);



console.log(
"AUTH SAVED SUCCESSFULLY"
);



setToken(
data.access_token
);

setUser(
data.user
);

setTenant(
data.tenant
);



return data;



} catch(error:any) {


console.log(
"========== LOGIN ERROR =========="
);


console.log(
"STATUS:",
error?.response?.status
);


console.log(
"DATA:",
error?.response?.data
);


console.log(
"MESSAGE:",
error?.message
);


throw error;


}



}



async function logout() {

await clearAuth();

setToken(null);
setUser(null);
setTenant(null);

}




return (

<AuthContext.Provider

value={{

user,
tenant,
token,
loading,
login,
logout,

}}

>

{children}

</AuthContext.Provider>

);

}




export function useAuth() {


const context =
useContext(AuthContext);


if (!context) {

throw new Error(
"useAuth must be used inside AuthProvider"
);

}


return context;


}
