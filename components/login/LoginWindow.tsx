"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { useSession, type CurrentUser } from "@/lib/session";

type AuthMode = "login" | "register";

export default function LoginWindow() {
    const { setCurrentUser } = useSession();

    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<AuthMode>("login");

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const isLogin = mode === "login";

    function handleSuccessfulAuth(user: CurrentUser) {
        setCurrentUser(user);
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setSuccess("");
        setError("");
        setIsOpen(false);
    }

    async function handleLogin() {
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const contentType = response.headers.get("content-type") ?? "";
            const data = contentType.includes("application/json") ? await response.json() : null;

            if (!response.ok) {
                setError(data?.error || `Login failed (${response.status}).`);
                return;
            }

            handleSuccessfulAuth(data.user);
        } catch (error) {
            console.error(error);
            setError("Could not connect to the server. Please try again.");
        }
    }

    async function handleRegister() {
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/login/register", {
                method: "POST",
                headers: { "Content-Type": "application/json", },
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    confirmPassword,
                }),
            });

            const contentType = response.headers.get("content-type") ?? "";
            const data = contentType.includes("application/json") ? await response.json() : null;

            if (!response.ok) {
                setError(data?.error || `Registration failed (${response.status}).`);
                return;
            }

            handleSuccessfulAuth(data.user);

        } catch (error) {
            console.error(error);
            setError("Could not connect to the server. Please try again.");
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="font-indie-flower bg-crimson-violet-600 px-6 py-6 text-2xl text-white hover:bg-crimson-violet-700">
                    Login
                </Button>
            </DialogTrigger>

            <DialogContent className="border-crimson-violet-800 bg-crimson-violet-950 text-crimson-violet-50 sm:max-w-md">

            <DialogClose asChild>
                <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-crimson-violet-100 hover:bg-crimson-violet-800 hover:text-white">
                    <X className="h-5 w-5" />
                </Button>
            </DialogClose>

            <DialogHeader>
                <DialogTitle className="font-indie-flower text-4xl font-bold text-crimson-violet-100">
                    {isLogin ? "Login" : "Register"}
                </DialogTitle>
            </DialogHeader>

            <div className="mt-4 grid grid-cols-2 rounded-lg border border-crimson-violet-800 bg-crimson-violet-900 p-1">
                <Button type="button" variant="ghost"
                onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccess("");
                }} className={ isLogin ? "bg-crimson-violet-600 text-white hover:bg-crimson-violet-600" : "text-crimson-violet-200 hover:bg-crimson-violet-800 hover:text-white"}>
                    Login
                </Button>

                <Button type="button" variant="ghost" onClick={() => {
                    setMode("register");
                    setError("");
                    setSuccess("");
                }} className={ !isLogin ? "bg-crimson-violet-600 text-white hover:bg-crimson-violet-600": "text-crimson-violet-200 hover:bg-crimson-violet-800 hover:text-white"}>
                    Register
                </Button>
            </div>

            <div className="mt-4 space-y-5">
                {!isLogin && (
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-crimson-violet-100" >
                            Username
                        </Label>

                        <Input id="username" type="text" value={username} 
                        onChange={(event) => setUsername(event.target.value)} placeholder="Enter username"
                        className="border-crimson-violet-700 bg-crimson-violet-50 text-crimson-violet-950 placeholder:text-dark-teal-700"/>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-crimson-violet-100">
                        Email
                    </Label>

                    <Input id="email" type="email" value={email} 
                    onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email"
                    className="border-crimson-violet-700 bg-crimson-violet-50 text-crimson-violet-950 placeholder:text-dark-teal-700"/>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password" className="text-crimson-violet-100">
                        Password
                    </Label>

                    <Input id="password" type="password" value={password}
                        onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password"
                        className="border-crimson-violet-700 bg-crimson-violet-50 text-crimson-violet-950 placeholder:text-dark-teal-700"/>
                </div>

                {!isLogin && (
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-crimson-violet-100" >
                            Confirm Password
                        </Label>

                        <Input id="confirmPassword" type="password" value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm your password"
                        className="border-crimson-violet-700 bg-crimson-violet-50 text-crimson-violet-950 placeholder:text-dark-teal-700"/>
                    </div>
                )}

                {error && (
                    <div className="rounded-md border border-deep-crimson-500 bg-deep-crimson-950/40 p-3 text-sm font-medium text-deep-crimson-300">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="rounded-md border border-dark-teal-500 bg-dark-teal-950/40 p-3 text-sm text-dark-teal-100">
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button type="button" 
                    onClick={() => { if (isLogin) {handleLogin();} else {handleRegister();}}}
                    className="w-full bg-princeton-orange-500 text-white hover:bg-princeton-orange-600">
                        {isLogin ? "Login" : "Register"}
                    </Button>

                    <DialogClose asChild>
                        <Button type="button" variant="outline" className="w-full border-crimson-violet-300 bg-transparent text-crimson-violet-100 hover:bg-crimson-violet-800 hover:text-white">
                            Cancel
                        </Button>
                    </DialogClose>
                </div>

                {isLogin && (
                    <div className="text-center">
                        <Link href="#" className="text-sm font-medium text-dark-teal-300 hover:text-dark-teal-100 hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                )}
            </div>
            </DialogContent>
        </Dialog>
    );
}
