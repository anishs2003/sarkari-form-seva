import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    throw new Error("Run this command from an interactive terminal.");
  }

  return new Promise((resolve, reject) => {
    let value = "";
    process.stdout.write(prompt);
    process.stdin.setEncoding("utf8");
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const finish = (error) => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
      process.stdout.write("\n");
      if (error) reject(error);
      else resolve(value);
    };

    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") return finish(new Error("Cancelled."));
        if (character === "\r" || character === "\n") return finish();
        if (character === "\u007f" || character === "\b") {
          if (value.length) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        if (character >= " ") {
          value += character;
          process.stdout.write("*");
        }
      }
    };

    process.stdin.on("data", onData);
  });
}

try {
  const password = await readHidden("Admin password (minimum 12 characters): ");
  const confirmation = await readHidden("Confirm admin password: ");
  if (password.length < 12) throw new Error("Password must contain at least 12 characters.");
  if (password !== confirmation) throw new Error("Passwords do not match.");
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  const passwordHash = `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
  const projectDirectory = join(dirname(fileURLToPath(import.meta.url)), "..");
  const envPath = join(projectDirectory, ".env.local");
  let envText = "";
  try { envText = readFileSync(envPath, "utf8"); } catch { /* Create the ignored env file if it is absent. */ }
  const lines = envText.split(/\r?\n/);
  const hashLine = `ADMIN_PASSWORD_HASH=${passwordHash}`;
  let replaced = false;
  const updatedLines = lines.map((line) => {
    if (!/^\s*ADMIN_PASSWORD_HASH\s*=/.test(line)) return line;
    if (replaced) return null;
    replaced = true;
    return hashLine;
  }).filter((line) => line !== null);
  if (!replaced) updatedLines.push(hashLine);
  const tempPath = `${envPath}.tmp`;
  writeFileSync(tempPath, updatedLines.join("\n").replace(/\n*$/, "\n"), { encoding: "utf8", mode: 0o600 });
  renameSync(tempPath, envPath);
  process.stdout.write("ADMIN_PASSWORD_HASH updated in sarkariformseva/.env.local. The hash was not printed. Restart the dev server before testing login.\n");
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : "Could not create password hash."}\n`);
  process.exitCode = 1;
}
