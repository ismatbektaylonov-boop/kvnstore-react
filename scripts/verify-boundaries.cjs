const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const buildScript = require.resolve("react-scripts/bin/react-scripts.js");
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "kvn-boundaries-"));

try {
  for (const [target, required, forbidden] of [
    ["storefront", "app/storefront/", "admin/"],
    ["admin", "admin/", "app/storefront/"],
  ]) {
    // Keep the maps used for verification outside the deployable directories.
    const directory = path.join(scratch, target);
    const result = spawnSync(process.execPath, [buildScript, "build"], {
      cwd: root,
      stdio: "inherit",
      env: {
        ...process.env,
        REACT_APP_INTERFACE: target,
        BUILD_PATH: directory,
        GENERATE_SOURCEMAP: "true",
      },
    });
    if (result.error) throw result.error;
    assert.equal(result.status, 0, `${target} verification build failed`);

    const js = path.join(directory, "static/js");
    const maps = fs.readdirSync(js).filter((file) => file.endsWith(".js.map"));
    assert.ok(maps.length, `${target} verification build has no source maps`);
    const sources = maps.flatMap(
      (file) =>
        JSON.parse(fs.readFileSync(path.join(js, file), "utf8")).sources,
    );
    assert.ok(
      sources.some((source) => source.startsWith(required)),
      `${target} is missing its intended interface`,
    );
    assert.ok(
      !sources.some((source) => source.startsWith(forbidden)),
      `${target} contains the other interface`,
    );
    assert.ok(
      !sources.some((source) =>
        /(?:^|\/)(?:mongoose|mongodb|express|bcryptjs|jsonwebtoken)(?:\/|$)|kvnstore\/src\//.test(
          source,
        ),
      ),
      `${target} contains server implementation code`,
    );
    console.log(
      `PASS: ${target} contains only its intended interface and browser dependencies`,
    );
  }
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}
