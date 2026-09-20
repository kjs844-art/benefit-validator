const fs = require("fs");
const path = require("path");

const targetFile = path.resolve(
  __dirname,
  "../node_modules/@lovable.dev/mcp-js/dist/stacks/tanstack/vite.js",
);

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, "utf8");
  const faulty =
    "if (child !== parent && !child.startsWith(parent + sep)) throw new Error(`@lovable.dev/mcp-js: ${label} must resolve under ${parent}, got ${child}`);";
  const fixed =
    "const p = resolve(parent); const c = resolve(child); if (c !== p && !c.startsWith(p + sep)) throw new Error(`@lovable.dev/mcp-js: ${label} must resolve under ${parent}, got ${child}`);";

  if (content.includes(faulty)) {
    content = content.replace(faulty, fixed);
    fs.writeFileSync(targetFile, content, "utf8");
    console.log(
      "[patch-mcp-js] Successfully patched Windows path comparison in @lovable.dev/mcp-js",
    );
  }
}
