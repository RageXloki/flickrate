import { api, tokenStorage } from "./apiClient";
import type { User } from "@/types";

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export async function login(username: string, password: string): Promise<User> {
  const { data } = await api.post<LoginResponse>("/auth/login/", { username, password });
  tokenStorage.set(data.access, data.refresh);
  return data.user;
}

export async function register(username: string, email: string, password: string, password2: string): Promise<void> {
  await api.post("/auth/register/", { username, email, password, password2 });
}

export async function logout(): Promise<void> {
  const refresh = tokenStorage.getRefresh();
  try {
    if (refresh) await api.post("/auth/logout/", { refresh });
  } finally {
    tokenStorage.clear();
  }
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<User>("/auth/me/");
  return data;
}

export async function updateProfile(patch: Partial<User>): Promise<User> {
  const { data } = await api.patch<User>("/auth/me/", patch);
  return data;
}
