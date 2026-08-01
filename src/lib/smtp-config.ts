export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from: string;
};

type Environment = Readonly<Record<string, string | undefined>>;

export class MailerConfigurationError extends Error {
  readonly code:
    | "SMTP_NOT_CONFIGURED"
    | "SMTP_PORT_INVALID"
    | "SMTP_AUTH_INCOMPLETE";

  constructor(
    code: MailerConfigurationError["code"],
    message: string,
  ) {
    super(message);
    this.name = "MailerConfigurationError";
    this.code = code;
  }
}

export function mailDeliveryFailureCode(error: unknown): string {
  return error instanceof MailerConfigurationError
    ? error.code
    : "SMTP_DELIVERY_FAILED";
}

export function resolveSmtpConfig(env: Environment): SmtpConfig {
  const host = env.SMTP_HOST?.trim();
  if (!host) {
    throw new MailerConfigurationError(
      "SMTP_NOT_CONFIGURED",
      "SMTP mail delivery is not configured",
    );
  }

  const port = Number(env.SMTP_PORT?.trim() || "587");
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new MailerConfigurationError(
      "SMTP_PORT_INVALID",
      "SMTP_PORT must be an integer between 1 and 65535",
    );
  }

  const user = env.SMTP_USER?.trim() || "";
  const pass = env.SMTP_PASS || "";
  if (Boolean(user) !== Boolean(pass)) {
    throw new MailerConfigurationError(
      "SMTP_AUTH_INCOMPLETE",
      "SMTP_USER and SMTP_PASS must either both be set or both be empty",
    );
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: user ? { user, pass } : undefined,
    from: env.SMTP_FROM?.trim() || "kolping-ramsen@gmx.de",
  };
}
