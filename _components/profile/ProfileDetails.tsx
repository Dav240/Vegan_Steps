"use client";

import { useEffect, useState } from "react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/_components/ui/accordion";
import { Button } from "@/_components/ui/button";


import ProfileField from "@/_components/profile/ProfileField";
import ProfileEmailField from "@/_components/profile/ProfileEmailField";
import PasswordResetRequestDialog from "@/_components/login/PasswordResetRequestDialog";
import ProfileDangerZone from "@/_components/profile/ProfileDangerZone";
import PrivacyPreferences from "@/_components/profile/PrivacyPreferences";

import { useSession, type CurrentUser } from "@/lib/session";

type EditableField = "username" | "email";

type FieldMessage = {
  type: "error" | "success";
  text: string;
} | null;

export default function ProfileDetails() {
  const { currentUser, setCurrentUser } = useSession();
  const [username, setUsername] = useState(currentUser.username);
  const [email, setEmail] = useState(currentUser.email);
  const [pendingField, setPendingField] = useState<EditableField | null>(null);
  const [isSendingEmailCodes, setIsSendingEmailCodes] = useState(false);
  const [emailCodesSent, setEmailCodesSent] = useState(false);
  const [oldEmailCode, setOldEmailCode] = useState("");
  const [newEmailCode, setNewEmailCode] = useState("");
  const [passwordResetOpen, setPasswordResetOpen] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState<FieldMessage>(null);
  const [emailMessage, setEmailMessage] = useState<FieldMessage>(null);

  useEffect(() => {
    if (!currentUser.id || currentUser.userType === "VISITOR") {
      return;
    }

    const controller = new AbortController();

    fetch("/api/profile", {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load your profile.");
        }

        return data.user as CurrentUser;
      })
      .then((user) => {
        setCurrentUser(user);
        setUsername(user.username);
        setEmail(user.email);
        setEmailCodesSent(false);
        setOldEmailCode("");
        setNewEmailCode("");
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setUsernameMessage({
            type: "error",
            text: error.message,
          });
        }
      });

    return () => controller.abort();
  }, [currentUser.id, currentUser.userType, setCurrentUser]);

  async function updateField(field: EditableField) {
    if (!currentUser.id) {
      return;
    }

    const value = field === "username" ? username : email;
    const setMessage =
      field === "username" ? setUsernameMessage : setEmailMessage;

    setPendingField(field);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          value,
          ...(field === "email"
            ? {
                oldEmailCode,
                newEmailCode,
              }
            : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Could not update your profile.",
        });
        return;
      }

      const updatedUser = data.user as CurrentUser;
      setCurrentUser(updatedUser);
      setUsername(updatedUser.username);
      setEmail(updatedUser.email);
      if (field === "email") {
        setEmailCodesSent(false);
        setOldEmailCode("");
        setNewEmailCode("");
      }
      setMessage({
        type: "success",
        text: data.message,
      });
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Could not connect to the server. Please try again.",
      });
    } finally {
      setPendingField(null);
    }
  }

  async function sendEmailChangeCodes() {
    if (!currentUser.id) {
      return;
    }

    setIsSendingEmailCodes(true);
    setEmailCodesSent(false);
    setEmailMessage(null);
    setOldEmailCode("");
    setNewEmailCode("");

    try {
      const response = await fetch("/api/email/verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: "CHANGE_EMAIL",
          newEmail: email,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setEmailMessage({
          type: "error",
          text: data.error || "Could not send verification codes.",
        });
        return;
      }

      setEmailCodesSent(true);
      setEmailMessage({
        type: "success",
        text: data.message || "Verification codes sent.",
      });
    } catch (error) {
      console.error(error);
      setEmailMessage({
        type: "error",
        text: "Could not connect to the server. Please try again.",
      });
    } finally {
      setIsSendingEmailCodes(false);
    }
  }

  return (
    <>
      <section className="w-full pb-8">
        <h1 className="font-indie-flower text-5xl font-bold text-brand-ink">
          Profile
        </h1>

        <div className="mt-8 grid items-start gap-7 md:grid-cols-[96px_minmax(0,1fr)]">
          <div className="hidden size-24 shrink-0 items-center justify-center rounded-full border-2 border-brand-green bg-brand-green-soft font-indie-flower text-5xl font-bold text-brand-green-dark shadow-sm ring-4 ring-brand-gold-soft md:flex">
            {(username || currentUser.username || "U").charAt(0).toUpperCase()}
          </div>

          <div className="max-w-2xl">
            <Accordion
              type="multiple"
              defaultValue={["profile-details"]}
              className="space-y-4"
            >
              <AccordionItem value="profile-details">
                <AccordionTrigger>Profile Details</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6">
                    <ProfileField id="profile-username" label="Username" type="text"
                      value={username}
                      pending={pendingField === "username"}
                      message={usernameMessage}
                      onChange={setUsername}
                      onSave={() => updateField("username")}
                    />

                    <ProfileEmailField
                      email={email}
                      oldEmailCode={oldEmailCode}
                      newEmailCode={newEmailCode}
                      pending={pendingField === "email"}
                      sending={isSendingEmailCodes}
                      codesSent={emailCodesSent}
                      message={emailMessage}
                      onEmailChange={(value) => {
                        setEmail(value);
                        setEmailMessage(null);
                        setEmailCodesSent(false);
                        setOldEmailCode("");
                        setNewEmailCode("");
                      }}
                      onOldEmailCodeChange={setOldEmailCode}
                      onNewEmailCodeChange={setNewEmailCode}
                      onSendCodes={() => void sendEmailChangeCodes()}
                      onConfirm={() => updateField("email")}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPasswordResetOpen(true)}
                      className="border-brand-berry bg-white text-brand-berry shadow-sm hover:bg-brand-berry-soft hover:text-brand-berry-dark"
                    >
                      Change Password
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="privacy-choices">
                <AccordionTrigger>Privacy Choices</AccordionTrigger>
                <AccordionContent className="p-0">
                  <PrivacyPreferences />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="account-controls">
                <AccordionTrigger>Account Controls</AccordionTrigger>
                <AccordionContent className="p-0">
                  <ProfileDangerZone />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      <PasswordResetRequestDialog
        key={currentUser.email}
        open={passwordResetOpen}
        onOpenChange={setPasswordResetOpen}
        email={currentUser.email}
        title="Change password?"
        prompt="Send a password reset link to your current email address?"
        allowEmailEdit={false}
      />
    </>
  );
}

