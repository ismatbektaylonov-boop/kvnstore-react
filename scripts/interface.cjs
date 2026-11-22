const { spawn } = require("node:child_process");
const path = require("node:path");
const [target, command, demo] = process.argv.slice(2);
if (
  !["storefront", "admin"].includes(target) ||
  !["start", "build"].includes(command) ||
  (demo !== undefined &&
    (demo !== "--demo" || target !== "storefront" || command !== "start"))
) {
  throw new Error(
    "Usage: node scripts/interface.cjs <storefront|admin> <start|build>",
  );
}
const child = spawn(
  process.execPath,
  [require.resolve("react-scripts/bin/react-scripts.js"), command],
  {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
    env: {
      ...process.env,
      REACT_APP_INTERFACE: target,
      ...(demo === "--demo" ? { REACT_APP_ENABLE_DEMO_PAYMENTS: "true" } : {}),
      ...(command === "start"
        ? { PORT: process.env.PORT || (target === "admin" ? "3002" : "3000") }
        : {}),
      ...(command === "build"
        ? {
            BUILD_PATH: target === "admin" ? "build-admin" : "build",
            GENERATE_SOURCEMAP: "false",
          }
        : {}),
    },
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
