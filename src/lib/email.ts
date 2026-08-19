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
  orgName: string,
  assignments: Array<{ department: string; subject: string }> = []
) {
  const summary = assignments.length
    ? assignments.map((item) => `${item.department} • ${item.subject}`).join("<br />")
    : "No department or subject assigned yet.";

  const text = `You've been invited to join ${orgName} as a teacher.\n\n` +
    `Your assigned teaching areas:\n${assignments.length ? assignments.map((item) => `- ${item.department} • ${item.subject}`).join("\n") : "- Not assigned yet"}\n\n` +
    `To finish setup, create your password and sign in using the link below:\n${link}\n\n` +
    `What happens next:\n1. Open the invitation link.\n2. Create a secure password.\n3. Sign in as a teacher and start managing your assigned subjects and exams.\n\n` +
    `This invite link expires in 7 days. If you did not expect this email, you can safely ignore it.`;

  const html = layout(`
    <h2 style="margin:0 0 8px 0; font-size:20px; font-weight:700;">You're invited</h2>
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#4b5468;">
      You have been invited to join <strong>${orgName}</strong> as a teacher.
    </p>
    <p style="margin:0 0 12px 0; font-size:14px; line-height:1.7; color:#1F2A44;">
      <strong>Your assigned teaching areas:</strong><br />${summary}
    </p>
    <div style="margin:0 0 20px 0; padding:14px 16px; background:#f5f7fb; border:1px solid #e5e8ef; border-radius:10px; color:#1F2A44; font-size:13px; line-height:1.7;">
      <strong>Next steps:</strong><br />
      1. Open the setup link below.<br />
      2. Create a secure password.<br />
      3. Sign in and start managing your assigned department and subject work.
    </div>
    <a href="${link}"
      style="display:inline-block; background:${ACCENT}; color:#ffffff; padding:12px 24px; border-radius:8px; font-size:14px; font-weight:600; text-decoration:none; margin:0 0 20px 0;">
      Set up my account
    </a>
    <p style="margin:0 0 8px 0; font-size:13px; color:#9aa4b8;">This link expires in 7 days.</p>
    <p style="margin:0; font-size:13px; color:#9aa4b8;">If you did not expect this email, you can safely ignore it.</p>
  `);

  await sendMail(to, `You've been invited to join ${orgName}`, html, text);
}

export async function sendTeacherStatusEmail(
  to: string,
  orgName: string,
  status: "active" | "suspended"
) {
  const isActive = status === "active";
  const subject = isActive
    ? `Your account has been activated by ${orgName}`
    : `Your account has been suspended by ${orgName}`;

  const text = isActive
    ? `Your teacher account has been activated by ${orgName}. You can now log in and manage assessments.`
    : `Your teacher account has been suspended by ${orgName}. You are currently unable to log in until the organization reactivates your account.`;

  const html = layout(`
    <h2 style="margin:0 0 8px 0; font-size:20px; font-weight:700;">
      ${isActive ? "Your account is active" : "Your account is suspended"}
    </h2>
    <p style="margin:0 0 24px 0; font-size:14px; line-height:1.6; color:#4b5468;">
      ${text}
    </p>
    <p style="margin:0; font-size:13px; color:#9aa4b8;">
      Organization: <strong>${orgName}</strong>
    </p>
  `);

  await sendMail(to, subject, html, text);
}

