import "server-only";
import nodemailer from "nodemailer";

let cachedTransport: nodemailer.Transporter | null = null;

function getTransport() {
  if (cachedTransport) return cachedTransport;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  cachedTransport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return cachedTransport;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}) {
  const transport = getTransport();
  if (!transport) {
    console.warn("[mailer] SMTP_HOST not configured — logging mail instead:");
    console.warn(opts);
    return { logged: true };
  }
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? "noreply@kolping-ramsen.de",
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    replyTo: opts.replyTo,
  });
  return { logged: false };
}
