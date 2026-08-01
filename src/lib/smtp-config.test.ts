import assert from "node:assert/strict";
import test from "node:test";
import {
  MailerConfigurationError,
  mailDeliveryFailureCode,
  resolveSmtpConfig,
} from "./smtp-config";

test("fails closed when SMTP is not configured", () => {
  assert.throws(
    () => resolveSmtpConfig({ SMTP_HOST: " " }),
    (error) =>
      error instanceof MailerConfigurationError &&
      error.code === "SMTP_NOT_CONFIGURED",
  );
});

test("uses the public association mailbox as the default sender", () => {
  assert.equal(
    resolveSmtpConfig({ SMTP_HOST: "smtp.example.org" }).from,
    "kolping-ramsen@gmx.de",
  );
});

test("builds an authenticated SMTP configuration", () => {
  assert.deepEqual(
    resolveSmtpConfig({
      SMTP_HOST: " smtp.example.org ",
      SMTP_PORT: "465",
      SMTP_USER: "mailer",
      SMTP_PASS: "secret",
      SMTP_FROM: "kontakt@example.org",
    }),
    {
      host: "smtp.example.org",
      port: 465,
      secure: true,
      auth: { user: "mailer", pass: "secret" },
      from: "kontakt@example.org",
    },
  );
});

test("rejects invalid ports and incomplete SMTP credentials", () => {
  assert.throws(
    () => resolveSmtpConfig({ SMTP_HOST: "smtp.example.org", SMTP_PORT: "NaN" }),
    (error) =>
      error instanceof MailerConfigurationError &&
      error.code === "SMTP_PORT_INVALID",
  );
  assert.throws(
    () => resolveSmtpConfig({ SMTP_HOST: "smtp.example.org", SMTP_USER: "mailer" }),
    (error) =>
      error instanceof MailerConfigurationError &&
      error.code === "SMTP_AUTH_INCOMPLETE",
  );
});

test("classifies delivery errors without exposing their message", () => {
  const privateError = new Error(
    "550 recipient person@example.org rejected message: private content",
  );
  assert.equal(mailDeliveryFailureCode(privateError), "SMTP_DELIVERY_FAILED");
  assert.equal(
    mailDeliveryFailureCode(
      new MailerConfigurationError("SMTP_NOT_CONFIGURED", "not configured"),
    ),
    "SMTP_NOT_CONFIGURED",
  );
});
