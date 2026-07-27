export interface User {
  id: number;
  email: string;
  role: string;
  school_id: number;
  must_change_password: boolean;
}

export interface Tenant {
  id: number;
  name: string;
  school_code: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
  tenant: Tenant;
}
