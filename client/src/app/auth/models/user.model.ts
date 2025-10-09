export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  githubConnected?: boolean;
  githubUsername?: string;
  // Add other social connections as needed
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PasswordResetData {
  token: string;
  password: string;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: { [key: string]: string[] };
}
