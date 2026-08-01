import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const url = (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, "");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@kolping-ramsen.de";
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail.toLowerCase() },
  });
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!existingAdmin && !adminPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required when creating the initial admin user.",
    );
  }
  if (adminPassword && adminPassword.length < 14) {
    throw new Error("SEED_ADMIN_PASSWORD must contain at least 14 characters.");
  }

  const admin = existingAdmin ?? await prisma.user.create({
    data: {
      email: adminEmail.toLowerCase(),
      name: "Administrator",
      passwordHash: await bcrypt.hash(adminPassword!, 12),
      role: "admin",
    },
  });

  console.log(`✓ Admin user: ${admin.email}`);
  console.log(existingAdmin ? "  Existing account retained." : "  Account created.");

  const newsCount = await prisma.news.count();
  if (newsCount === 0) {
    await prisma.news.create({
      data: {
        slug: "willkommen-auf-der-neuen-website",
        title: "Willkommen auf unserer neuen Website",
        date: new Date(),
        teaser:
          "Die Kolpingsfamilie Ramsen hat einen neuen Webauftritt — moderner, schneller und leichter zu pflegen.",
        content:
          "<p>Liebe Mitglieder und Freunde der Kolpingsfamilie Ramsen,</p><p>wir freuen uns, euch unsere neu gestaltete Website präsentieren zu dürfen. Hier findet ihr alle Neuigkeiten, Termine und Informationen rund um unsere Vereinsbereiche.</p>",
        published: true,
        authorId: admin.id,
      },
    });
    console.log("✓ Beispiel-News angelegt");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
