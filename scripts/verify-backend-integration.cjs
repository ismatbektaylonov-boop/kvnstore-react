// Launch backend-owned test infrastructure. No server, database connection or secrets live here.
const path = require("node:path");
const { spawn } = require("node:child_process");
const backend = path.resolve(__dirname, "../../kvnstore");
const child = spawn(
  process.execPath,
  [
    path.join(backend, "scripts/verify-frontend-integration.cjs"),
    ...process.argv.slice(2),
  ],
  {
    cwd: backend,
    stdio: "inherit",
    env: { ...process.env, KVN_FRONTEND_ROOT: path.resolve(__dirname, "..") },
  },
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
});