export async function sendTeacherAssignmentEmail(
  to: string,
  orgName: string,
  assignments: Array<{ department: string; subject: string }>,
  previousAssignments: Array<{ department: string; subject: string }> = []
) {
  const key = (item: { department: string; subject: string }) => `${item.department}::${item.subject}`;
  const previousSet = new Set(previousAssignments.map(key));
  const nextSet = new Set(assignments.map(key));

  const added = assignments.filter((item) => !previousSet.has(key(item)));
  const removed = previousAssignments.filter((item) => !nextSet.has(key(item)));

  const summary = assignments.length
    ? assignments.map((item) => `${item.department} • ${item.subject}`).join("; ")
    : "No assignments";

  const addedSummary = added.length ? added.map((item) => `${item.department} • ${item.subject}`).join("; ") : "None";
  const removedSummary = removed.length ? removed.map((item) => `${item.department} • ${item.subject}`).join("; ") : "None";

  const text = `Your assignments were updated by ${orgName}.\n\n` +
    `${added.length ? `Added: ${addedSummary}\n` : ""}` +
    `${removed.length ? `Removed: ${removedSummary}\n` : ""}` +
    `Current assignments: ${summary}`;

  const html = layout(`
    <h2 style="margin:0 0 8px 0; font-size:20px; font-weight:700;">Assignment update</h2>
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#4b5468;">
      The ${orgName} organization has updated your department and subject assignments.
    </p>
    <p style="margin:0 0 10px 0; font-size:14px; line-height:1.7; color:#1F2A44;">
      <strong>Added:</strong><br />${addedSummary}
    </p>
    <p style="margin:0 0 10px 0; font-size:14px; line-height:1.7; color:#1F2A44;">
      <strong>Removed:</strong><br />${removedSummary}
    </p>
    <p style="margin:0; font-size:14px; line-height:1.7; color:#1F2A44;"><strong>Current assignments:</strong><br />${summary}</p>
  `);

  await sendMail(to, `Your assignments were updated by ${orgName}`, html, text);
}

export async function sendOrgSuspendedEmail(to: string, orgName: string) {
  const subject = `Your organization account has been suspended by Admin`;
  const text = `Your organization account (${orgName}) has been suspended by the platform administrator. Access to your organization dashboard and associated teacher accounts has been temporarily frozen. Please contact system support for assistance.`;
  const html = layout(`
    <h2 style="margin:0 0 8px 0; font-size:20px; font-weight:700; color:#b91c1c;">Organization Account Suspended</h2>
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#4b5468;">
      Your organization account <strong>${orgName}</strong> has been suspended by the platform administrator.
    </p>
    <div style="margin:0 0 20px 0; padding:14px 16px; background:#fef2f2; border:1px solid #fee2e2; border-radius:10px; color:#991b1b; font-size:13px; line-height:1.7;">
      <strong>Account status: Frozen</strong><br />
      During this suspension, organization administrators and all teachers belonging to <strong>${orgName}</strong> will not be able to log in or conduct examinations.
    </div>
    <p style="margin:0; font-size:13px; color:#9aa4b8;">If you believe this is an error, please contact platform support.</p>
  `);
  await sendMail(to, subject, html, text);
}

export async function sendOrgActivatedEmail(to: string, orgName: string) {
  const subject = `Your organization account has been activated by Admin`;
  const text = `Your organization account (${orgName}) has been activated by the platform administrator. You and your teachers can now log in and manage assessments normally.`;
  const html = layout(`
    <h2 style="margin:0 0 8px 0; font-size:20px; font-weight:700; color:#047857;">Organization Account Activated</h2>
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#4b5468;">
      Your organization account <strong>${orgName}</strong> has been activated by the platform administrator.
    </p>
    <div style="margin:0 0 20px 0; padding:14px 16px; background:#ecfdf5; border:1px solid #d1fae5; border-radius:10px; color:#065f46; font-size:13px; line-height:1.7;">
      <strong>Account status: Active</strong><br />
      Full access has been restored. You and your teachers can now sign in and access your portal normally.
    </div>
  `);
  await sendMail(to, subject, html, text);
}

export async function sendOrgDeletedEmail(to: string, orgName: string) {
  const subject = `Your organization account has been permanently deleted by Admin`;
  const text = `Your organization account (${orgName}) and all associated records have been permanently deleted by the platform administrator.`;
  const html = layout(`
    <h2 style="margin:0 0 8px 0; font-size:20px; font-weight:700; color:#b91c1c;">Organization Account Deleted</h2>
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#4b5468;">
      Your organization account <strong>${orgName}</strong> and all associated teacher accounts and records have been permanently deleted from the platform.
    </p>
  `);
  await sendMail(to, subject, html, text);
}

