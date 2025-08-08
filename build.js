const esbuild = require("esbuild");
const { nodeExternalsPlugin } = require("esbuild-node-externals");
const { exec } = require("child_process");

// Function to run esbuild with given options
const build = async (options) => {
  try {
    await esbuild.build({
      ...options,
      bundle: true,
      minify: true,
      platform: "neutral",
      plugins: [nodeExternalsPlugin()],
    });
    console.log(`Build successful: ${options.outfile}`);
  } catch {
    process.exit(1);
  }
};

// Build configurations for CJS and ESM
const buildOptions = [
  {
    entryPoints: ["src/index.ts"],
    outfile: "dist/bundle.cjs.js",
    format: "cjs",
  },
  {
    entryPoints: ["src/index.ts"],
    outfile: "dist/bundle.esm.js",
    format: "esm",
  },
];

// Execute builds
buildOptions.forEach(build);

// Generate type declarations
exec("tsc --emitDeclarationOnly --outDir dist", (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`);
    return;
  }
  console.log(`TypeScript declarations generated: ${stdout}`);
  if (stderr) {
    console.error(`stderr: ${stderr}`);
  }
});

// const esbuild = require("esbuild");
// const { nodeExternalsPlugin } = require("esbuild-node-externals");

// // Bundle CommonJS
// esbuild
//   .build({
//     entryPoints: ["src/index.js"],
//     bundle: true,
//     minify: true,
//     platform: "neutral",
//     outfile: "dist/bundle.cjs.js",
//     format: "cjs",
//     plugins: [nodeExternalsPlugin()],
//   })
//   .catch(() => process.exit(1));

// // Bundle ES Module
// esbuild
//   .build({
//     entryPoints: ["src/index.js"],
//     bundle: true,
//     minify: true,
//     platform: "neutral",
//     outfile: "dist/bundle.esm.js",
//     format: "esm",
//     plugins: [nodeExternalsPlugin()],
//   })
//   .catch(() => process.exit(1));
