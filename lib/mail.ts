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

type BrandedEmailInput = {
  title: string;
  previewText: string;
  intro: string;
  bodyHtml: string;
  footerNote: string;
  accent?: "code" | "reset";
};

export async function sendVerificationEmail({
  to,
  code,
  subject,
  intro,
}: VerificationEmailInput) {
  await sendEmail({
    to,
    subject,
    text: `${intro}\n\nYour Vegan Steps verification code is: ${code}\n\nThis code expires in 30 minutes.\n\nIf you did not request this, you can ignore this email.`,
    html: buildBrandedEmail({
      title: "Your Vegan Steps code",
      previewText: "Use this Vegan Steps code within 30 minutes.",
      intro,
      accent: "code",
      bodyHtml: `
        <tr>
          <td style="padding: 0 32px 8px 32px;">
            <div style="border-radius: 16px; border: 1px solid #d8d0f4; background: #ede9fb; padding: 22px 18px; text-align: center;">
              <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.14em; color: #6d5aa6; text-transform: uppercase;">Verification code</div>
              <div style="margin-top: 10px; font-size: 36px; line-height: 1; font-weight: 800; letter-spacing: 0.22em; color: #241b22;">${escapeHtml(code)}</div>
            </div>
          </td>
        </tr>
      `,
      footerNote: "This code expires in 30 minutes. If you did not request it, you can ignore this email.",
    }),
  });
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: PasswordResetEmailInput) {
  await sendEmail({
    to,
    subject: "Reset your Vegan Steps password",
    text: `Use this link to reset your Vegan Steps password:\n\n${resetUrl}\n\nThis link expires in 30 minutes.`,
    html: buildBrandedEmail({
      title: "Reset your password",
      previewText: "Use this secure Vegan Steps link within 30 minutes.",
      intro: "Use the button below to choose a new password for your Vegan Steps account.",
      accent: "reset",
      bodyHtml: `
        <tr>
          <td style="padding: 0 32px 8px 32px; text-align: center;">
            <a href="${escapeHtml(resetUrl)}" style="display: inline-block; border-radius: 12px; background: #3f7d48; padding: 14px 24px; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none;">
              Reset password
            </a>
          </td>
        </tr>
        <tr>
          <td style="padding: 18px 32px 0 32px;">
            <div style="border-radius: 12px; border: 1px solid #f4d6a9; background: #fff0d9; padding: 14px 16px; color: #6f4615; font-size: 13px; line-height: 1.6;">
              If the button does not work, copy and paste this link into your browser:<br />
              <a href="${escapeHtml(resetUrl)}" style="color: #3f7d48; word-break: break-all;">${escapeHtml(resetUrl)}</a>
            </div>
          </td>
        </tr>
      `,
      footerNote: "This link expires in 30 minutes. If you did not request a password reset, you can ignore this email.",
    }),
  });
}

async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;

  if (!apiKey) {
    throw new Error("Resend email sending is not configured. Set RESEND_API_KEY.");
  }

  if (!from) {
    throw new Error("Email sender address is not configured. Set RESEND_FROM.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend could not send email: ${await getResendErrorMessage(response)}`);
  }
}

async function getResendErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as { message?: string; error?: { message?: string } };
    return body.message || body.error?.message || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
}

function buildBrandedEmail({
  title,
  previewText,
  intro,
  bodyHtml,
  footerNote,
  accent = "code",
}: BrandedEmailInput) {
  const accentColor = accent === "reset" ? "#3f7d48" : "#8b7ac8";
  const escapedPreview = escapeHtml(previewText);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin: 0; padding: 0; background: #fbfaf6; color: #241b22;">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">
      ${escapedPreview}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #fbfaf6; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif;">
      <tr>
        <td align="center" style="padding: 32px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; border-collapse: collapse;">
            <tr>
              <td style="padding: 0 0 14px 0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                  <tr>
                    <td style="width: 56px; height: 56px; border-radius: 18px; background: #3f7d48; color: #ffffff; font-size: 24px; font-weight: 800; text-align: center;">V</td>
                    <td style="padding-left: 14px;">
                      <div style="font-size: 24px; line-height: 1; font-weight: 800; color: #241b22;">Vegan Steps</div>
                      <div style="margin-top: 6px; font-size: 12px; letter-spacing: 0.12em; font-weight: 700; color: #3f7d48; text-transform: uppercase;">Vegan recipes</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="overflow: hidden; border-radius: 24px; border: 1px solid #e5f0e5; background: #ffffff; box-shadow: 0 18px 40px rgba(36, 27, 34, 0.10);">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                  <tr>
                    <td style="height: 8px; background: linear-gradient(90deg, #3f7d48 0%, #8b7ac8 52%, #f4ad4e 100%); font-size: 0; line-height: 0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 32px 12px 32px;">
                      <div style="display: inline-block; border-radius: 999px; background: #fff0d9; padding: 6px 10px; color: ${accentColor}; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;">Account security</div>
                      <h1 style="margin: 16px 0 0 0; color: #241b22; font-size: 28px; line-height: 1.2; font-weight: 800;">${escapeHtml(title)}</h1>
                      <p style="margin: 14px 0 0 0; color: #4f454d; font-size: 15px; line-height: 1.7;">${escapeHtml(intro)}</p>
                    </td>
                  </tr>
                  ${bodyHtml}
                  <tr>
                    <td style="padding: 18px 32px 30px 32px;">
                      <p style="margin: 0; color: #6b6269; font-size: 13px; line-height: 1.7;">${escapeHtml(footerNote)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding: 18px 6px 0 6px; color: #817980; font-size: 12px; line-height: 1.6; text-align: center;">
                You are receiving this email because someone used this address on Vegan Steps.
                <br />Vegan Steps will never ask you to reply with your password.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
