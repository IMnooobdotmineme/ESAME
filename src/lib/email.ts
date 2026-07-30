import nodemailer from "nodemailer";
import type { Purpose } from "./verification";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    if (!gmailUser || !gmailPass) {
      throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD");
    }
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });
  }
  return transporter;
}

function getFrom() {
  return process.env.GMAIL_FROM || process.env.GMAIL_USER!;
}

const BRAND_NAME = process.env.APP_NAME || "App";
const ACCENT = "#395886"; // matches your login/signup UI

export async function sendMail(
  to: string,
  subject: string,
  html: string,
  text: string
) {
  const info = await getTransporter().sendMail({
    from: `"${BRAND_NAME}" <${getFrom()}>`,
    to,
    subject,
    text,
    html,
    headers: {
      "X-Entity-Ref-ID": Date.now().toString(),
      "X-Mailer": BRAND_NAME,
    },
  });

  console.log("EMAIL DEBUG — to:", to);
  console.log("EMAIL DEBUG — accepted:", info.accepted);
  console.log("EMAIL DEBUG — rejected:", info.rejected);
}

const SUBJECTS: Record<Purpose, string> = {
  signup: "Your verification code",
  login: "Your verification code",
  forgot_password: "Your password reset code",
};

const HEADING: Record<Purpose, string> = {
  signup: "Verify your account",
  login: "Confirm it's you",
  forgot_password: "Reset your password",
};

const BODY_COPY: Record<Purpose, string> = {
  signup: "Use the code below to finish creating your account.",
  login: "Use the code below to finish logging in.",
  forgot_password: "Use the code below to reset your password.",
};

function layout(bodyHtml: string) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8; padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border:1px solid #e5e8ef; border-radius:12px; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif;">
          <tr>
            <td style="padding:32px 32px 8px 32px;">
              <span style="font-size:15px; font-weight:700; color:${ACCENT};">${BRAND_NAME}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 32px 32px; color:#1F2A44;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px; border-top:1px solid #eef0f4;">
              <span style="font-size:12px; color:#9aa4b8;">
                If you didn't request this, you can safely ignore this email.
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;
}

export async function sendVerificationEmail(
  to: string,
  code: string,
  purpose: Purpose
) {
  const text = `${HEADING[purpose]}\n\n${BODY_COPY[purpose]}\n\nYour code: ${code}\n\nThis code expires in 10 minutes.`;

  const html = layout(`
    <h2 style="margin:0 0 8px 0; font-size:20px; font-weight:700;">${HEADING[purpose]}</h2>
    <p style="margin:0 0 24px 0; font-size:14px; line-height:1.6; color:#4b5468;">${BODY_COPY[purpose]}</p>
    <div style="font-size:30px; font-weight:700; letter-spacing:6px; color:${ACCENT}; margin:0 0 24px 0;">
      ${code}
    </div>
    <p style="margin:0; font-size:13px; color:#9aa4b8;">This code expires in 10 minutes.</p>
  `);

  await sendMail(to, SUBJECTS[purpose], html, text);
}

export async function sendInviteEmail(
  to: string,
  link: string,
  orgName: string
) {
  const text = `You've been invited to join ${orgName}.\n\nSet up your account: ${link}\n\nThis link expires in 7 days.`;

  const html = layout(`
    <h2 style="margin:0 0 8px 0; font-size:20px; font-weight:700;">You're invited</h2>
    <p style="margin:0 0 24px 0; font-size:14px; line-height:1.6; color:#4b5468;">
      You've been invited to join <strong>${orgName}</strong> as a teacher.
    </p>
    <a href="${link}"
      style="display:inline-block; background:${ACCENT}; color:#ffffff; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:600; text-decoration:none; margin:0 0 24px 0;">
      Set up my account
    </a>
    <p style="margin:0; font-size:13px; color:#9aa4b8;">This link expires in 7 days.</p>
  `);

  await sendMail(to, `You've been invited to join ${orgName}`, html, text);
}