"use client";

import { User } from "@/types";
import { getUsers, registerUser, loginUser, deleteUser } from "@/lib/firestore";

const USER_STORAGE_KEY = "kutupweb_user";
const SESSION_STORAGE_KEY = "kutupweb_session";

export function setUser(user: User): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    sessionStorage.setItem(SESSION_STORAGE_KEY, "active");
  }
}

export function getUser(): User | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem(USER_STORAGE_KEY);
    if (userStr) {
      return JSON.parse(userStr);
    }
  }
  return null;
}

export function clearUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }
}

export function isAuthenticated(): boolean {
  if (typeof window !== "undefined") {
    return (
      sessionStorage.getItem(SESSION_STORAGE_KEY) === "active" &&
      getUser() !== null
    );
  }
  return false;
}

export function isTeacher(): boolean {
  const user = getUser();
  return user?.role === "teacher";
}

export function isStudent(): boolean {
  const user = getUser();
  return user?.role === "student";
}

// Get all users from Firestore
export async function getAllUsers(): Promise<User[]> {
  if (typeof window === "undefined") return [];
  return await getUsers();
}

// Register a new user
export async function register(
  name: string,
  username: string,
  password: string,
  role: "student" | "teacher" = "student"
): Promise<{ success: boolean; user?: User; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Kayıt işlemi tarayıcıda yapılmalıdır" };
  }

  // Validation
  if (!name.trim()) {
    return { success: false, error: "İsim gereklidir" };
  }

  if (!username.trim()) {
    return { success: false, error: "Kullanıcı adı gereklidir" };
  }

  if (username.trim().length < 3) {
    return {
      success: false,
      error: "Kullanıcı adı en az 3 karakter olmalıdır",
    };
  }

  if (!password || password.length < 6) {
    return { success: false, error: "Şifre en az 6 karakter olmalıdır" };
  }

  // Register user in Firestore
  const result = await registerUser(name, username, password, role);

  if (result.success && result.user) {
    // Auto login after registration
    setUser(result.user);
    return result;
  }

  return result;
}

// Login with username and password
export async function login(
  username: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  if (typeof window === "undefined") {
    return { success: false, error: "Giriş işlemi tarayıcıda yapılmalıdır" };
  }

  const result = await loginUser(username, password);

  if (result.success && result.user) {
    setUser(result.user);
  }

  return result;
}

// Delete a registered user from Firestore
export async function deleteRegisteredUser(userId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return await deleteUser(userId);
}
