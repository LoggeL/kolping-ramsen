import "server-only";
import nodemailer from "nodemailer";
import { resolveSmtpConfig } from "./smtp-config";

let cachedTransport:
  | { transport: nodemailer.Transporter; from: string }
  | undefined;

function getTransport() {
  if (cachedTransport) return cachedTransport;
  const config = resolveSmtpConfig(process.env);
  cachedTransport = {
    transport: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    }),
    from: config.from,
  };
  return cachedTransport;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}) {
  const { transport, from } = getTransport();
  await transport.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    replyTo: opts.replyTo,
  });
}
