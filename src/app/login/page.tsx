"use client";

import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Lock, Mail, Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { authApi } from "@/api/auth";
import { toast } from "sonner";

// Cookie helper - secure cookie setting
const setAuthCookie = (token: string, expiresInSeconds: number = 86400) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const secure = isProduction ? '; Secure' : '';
    document.cookie = `token=${token}; path=/; max-age=${expiresInSeconds}; SameSite=Strict${secure}`;
};

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const data = await authApi.login(email, password);

            // Store token in cookie (24 hours expiry, secure in production)
            setAuthCookie(data.token, 86400);

            toast.success("Login successful! Redirecting...");

            // Redirect to original destination or dashboard
            const redirect = searchParams.get('redirect') || '/dashboard';
            router.push(redirect);
        } catch (error: unknown) {
            const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message 
                || "Connection to server failed. Please check if server is running.";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-lg border-zinc-200">
            <CardHeader className="space-y-1 text-center">
                <CardTitle className="text-2xl font-bold tracking-tight">Super Admin</CardTitle>
                <CardDescription>
                    Enter your credentials to access the central dashboard
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                            <Input
                                id="email"
                                placeholder="admin@bookmyseva.com"
                                type="email"
                                className="pl-9"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                className="pl-9 pr-9"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>
                    <Button className="w-full bg-zinc-900 hover:bg-zinc-800 text-white" type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Sign In
                    </Button>
                </form>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-center text-zinc-500 w-full">
                    Restricted Access. Authorized personnel only.
                </p>
            </CardFooter>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
            <Suspense fallback={
                <Card className="w-full max-w-md shadow-lg border-zinc-200">
                    <CardContent className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
                    </CardContent>
                </Card>
            }>
                <LoginForm />
            </Suspense>
        </div>
    );
}
