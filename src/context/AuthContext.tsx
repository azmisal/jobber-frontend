import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { IUserLogin, IUserSignup } from "@/interfaces/UserInterfaces";
import { API, createApiClient } from "../api/api";
import { tokenStore } from "../lib/tokenStore";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
    isAuthenticated: boolean;
    user: any;
    authLoading: boolean;
    actionLoading: boolean;
    signup: (data: IUserSignup) => Promise<any>;
    login: (data: IUserLogin) => Promise<void>;
    logout: (user_id: string) => Promise<void>;
    refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

    const [user, setUser] = useState<any>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const navigate = useNavigate();
    /* ---------------- INIT AUTH ---------------- */
    const didInitAuth = useRef(false);

    useEffect(() => {
        if (didInitAuth.current) return;
        didInitAuth.current = true;

        const initAuth = async () => {
            try {
                let token = tokenStore().getToken();

                if (!token) {
                    await refreshToken();
                    token = tokenStore().getToken();
                }
                setIsAuthenticated(!!token);

            } catch {
                tokenStore().clearToken();
                setUser(null);
                setIsAuthenticated(false);

            } finally {
                setAuthLoading(false);
            }
        };

        initAuth();
    }, []);


    /* ---------------- AUTH ACTIONS ---------------- */

    const signup = async (data: IUserSignup) => {
        const response = await API.post("/auth/signup", data);
        return response.data;
    };

    const login = async (data: IUserLogin) => {
        setActionLoading(true);
        try {
            const response = await API.post("/auth/login", data);
            const { message, user, accessToken } = response.data;
            tokenStore().setToken(accessToken);
            setUser(user);
            setIsAuthenticated(true);
        } finally {
            setActionLoading(false);
        }
    };

    const logout = async (user_Id: string) => {
        setActionLoading(true);
        try {
            const token = tokenStore().getToken();
            if (token) {
                const apiClient = createApiClient(token);
                await apiClient.post("/auth/logout", { user_Id: user_Id });
            }
        } finally {
            tokenStore().clearToken();
            setUser(null);
            setIsAuthenticated(false);
            setActionLoading(false);
        }
    };

    const refreshToken = async () => {
        try {
            console.log("Refreshing token...");
            const response = await API.post(
                "/auth/refresh",
                {},
                { withCredentials: true }
            );
            const { message, user, accessToken } = response.data;
            tokenStore().setToken(accessToken);
            setUser(user);
            setIsAuthenticated(true);
        }
        catch (error: any) {
            console.log(error);
            tokenStore().clearToken();
            setUser(null);
            setIsAuthenticated(false);
            navigate("/");
        }

    };

    const value = useMemo(
        () => ({
            user,
            isAuthenticated,
            authLoading,
            actionLoading,
            signup,
            login,
            logout,
            refreshToken,
        }),
        [isAuthenticated, authLoading, actionLoading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};