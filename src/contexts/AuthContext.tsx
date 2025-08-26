"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type {
  AuthState,
  AuthContextType,
  LoginCredentials,
  RegisterData,
  User,
} from "@/types/auth";

// Auth actions
type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: User }
  | { type: "LOGIN_ERROR"; payload: string }
  | { type: "REGISTER_START" }
  | { type: "REGISTER_SUCCESS"; payload: User }
  | { type: "REGISTER_ERROR"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: boolean };

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Başlangıçta loading olsun çünkü localStorage'dan kontrol ediyoruz
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
    case "REGISTER_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "LOGIN_ERROR":
    case "REGISTER_ERROR":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
};

// Auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: React.ReactNode;
}

// Local storage keys
const STORAGE_KEYS = {
  USER: "bauprodukt_auth_user",
  TOKEN: "bauprodukt_auth_token",
};

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for stored auth on mount
  useEffect(() => {
    const checkStoredAuth = async () => {
      // Skip during SSR
      if (typeof window === "undefined") {
        dispatch({ type: "SET_LOADING", payload: false });
        return;
      }

      try {
        // Supabase session kontrolü
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session check error:", error);
          dispatch({ type: "SET_LOADING", payload: false });
          return;
        }

        if (session?.user) {
          // Kullanıcı profilini al
          const { data: profileData, error: profileError } = await (supabase as any)
            .from("profiles")
            .select(
              `
              *,
              role:roles(*)
            `
            )
            .eq("user_id", session.user.id)
            .single();

          if (profileError && profileError.code !== "PGRST116") {
            console.error("Profile fetch error:", profileError);
          }

          // User objesini oluştur
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            firstName:
              profileData?.first_name ||
              session.user.user_metadata?.first_name ||
              "",
            lastName:
              profileData?.last_name ||
              session.user.user_metadata?.last_name ||
              "",
            fullName: profileData
              ? `${profileData.first_name} ${profileData.last_name}`
              : session.user.user_metadata?.full_name || "",
            role: profileData?.role?.slug === "admin" ? "admin" : "user",
            phone: profileData?.phone || "",
            avatar:
              profileData?.avatar_url || session.user.user_metadata?.avatar_url,
            createdAt: new Date(session.user.created_at),
            supabaseUser: session.user,
            profile: profileData,
            roleData: profileData?.role,
          };

          dispatch({ type: "LOGIN_SUCCESS", payload: user });
        } else {
          dispatch({ type: "SET_LOADING", payload: false });
        }
      } catch (error) {
        console.error("Auth check error:", error);
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    checkStoredAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: "LOGIN_START" });

    try {
      // Supabase Auth ile giriş
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error("Anmeldung fehlgeschlagen");
      }

      // Kullanıcı profilini al
      const { data: profileData, error: profileError } = await (supabase as any)
        .from("profiles")
        .select(
          `
          *,
          role:roles(*)
        `
        )
        .eq("user_id", data.user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Profile fetch error:", profileError);
      }

      // User objesini oluştur
      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        firstName:
          profileData?.first_name || data.user.user_metadata?.first_name || "",
        lastName:
          profileData?.last_name || data.user.user_metadata?.last_name || "",
        fullName: profileData
          ? `${profileData.first_name} ${profileData.last_name}`
          : data.user.user_metadata?.full_name || "",
        role: profileData?.role?.slug === "admin" ? "admin" : "user",
        phone: profileData?.phone || "",
        avatar: profileData?.avatar_url || data.user.user_metadata?.avatar_url,
        createdAt: new Date(data.user.created_at),
        supabaseUser: data.user,
        profile: profileData,
        roleData: profileData?.role,
      };

      // Store auth data
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      }

      dispatch({ type: "LOGIN_SUCCESS", payload: user });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Beim Anmelden ist ein Fehler aufgetreten";
      dispatch({ type: "LOGIN_ERROR", payload: errorMessage });
      throw error;
    }
  };

  // Register function
  const register = async (data: RegisterData): Promise<void> => {
    dispatch({ type: "REGISTER_START" });

    try {
      // Password confirmation kontrolü
      if (data.password !== data.confirmPassword) {
        throw new Error("Passwörter stimmen nicht überein");
      }

      // Terms acceptance kontrolü
      if (!data.acceptTerms) {
        throw new Error("Sie müssen die Nutzungsbedingungen akzeptieren");
      }

      // Supabase Auth ile kayıt
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            full_name: `${data.firstName} ${data.lastName}`,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Registrierung fehlgeschlagen");
      }

      // Default user role'ü al
      const { data: defaultRole } = await (supabase as any)
        .from("roles")
        .select("*")
        .eq("slug", "user")
        .single();

      // Kullanıcı profilini oluştur
      const { error: profileError } = await (supabase as any).from("profiles").insert({
        user_id: authData.user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        role_id: defaultRole?.id,
        is_active: true,
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }

      // User objesini oluştur
      const user: User = {
        id: authData.user.id,
        email: authData.user.email!,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.lastName}`,
        role: "user", // Default role
        phone: data.phone || "",
        createdAt: new Date(authData.user.created_at),
        supabaseUser: authData.user,
      };

      // Store auth data
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      }

      dispatch({ type: "REGISTER_SUCCESS", payload: user });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Bei der Registrierung ist ein Fehler aufgetreten";
      dispatch({ type: "REGISTER_ERROR", payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Supabase Auth ile çıkış
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Logout error:", error);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear stored auth data
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
      }

      dispatch({ type: "LOGOUT" });
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout: logout as () => void, // Type compatibility
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