export async function sendTeacherOrgSuspendedEmail(to: string, orgName: string) {
  const subject = `Access Suspended: ${orgName} has been suspended by Admin`;
  const text = `Your organization (${orgName}) has been suspended by the platform administrator. Your teacher account access has been temporarily frozen. Please contact your organization administrator for more details.`;
  const html = layout(`
    <h2 style="margin:0 0 8px 0; font-size:20px; font-weight:700; color:#b91c1c;">Account Access Frozen</h2>
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#4b5468;">
      Your organization <strong>${orgName}</strong> has been suspended by the platform administrator.
    </p>
    <div style="margin:0 0 20px 0; padding:14px 16px; background:#fef2f2; border:1px solid #fee2e2; border-radius:10px; color:#991b1b; font-size:13px; line-height:1.7;">
      As a result of this organization suspension, your teacher account is temporarily frozen and you will not be able to log in until the organization is reactivated.
    </div>
    <p style="margin:0; font-size:13px; color:#9aa4b8;">Please reach out to your organization administrator for further information.</p>
  `);
  await sendMail(to, subject, html, text);
}

export async function sendTeacherOrgActivatedEmail(to: string, orgName: string) {
  const subject = `Access Restored: ${orgName} has been activated by Admin`;
  const text = `Your organization (${orgName}) has been activated by the platform administrator. Your teacher account access has been restored and you can now log in normally.`;
  const html = layout(`
    <h2 style="margin:0 0 8px 0; font-size:20px; font-weight:700; color:#047857;">Account Access Restored</h2>
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#4b5468;">
      Your organization <strong>${orgName}</strong> has been reactivated by the platform administrator.
    </p>
    <p style="margin:0 0 20px 0; font-size:14px; line-height:1.6; color:#1F2A44;">
      You can now sign in to your teacher portal and continue your assessments normally.
    </p>
  `);
  await sendMail(to, subject, html, text);
}

export async function sendTeacherOrgDeletedEmail(to: string, orgName: string) {
  const subject = `Your teacher account has been deleted`;
  const text = `Your teacher account has been deleted as your organization (${orgName}) was permanently removed by the platform administrator.`;
  const html = layout(`
    <h2 style="margin:0 0 8px 0; font-size:20px; font-weight:700; color:#b91c1c;">Account Deleted</h2>
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#4b5468;">
      Your teacher account associated with <strong>${orgName}</strong> has been deleted because the organization was removed by the platform administrator.
    </p>
  `);
  await sendMail(to, subject, html, text);
}

export async function sendAdminTeacherStatusEmail(
  to: string,
  orgName: string,
  status: "active" | "suspended"
) {
  const isActive = status === "active";
  const subject = isActive
    ? `Your teacher account has been activated by Admin`
    : `Your teacher account has been suspended by Admin`;

  const text = isActive
    ? `Your teacher account at ${orgName} has been activated by the platform administrator. You can now log in normally.`
    : `Your teacher account at ${orgName} has been suspended by the platform administrator. You are currently unable to log in until an administrator reactivates your account.`;

  const html = layout(`
    <h2 style="margin:0 0 8px 0; font-size:20px; font-weight:700; color:${isActive ? "#047857" : "#b91c1c"};">
      ${isActive ? "Teacher Account Activated by Admin" : "Teacher Account Suspended by Admin"}
    </h2>
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#4b5468;">
      ${text}
    </p>
    <p style="margin:0; font-size:13px; color:#9aa4b8;">
      Organization: <strong>${orgName}</strong>
    </p>
  `);

  await sendMail(to, subject, html, text);
}

export async function sendAdminTeacherDeletedEmail(to: string, orgName: string) {
  const subject = `Your teacher account has been deleted by Admin`;
  const text = `Your teacher account at ${orgName} has been deleted by the platform administrator.`;
  const html = layout(`
    <h2 style="margin:0 0 8px 0; font-size:20px; font-weight:700; color:#b91c1c;">Account Deleted by Admin</h2>
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#4b5468;">
      Your teacher account at <strong>${orgName}</strong> has been deleted by the platform administrator.
    </p>
  `);
  await sendMail(to, subject, html, text);
}

export async function sendOrgTeacherDeletedEmail(to: string, orgName: string) {
  const subject = `Your teacher account has been deleted by ${orgName}`;
  const text = `Your teacher account has been deleted by your organization (${orgName}).`;
  const html = layout(`
    <h2 style="margin:0 0 8px 0; font-size:20px; font-weight:700; color:#b91c1c;">Account Deleted</h2>
    <p style="margin:0 0 16px 0; font-size:14px; line-height:1.6; color:#4b5468;">
      Your teacher account has been deleted by your organization <strong>${orgName}</strong>.
    </p>
  `);
  await sendMail(to, subject, html, text);
}