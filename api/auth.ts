import { apiClient } from "./client";

export interface DashboardUser {
  id: string;
  fullName?: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponse {
  otp?: string;
  user?: DashboardUser;
  tokens?: AuthTokens;
}

export const authApi = {
  login: (payload: { email: string; password: string }) =>
    apiClient.post<unknown, AuthResponse>("/auth/login", payload),
  forgotPassword: (payload: { email: string }) =>
    apiClient.post<unknown, AuthResponse>("/auth/forgot-password", payload),
  verifyOtp: (payload: { email: string; otp: string }) =>
    apiClient.post<unknown, AuthResponse>("/auth/verify-otp", payload),
  resetPassword: (payload: {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
  }) => apiClient.post<unknown, AuthResponse>("/auth/reset-password", payload),
  me: () => apiClient.get<unknown, DashboardUser>("/auth/me"),
};
