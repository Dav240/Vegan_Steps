"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircle, Mail, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/_components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/_components/ui/dialog";

import AuthField from "@/_components/login/AuthField";
import LegalCheckbox from "@/_components/login/LegalCheckbox";
import OptionalConsentSwitch from "@/_components/login/OptionalConsentSwitch";
import PasswordResetRequestDialog from "@/_components/login/PasswordResetRequestDialog";
import PasswordRequirementsPanel from "@/_components/login/PasswordRequirementsPanel";
import PasswordVisibilityButton from "@/_components/login/PasswordVisibilityButton";
import LegalLink from "@/_components/legal/LegalLink";

import { defaultPrivacyPreferences, type PrivacyPreferences } from "@/lib/legal";
import { useSession, type CurrentUser } from "@/lib/session";

type AuthMode = "login" | "register";

const COOKIE_PREFERENCES_NAME = "vegansteps_cookie_preferences";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    setShowPassword(false);
    setShowConfirmPassword(false);
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
      const data = contentType.includes("application/json") ? await response.json() : null;

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
            <Button className="bg-brand-green px-6 py-6 font-indie-flower text-2xl text-white hover:bg-brand-green-dark">
              Login
            </Button>
          </DialogTrigger>
        )}

        <DialogContent showCloseButton={false}
          className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_auto_minmax(0,1fr)] gap-3 overflow-hidden border-brand-berry-soft bg-brand-cream p-4 text-brand-ink sm:max-w-md sm:p-5"
        >
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4 text-brand-berry hover:bg-brand-berry-soft hover:text-brand-berry-dark">
              <X className="size-5" />
            </Button>
          </DialogClose>

          <DialogHeader>
            <DialogTitle className="font-indie-flower text-3xl font-bold text-brand-ink sm:text-4xl">
              {isLogin ? "Login" : "Register"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 rounded-lg border border-brand-berry-soft bg-brand-berry-soft p-1">
            <Button type="button" variant="ghost" onClick={() => changeMode("login")} 
              className={ isLogin ? "bg-brand-berry text-white hover:bg-brand-berry-dark" : "text-brand-berry-dark hover:bg-white/70" }
            >
              Login
            </Button>
            <Button type="button" variant="ghost" onClick={() => changeMode("register")}
              className={ !isLogin ? "bg-brand-berry text-white hover:bg-brand-berry-dark" : "text-brand-berry-dark hover:bg-white/70" }
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
                    className="h-10 min-h-10 self-end whitespace-nowrap border-brand-green bg-white px-3 py-0 text-brand-green-dark hover:bg-brand-green-soft">
                    {isSendingEmailCode ? ( <LoaderCircle className="size-4 animate-spin" /> ) : ( <Mail className="size-4" /> )}
                      Send code
                  </Button>
                ) : null
              }
            />
            {!isLogin && (
              <>
                <AuthField id="register-verification-code" label="Email code" type="text" value={emailCode} placeholder="Enter 6-digit code"
                  onChange={setEmailCode}
                  autoComplete="off"
                  inputMode="numeric"
                  spellCheck={false}
                />
                {emailCodeMessage && (
                  <p className="text-sm font-medium text-brand-green-dark">
                    {emailCodeMessage}
                  </p>
                )}
              </>
            )}
            <AuthField id="password" label="Password" type={showPassword ? "text" : "password"} value={password} placeholder="Enter your password"
              onChange={setPassword}
              autoComplete={isLogin ? "current-password" : "new-password"}
              action={
                <PasswordVisibilityButton pressed={showPassword} label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((visible) => !visible)}
                />
              }
            />
            {!isLogin && (
              <AuthField id="confirmPassword" label="Confirm Password" type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                placeholder="Confirm your password"
                onChange={setConfirmPassword}
                autoComplete="new-password"
                action={
                  <PasswordVisibilityButton
                    pressed={showConfirmPassword}
                    label={
                      showConfirmPassword
                        ? "Hide confirmed password"
                        : "Show confirmed password"
                    }
                    onClick={() =>
                      setShowConfirmPassword((visible) => !visible)
                    }
                  />
                }
              />
            )}

            {!isLogin && (
              <PasswordRequirementsPanel password={password} confirmPassword={confirmPassword}/>
            )}

            {!isLogin && (
              <div className="space-y-3 rounded-lg border border-brand-green/25 bg-brand-green-soft/45 p-3">
                <p className="text-sm font-bold uppercase tracking-wide text-brand-berry">
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
                  I understand Vegan Steps contains user-submitted recipes and allergen
                  information is not guaranteed.{" "}
                  <LegalLink href="/legal#allergen-safety">
                    Read the disclaimer
                  </LegalLink>
                  .
                </LegalCheckbox>

                <div className="rounded-lg border border-brand-gold/40 bg-brand-gold-soft/60 p-3">
                  <p className="text-sm font-bold uppercase tracking-wide text-brand-green-dark">
                    Optional
                  </p>
                  <div className="mt-2 space-y-2">
                    <OptionalConsentSwitch label="Personalised recommendations" checked={personalisedRecommendations} onCheckedChange={setPersonalisedRecommendations}/>
                    <OptionalConsentSwitch label="Analytics" checked={analytics} onCheckedChange={setAnalytics}/>
                    <OptionalConsentSwitch label="Product emails" checked={productEmails} onCheckedChange={setProductEmails}/>
                  </div>
                  <Link href="/legal#privacy" className="mt-3 inline-flex text-xs font-bold text-brand-berry hover:text-brand-berry-dark hover:underline">
                    Read the FAQ
                  </Link>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="sticky bottom-0 -mx-1 grid grid-cols-2 gap-3 bg-brand-cream px-1 pt-2">
              <Button type="submit" className="w-full bg-brand-green text-white hover:bg-brand-green-dark">
                {isLogin ? "Login" : "Register"}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" 
                className="w-full border-brand-berry bg-white text-brand-berry hover:bg-brand-berry-soft hover:text-brand-berry-dark"
                >
                  Cancel
                </Button>
              </DialogClose>
            </div>

            {isLogin && (
              <div className="flex justify-start pl-1 pt-1">
                <button type="button" onClick={openForgotPassword}
                  className="text-sm font-medium text-brand-berry hover:text-brand-berry-dark hover:underline"
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
