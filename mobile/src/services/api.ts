import axios from "axios";
import {getToken} from "@/storage/auth";


const API_BASE_URL =
"http://127.0.0.1:8000/api/v1";


const api = axios.create({

baseURL:API_BASE_URL,

headers:{
"Content-Type":"application/json",
}

});



api.interceptors.request.use(

async(config)=>{


const token =
await getToken();


if(token){

config.headers.Authorization =
`Bearer ${token}`;

}


return config;


}

);



export default api;
