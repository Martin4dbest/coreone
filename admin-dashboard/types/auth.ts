export interface User {

  id: number;

  email: string;

  full_name: string;

  role: string;

  is_active: boolean;

}

export interface LoginResponse {

  access_token: string;

  token_type: string;

}