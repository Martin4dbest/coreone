import { AxiosHeaders } from "axios";
import axios from "axios";
import { getToken } from "@/storage/auth";


const API_BASE_URL =
  "http://10.235.113.196:8000/api/v1";


const api = axios.create({

  baseURL: API_BASE_URL,

  headers: {
    "Content-Type": "application/json",
  },

  timeout: 15000,

});



api.interceptors.request.use(

async (config) => {

  const token = await getToken();

  if (!config.headers) {
    config.headers = new AxiosHeaders();
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log("========== API REQUEST ==========");
  console.log(config.method?.toUpperCase(), `${API_BASE_URL}${config.url}`);
  console.log("TOKEN:", token ? "FOUND" : "MISSING");

  return config;
},

(error) => Promise.reject(error)

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
