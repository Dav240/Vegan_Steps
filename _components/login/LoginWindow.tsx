"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/_components/ui/dialog";
import { useSession, type CurrentUser } from "@/lib/session";

type AuthMode = "login" | "register";

export default function LoginWindow() {
    const router = useRouter();
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
        router.replace("/profile");
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
                <Button className="font-indie-flower bg-vegr-green px-6 py-6 text-2xl text-white hover:bg-vegr-green-dark">
                    Login
                </Button>
            </DialogTrigger>

            <DialogContent className="border-vegr-berry-soft bg-vegr-cream text-vegr-ink sm:max-w-md">

            <DialogClose asChild>
                <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-vegr-berry hover:bg-vegr-berry-soft hover:text-vegr-berry-dark">
                    <X className="h-5 w-5" />
                </Button>
            </DialogClose>

            <DialogHeader>
                <DialogTitle className="font-indie-flower text-4xl font-bold text-vegr-ink">
                    {isLogin ? "Login" : "Register"}
                </DialogTitle>
            </DialogHeader>

            <div className="mt-4 grid grid-cols-2 rounded-lg border border-vegr-berry-soft bg-vegr-berry-soft p-1">
                <Button type="button" variant="ghost"
                onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccess("");
                }} className={ isLogin ? "bg-vegr-berry text-white hover:bg-vegr-berry-dark" : "text-vegr-berry-dark hover:bg-white/70"}>
                    Login
                </Button>

                <Button type="button" variant="ghost" onClick={() => {
                    setMode("register");
                    setError("");
                    setSuccess("");
                }} className={ !isLogin ? "bg-vegr-berry text-white hover:bg-vegr-berry-dark": "text-vegr-berry-dark hover:bg-white/70"}>
                    Register
                </Button>
            </div>

            <div className="mt-4 space-y-5">
                {!isLogin && (
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-zinc-700" >
                            Username
                        </Label>

                        <Input id="username" type="text" value={username} 
                        onChange={(event) => setUsername(event.target.value)} placeholder="Enter username"
                        className="border-vegr-berry-soft bg-white text-vegr-ink placeholder:text-zinc-400 focus-visible:border-vegr-green focus-visible:ring-vegr-green-soft"/>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-zinc-700">
                        Email
                    </Label>

                    <Input id="email" type="email" value={email} 
                    onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email"
                    className="border-vegr-berry-soft bg-white text-vegr-ink placeholder:text-zinc-400 focus-visible:border-vegr-green focus-visible:ring-vegr-green-soft"/>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="password" className="text-zinc-700">
                        Password
                    </Label>

                    <Input id="password" type="password" value={password}
                        onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password"
                        className="border-vegr-berry-soft bg-white text-vegr-ink placeholder:text-zinc-400 focus-visible:border-vegr-green focus-visible:ring-vegr-green-soft"/>
                </div>

                {!isLogin && (
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-zinc-700" >
                            Confirm Password
                        </Label>

                        <Input id="confirmPassword" type="password" value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm your password"
                        className="border-vegr-berry-soft bg-white text-vegr-ink placeholder:text-zinc-400 focus-visible:border-vegr-green focus-visible:ring-vegr-green-soft"/>
                    </div>
                )}

                {error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="rounded-md border border-vegr-green-soft bg-vegr-green-soft p-3 text-sm text-vegr-green-dark">
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button type="button" 
                    onClick={() => { if (isLogin) {handleLogin();} else {handleRegister();}}}
                    className="w-full bg-vegr-green text-white hover:bg-vegr-green-dark">
                        {isLogin ? "Login" : "Register"}
                    </Button>

                    <DialogClose asChild>
                        <Button type="button" variant="outline" className="w-full border-vegr-berry bg-white text-vegr-berry hover:bg-vegr-berry-soft hover:text-vegr-berry-dark">
                            Cancel
                        </Button>
                    </DialogClose>
                </div>

                {isLogin && (
                    <div className="text-center">
                        <Link href="#" className="text-sm font-medium text-vegr-berry hover:text-vegr-berry-dark hover:underline">
                            Forgot password?
                        </Link>
                    </div>
                )}
            </div>
            </DialogContent>
        </Dialog>
    );
}
