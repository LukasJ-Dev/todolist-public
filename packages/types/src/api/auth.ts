export interface SignupBody {
  name: string;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    _id: string;
    name: string;
    email: string;
  };
  token: string;
}
