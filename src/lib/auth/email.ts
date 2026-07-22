import { once } from "node:events";
import * as tls from "node:tls";

export type VerificationPurpose = "signup" | "login" | "forgot_password";

type MailInput = {
  to: string;
  subject: string;
  text: string;
};

const PURPOSE_TITLES: Record<VerificationPurpose, string> = {
  signup: "Complete your organization sign-up",
  login: "Verify your login",
  forgot_password: "Reset your password",
};

export async function sendVerificationEmail(to: string, code: string, purpose: VerificationPurpose) {
  const title = PURPOSE_TITLES[purpose];
  await sendMail({
    to,
    subject: `${title} code`,
    text: [
      title,
      "",
      `Your ESAME verification code is ${code}.`,
      "This code expires in 10 minutes.",
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
  });
}

export async function sendTeacherInvitationEmail(to: string, organizationName: string, inviteUrl: string) {
  await sendMail({
    to,
    subject: `${organizationName} invited you to ESAME`,
    text: [
      `You have been invited to join ${organizationName} as a teacher on ESAME.`,
      "",
      "Open this link to approve the invitation and create your password:",
      inviteUrl,
      "",
      "This invitation expires in 7 days.",
    ].join("\n"),
  });
}

async function sendMail(input: MailInput) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPassword) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD are required to send auth emails.");
  }

  const socket = tls.connect({
    host: "smtp.gmail.com",
    port: 465,
    servername: "smtp.gmail.com",
  });

  socket.setEncoding("utf8");

  let buffer = "";
  const waiters: Array<{
    resolve: (value: string) => void;
    reject: (error: Error) => void;
  }> = [];

  const flush = () => {
    const waiter = waiters[0];
    if (!waiter || !isCompleteSmtpResponse(buffer)) return;

    waiters.shift();
    const response = buffer;
    buffer = "";
    waiter.resolve(response);
  };

  socket.on("data", (chunk) => {
    buffer += chunk;
    flush();
  });

  socket.on("error", (error) => {
    const waiter = waiters.shift();
    if (waiter) waiter.reject(error);
  });

  const waitForResponse = () =>
    new Promise<string>((resolve, reject) => {
      waiters.push({ resolve, reject });
      flush();
    });

  const sendCommand = async (command: string, expectedCodes: number[]) => {
    const responsePromise = waitForResponse();
    socket.write(`${command}\r\n`);
    const response = await responsePromise;
    assertSmtpResponse(response, expectedCodes);
    return response;
  };

  try {
    await once(socket, "secureConnect");
    assertSmtpResponse(await waitForResponse(), [220]);

    await sendCommand("EHLO localhost", [250]);
    await sendCommand("AUTH LOGIN", [334]);
    await sendCommand(Buffer.from(gmailUser).toString("base64"), [334]);
    await sendCommand(Buffer.from(gmailPassword).toString("base64"), [235]);
    await sendCommand(`MAIL FROM:<${gmailUser}>`, [250]);
    await sendCommand(`RCPT TO:<${input.to}>`, [250, 251]);
    await sendCommand("DATA", [354]);

    const dataResponsePromise = waitForResponse();
    socket.write(`${buildMessage(gmailUser, input)}\r\n.\r\n`);
    assertSmtpResponse(await dataResponsePromise, [250]);

    await sendCommand("QUIT", [221]);
  } finally {
    socket.end();
  }
}

function buildMessage(fromEmail: string, input: MailInput) {
  return [
    `From: ESAME <${fromEmail}>`,
    `To: ${sanitizeHeader(input.to)}`,
    `Subject: ${sanitizeHeader(input.subject)}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    dotStuff(input.text),
  ].join("\r\n");
}

function sanitizeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function dotStuff(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");
}

function isCompleteSmtpResponse(response: string) {
  return response
    .split(/\r?\n/)
    .filter(Boolean)
    .some((line) => /^\d{3} /.test(line));
}

function assertSmtpResponse(response: string, expectedCodes: number[]) {
  const lines = response.split(/\r?\n/).filter(Boolean);
  const finalLine = [...lines].reverse().find((line) => /^\d{3} /.test(line));
  const code = finalLine ? Number(finalLine.slice(0, 3)) : 0;

  if (!expectedCodes.includes(code)) {
    throw new Error(`Gmail SMTP failed with response: ${response.trim()}`);
  }
}
