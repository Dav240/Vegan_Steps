import nodemailer from "nodemailer";

type VerificationEmailInput = {
  to: string;
  code: string;
  subject: string;
  intro: string;
};

type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

function getGmailTransport() {
  const user = process.env.GMAIL_EMAIL;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("Gmail email sending is not configured.");
  }

  // POSTMARK_REPLACE: Replace this Gmail/Nodemailer transport with a Postmark client.
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

export async function sendVerificationEmail({
  to,
  code,
  subject,
  intro,
}: VerificationEmailInput) {
  const from = process.env.GMAIL_FROM || process.env.GMAIL_EMAIL;

  if (!from) {
    throw new Error("Email sender address is not configured.");
  }

  // POSTMARK_REPLACE: Keep this function signature and swap sendMail for Postmark sendEmail.
  await getGmailTransport().sendMail({
    from,
    to,
    subject,
    text: `${intro}\n\nYour VegR verification code is: ${code}\n\nThis code expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>${escapeHtml(intro)}</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: PasswordResetEmailInput) {
  const from = process.env.GMAIL_FROM || process.env.GMAIL_EMAIL;

  if (!from) {
    throw new Error("Email sender address is not configured.");
  }

  // POSTMARK_REPLACE: Keep this function signature and swap sendMail for Postmark sendEmail.
  await getGmailTransport().sendMail({
    from,
    to,
    subject: "Reset your VegR password",
    text: `Use this link to reset your VegR password:\n\n${resetUrl}\n\nThis link expires in 30 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <p>Use this link to reset your VegR password:</p>
        <p>
          <a href="${escapeHtml(resetUrl)}" style="display: inline-block; padding: 12px 18px; background: #2f7d46; color: #ffffff; text-decoration: none; border-radius: 8px;">
            Reset password
          </a>
        </p>
        <p>This link expires in 30 minutes.</p>
      </div>
    `,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
