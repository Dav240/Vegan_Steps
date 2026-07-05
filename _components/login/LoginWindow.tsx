"use client";

import { useState, type ReactNode } from "react";
import { LoaderCircle, Mail, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/_components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/_components/ui/dialog";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";

import PasswordResetRequestDialog from "@/_components/login/PasswordResetRequestDialog";

import { useSession, type CurrentUser } from "@/lib/session";

type AuthMode = "login" | "register";

export default function LoginWindow({ open, onOpenChange, showTrigger = true, redirectAfterAuth = "/profile" }: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  redirectAfterAuth?: string | null;
}) {
  const router = useRouter();
  const { setCurrentUser } = useSession();
  const [internalOpen, setInternalOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [isSendingEmailCode, setIsSendingEmailCode] = useState(false);
  const [emailCodeMessage, setEmailCodeMessage] = useState("");
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [error, setError] = useState("");

  const isLogin = mode === "login";
  const isOpen = open ?? internalOpen;

  function updateOpen(nextOpen: boolean) {
    if (open === undefined) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  }

  function handleSuccessfulAuth(user: CurrentUser) {
    setCurrentUser(user);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setEmailCode("");
    setEmailCodeMessage("");
    setError("");
    updateOpen(false);

    if (user.userType === "MODERATOR") {
      router.replace("/moderator");
    } else if (redirectAfterAuth) {
      router.replace(redirectAfterAuth);
    }
  }

  async function handleLogin() {
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json") ? await response.json() : null;

      if (!response.ok) {
        setError(data?.error || `Login failed (${response.status}).`);
        return;
      }

      handleSuccessfulAuth(data.user);
    } catch (requestError) {
      console.error(requestError);
      setError("Could not connect to the server. Please try again.");
    }
  }

  async function handleRegister() {
    setError("");

    try {
      const response = await fetch("/api/login/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, confirmPassword, emailCode }),
      });
      const contentType = response.headers.get("content-type") ?? "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : null;

      if (!response.ok) {
        setError(data?.error || `Registration failed (${response.status}).`);
        return;
      }

      handleSuccessfulAuth(data.user);
    } catch (requestError) {
      console.error(requestError);
      setError("Could not connect to the server. Please try again.");
    }
  }

  async function sendRegisterEmailCode() {
    setError("");
    setEmailCodeMessage("");
    setIsSendingEmailCode(true);

    try {
      const response = await fetch("/api/email/verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purpose: "REGISTER", email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not send the verification code.");
        return;
      }

      setEmailCodeMessage(data.message || "Verification code sent.");
    } catch (requestError) {
      console.error(requestError);
      setError("Could not connect to the server. Please try again.");
    } finally {
      setIsSendingEmailCode(false);
    }
  }

  function openForgotPassword() {
    setForgotPasswordOpen(true);
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={updateOpen}>
        {showTrigger && (
          <DialogTrigger asChild>
            <Button className="bg-vegr-green px-6 py-6 font-indie-flower text-2xl text-white hover:bg-vegr-green-dark">
              Login
            </Button>
          </DialogTrigger>
        )}

        <DialogContent
          showCloseButton={false}
          className="border-vegr-berry-soft bg-vegr-cream text-vegr-ink sm:max-w-md"
        >
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-vegr-berry hover:bg-vegr-berry-soft hover:text-vegr-berry-dark">
              <X className="size-5" />
            </Button>
          </DialogClose>

          <DialogHeader>
            <DialogTitle className="font-indie-flower text-4xl font-bold text-vegr-ink">
              {isLogin ? "Login" : "Register"}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 grid grid-cols-2 rounded-lg border border-vegr-berry-soft bg-vegr-berry-soft p-1">
            <Button type="button" variant="ghost" onClick={() => changeMode("login")}
              className={
                isLogin ? "bg-vegr-berry text-white hover:bg-vegr-berry-dark" : "text-vegr-berry-dark hover:bg-white/70"
              }
            >
              Login
            </Button>
            <Button type="button" variant="ghost" onClick={() => changeMode("register")}
              className={ !isLogin ? "bg-vegr-berry text-white hover:bg-vegr-berry-dark" : "text-vegr-berry-dark hover:bg-white/70" }
            >
              Register
            </Button>
          </div>

          <div className="mt-4 space-y-5">
            {!isLogin && (
              <AuthField id="username" label="Username" type="text" value={username} placeholder="Enter username" onChange={setUsername}/>
            )}
            <AuthField id="email" label="Email" type="email" value={email} placeholder="Enter your email"
              onChange={(value) => {
                setEmail(value);
                setEmailCodeMessage("");
              }}
              action={
                !isLogin ? (
                  <Button type="button" variant="outline" onClick={() => void sendRegisterEmailCode()} disabled={isSendingEmailCode}
                    className="h-10 border-vegr-green bg-white px-3 text-vegr-green-dark hover:bg-vegr-green-soft">
                    {isSendingEmailCode ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Mail className="size-4" />
                    )}
                    Send code
                  </Button>
                ) : null
              }
            />
            {!isLogin && (
              <>
                <AuthField id="emailCode" label="Email code" type="text" value={emailCode} placeholder="Enter 6-digit code" onChange={setEmailCode}/>
                {emailCodeMessage && (
                  <p className="text-sm font-medium text-vegr-green-dark">
                    {emailCodeMessage}
                  </p>
                )}
              </>
            )}
            <AuthField id="password" label="Password" type="password" value={password} placeholder="Enter your password" onChange={setPassword}/>
            {!isLogin && (
              <AuthField id="confirmPassword" label="Confirm Password" type="password" value={confirmPassword} placeholder="Confirm your password" 
              onChange={setConfirmPassword}
              />
            )}

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button type="button" onClick={isLogin ? handleLogin : handleRegister} className="w-full bg-vegr-green text-white hover:bg-vegr-green-dark">
                {isLogin ? "Login" : "Register"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" 
                className="w-full border-vegr-berry bg-white text-vegr-berry hover:bg-vegr-berry-soft hover:text-vegr-berry-dark"
                >
                  Cancel
                </Button>
              </DialogClose>
            </div>

            {isLogin && (
              <div className="flex justify-start pl-1 pt-1">
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="text-sm font-medium text-vegr-berry hover:text-vegr-berry-dark hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PasswordResetRequestDialog key={email} open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen} email={email}/>
    </>
  );
}

function AuthField({ id, label, type, value, placeholder, onChange, action }: {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  action?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-zinc-700">
        {label}
      </Label>
      <div className={action ? "grid grid-cols-[minmax(0,1fr)_auto] gap-2" : undefined}>
        <Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}
          className="border-vegr-berry-soft bg-white text-vegr-ink placeholder:text-zinc-400 focus-visible:border-vegr-green focus-visible:ring-vegr-green-soft"
        />
        {action}
      </div>
    </div>
  );
}
