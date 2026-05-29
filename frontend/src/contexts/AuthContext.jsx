import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../config/api.js";

const API_BASE = API_BASE_URL;

const AuthContext = createContext(null);

const applyAuthToken = (token) => {
    if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        localStorage.setItem("token", token);
    } else {
        delete axios.defaults.headers.common["Authorization"];
        localStorage.removeItem("token");
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    // Set axios default header setiap kali token berubah
    useEffect(() => {
        applyAuthToken(token);
    }, [token]);

    // Ambil profil user saat app dimuat (jika ada token)
    const fetchMe = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await axios.get(`${API_BASE}/api/auth/me`);
            setUser(res.data.data);
        } catch {
            // Token tidak valid → logout
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchMe();
    }, [fetchMe]);

    const login = async (email, password) => {
        const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
        const { token: newToken, user: userData } = res.data.data;
        applyAuthToken(newToken);
        setToken(newToken);
        setUser(userData);
        return userData;
    };

    const register = async (name, email, password) => {
        const res = await axios.post(`${API_BASE}/api/auth/register`, { name, email, password });
        const { token: newToken, user: userData } = res.data.data;
        applyAuthToken(newToken);
        setToken(newToken);
        setUser(userData);
        return userData;
    };

    const logout = () => {
        applyAuthToken(null);
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoggedIn: !!user,
                loading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};

export default AuthContext;
