'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cookie helpers
const setAuthCookie = (token: string, expiresInSeconds: number = 86400) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const secure = isProduction ? '; Secure' : '';
    document.cookie = `token=${token}; path=/; max-age=${expiresInSeconds}; SameSite=Strict${secure}`;
};

const clearAuthCookie = () => {
    document.cookie = 'token=; Max-Age=0; path=/;';
};

const getTokenFromCookie = (): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'));
    return match ? match[2] : null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const refreshUser = useCallback(async () => {
        const token = getTokenFromCookie();
        if (!token) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.get('/auth/me');
            // Server returns user in 'data' field, handle both formats for compatibility
            setUser(response.data.data || response.data.user);
        } catch {
            clearAuthCookie();
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        const { token, user: userData } = response.data;

        setAuthCookie(token, 86400); // 24 hours
        setUser(userData);

        return response.data;
    };

    const logout = useCallback(() => {
        clearAuthCookie();
        setUser(null);
        router.push('/login');
    }, [router]);

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Hook for checking auth on protected pages
export function useRequireAuth(redirectTo: string = '/login') {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push(redirectTo);
        }
    }, [isAuthenticated, isLoading, router, redirectTo]);

    return { isAuthenticated, isLoading };
}
