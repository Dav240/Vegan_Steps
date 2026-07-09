"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { LoaderCircle, Mail, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/_components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/_components/ui/dialog";

import { Switch } from "@/_components/ui/switch";

import AuthField from "@/_components/login/AuthField";
import PasswordResetRequestDialog from "@/_components/login/PasswordResetRequestDialog";
import LegalLink from "@/_components/legal/LegalLink";

import { defaultPrivacyPreferences, type PrivacyPreferences } from "@/lib/legal";
import { useSession, type CurrentUser } from "@/lib/session";

type AuthMode = "login" | "register";

const COOKIE_PREFERENCES_NAME = "vegr_cookie_preferences";

export default function LoginWindow({ open, onOpenChange, showTrigger = true, redirectAfterAuth = "/explore" }: {
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
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  const [acceptsAllergenDisclaimer, setAcceptsAllergenDisclaimer] = useState(false);
  const [personalisedRecommendations, setPersonalisedRecommendations] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [productEmails, setProductEmails] = useState(false);
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
    if (isLogin) {
      void syncStoredCookiePreferences();
    }
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setEmailCode("");
    setAcceptsTerms(false);
    setAcceptsAllergenDisclaimer(false);
    setPersonalisedRecommendations(false);
    setAnalytics(false);
    setProductEmails(false);
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

    if (!acceptsTerms || !acceptsAllergenDisclaimer) {
      setError("Please accept the required legal acknowledgements before registering.");
      return;
    }

    try {
      const response = await fetch("/api/login/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          password,
          confirmPassword,
          emailCode,
          acceptsTerms,
          acceptsAllergenDisclaimer,
          personalisedRecommendations,
          analytics,
          productEmails,
        }),
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

    if (nextMode === "register") {
      const storedPreferences = readStoredCookiePreferences();

      if (storedPreferences) {
        setPersonalisedRecommendations( storedPreferences.personalisedRecommendations );
        setAnalytics(storedPreferences.analytics);
        setProductEmails(storedPreferences.productEmails);
      }
    }
  }

  function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLogin) {
      void handleLogin();
    } else {
      void handleRegister();
    }
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

        <DialogContent showCloseButton={false}
          className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_auto_minmax(0,1fr)] gap-3 overflow-hidden border-vegr-berry-soft bg-vegr-cream p-4 text-vegr-ink sm:max-w-md sm:p-5"
        >
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-vegr-berry hover:bg-vegr-berry-soft hover:text-vegr-berry-dark">
              <X className="size-5" />
            </Button>
          </DialogClose>

          <DialogHeader>
            <DialogTitle className="font-indie-flower text-3xl font-bold text-vegr-ink sm:text-4xl">
              {isLogin ? "Login" : "Register"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 rounded-lg border border-vegr-berry-soft bg-vegr-berry-soft p-1">
            <Button type="button" variant="ghost" onClick={() => changeMode("login")} 
              className={ isLogin ? "bg-vegr-berry text-white hover:bg-vegr-berry-dark" : "text-vegr-berry-dark hover:bg-white/70" }
            >
              Login
            </Button>
            <Button type="button" variant="ghost" onClick={() => changeMode("register")}
              className={ !isLogin ? "bg-vegr-berry text-white hover:bg-vegr-berry-dark" : "text-vegr-berry-dark hover:bg-white/70" }
            >
              Register
            </Button>
          </div>

          <form onSubmit={handleAuthSubmit} className="min-h-0 space-y-3 overflow-y-auto pr-1 sm:space-y-4">
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
                    className="h-10 min-h-10 self-end whitespace-nowrap border-vegr-green bg-white px-3 py-0 text-vegr-green-dark hover:bg-vegr-green-soft">
                    {isSendingEmailCode ? ( <LoaderCircle className="size-4 animate-spin" /> ) : ( <Mail className="size-4" /> )}
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

            {!isLogin && (
              <div className="space-y-2 rounded-lg border border-vegr-berry-soft bg-white/70 p-3">
                <p className="text-sm font-bold uppercase tracking-wide text-vegr-berry">
                  Required
                </p>
                <LegalCheckbox checked={acceptsTerms} onCheckedChange={setAcceptsTerms}>
                  I agree to the{" "}
                  <LegalLink href="/legal#terms">Terms of Service</LegalLink>{" "}
                  and{" "}
                  <LegalLink href="/legal#community">
                    Community Guidelines
                  </LegalLink>
                  .
                </LegalCheckbox>
                <LegalCheckbox checked={acceptsAllergenDisclaimer} onCheckedChange={setAcceptsAllergenDisclaimer}>
                  I understand VegR contains user-submitted recipes and allergen
                  information is not guaranteed.{" "}
                  <LegalLink href="/legal#allergen-safety">
                    Read the disclaimer
                  </LegalLink>
                  .
                </LegalCheckbox>

                <div className="border-t border-vegr-berry-soft pt-3">
                  <p className="text-sm font-bold uppercase tracking-wide text-vegr-green-dark">
                    Optional
                  </p>
                  <div className="mt-2 space-y-2">
                    <OptionalConsent label="Personalised recommendations" checked={personalisedRecommendations} onCheckedChange={setPersonalisedRecommendations}/>
                    <OptionalConsent label="Analytics" checked={analytics} onCheckedChange={setAnalytics}/>
                    <OptionalConsent label="Product emails" checked={productEmails} onCheckedChange={setProductEmails}/>
                  </div>
                  <Link href="/legal#privacy" className="mt-3 inline-flex text-xs font-bold text-vegr-berry hover:text-vegr-berry-dark hover:underline">
                    Read the Privacy Policy
                  </Link>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="sticky bottom-0 -mx-1 grid grid-cols-2 gap-3 bg-vegr-cream px-1 pt-2">
              <Button type="submit" className="w-full bg-vegr-green text-white hover:bg-vegr-green-dark">
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
                <button type="button" onClick={openForgotPassword}
                  className="text-sm font-medium text-vegr-berry hover:text-vegr-berry-dark hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      <PasswordResetRequestDialog key={email} open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen} email={email}/>
    </>
  );
}

function readStoredCookiePreferences() {
  const match = document.cookie.split("; ").find((cookie) => cookie.startsWith(`${COOKIE_PREFERENCES_NAME}=`));

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(
      decodeURIComponent(match.split("=").slice(1).join("="))
    ) as PrivacyPreferences;
  } catch {
    return defaultPrivacyPreferences;
  }
}

async function syncStoredCookiePreferences() {
  const preferences = readStoredCookiePreferences();

  if (!preferences) {
    return;
  }

  try {
    await fetch("/api/profile/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });
  } catch (error) {
    console.error(error);
  }
}

function LegalCheckbox({ checked, onCheckedChange, children }: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className="flex items-start gap-2 text-sm leading-5 text-zinc-700">
      <input type="checkbox" checked={checked} onChange={(event) => onCheckedChange(event.target.checked)} className="mt-1 size-4 accent-vegr-green"/>
      <span>{children}</span>
    </label>
  );
}

function OptionalConsent({ label, checked, onCheckedChange }: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm leading-5 text-zinc-700">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange}/>
    </label>
  );
}
