import { create } from "zustand";
import { User } from "@/types/auth";


interface AuthState {

  user: User | null;

  token: string | null;

  login:
  (
    token:string,
    user:User
  ) => void;


  logout:()=>void;

}



export const useAuthStore =
create<AuthState>((set)=>({


  user:null,

  token:null,


  login:(token,user)=>{


    localStorage.setItem(
      "access_token",
      token
    );


    set({

      token,

      user

    });

  },


  logout:()=>{


    localStorage.removeItem(
      "access_token"
    );


    set({

      token:null,

      user:null

    });

  }


}));
