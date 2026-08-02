import axios from "axios";
import { getToken } from "@/storage/auth";


const API_BASE_URL =
  "http://10.120.64.196:8000/api/v1";


const api = axios.create({

  baseURL: API_BASE_URL,

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 15000,

});



api.interceptors.request.use(

async(config)=>{


const token =
await getToken();


console.log("========== API REQUEST ==========");
console.log(
  config.method?.toUpperCase(),
  `${API_BASE_URL}${config.url}`
);


if(config.data){

console.log(
  "BODY:",
  config.data
);

}



if(token){

config.headers.Authorization =
`Bearer ${token}`;

}


return config;


},


(error)=>{

return Promise.reject(error);

}

);



api.interceptors.response.use(

(response)=>{


console.log(
"========== API RESPONSE =========="
);

console.log(
response.status,
response.data
);


return response;


},


(error)=>{


console.log(
"========== API ERROR =========="
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


return Promise.reject(error);


}

);



export default api;
