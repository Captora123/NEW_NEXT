import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getToken, setToken as saveToken, clearToken as removeToken } from "./api";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(getToken());
  const [, setLocation] = useLocation();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, []);

  const login = (newToken: string) => {
    saveToken(newToken);
    setToken(newToken);
    setLocation("/dashboard");
  };

  const logout = () => {
    removeToken();
    setToken(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
