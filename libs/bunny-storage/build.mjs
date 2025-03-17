import path from 'node:path'
import { readFile } from 'fs/promises';
import { defineConfig } from 'tsup'
import { build } from 'tsup'

const pkg = JSON.parse(await readFile(new URL('./package.json', import.meta.url)));

const sharedConfig = {
  entry: ['src/lib.ts'],
  clean: true,
  experimentalDts: true,
  define: {
    "VERSION": `"${pkg.version}"`,
  }
};

// CJS Build
await build({
  minify: false,
  splitting: false,
  sourcemap: false,
  outDir: "dist/",
  platform: "node",
  ...sharedConfig,
})

let noNodeImpl = {
  name: 'example',
  setup(build) {
    build.onResolve({ filter: /_impl\/node\/.*/ }, args => {
      return { path: args.path, namespace: "node-special" }
    })

    build.onLoad({ filter: /.*/, namespace: 'node-special' }, () => ({
      contents: "const handler = { get: () => undefined }; const proxy = new Proxy({}, handler); export default proxy;",
      loader: 'js',
    }))
  },
}
// ESM Non node Build
await build({
  minify: false,
  splitting: true,
  sourcemap: false,
  outDir: "esm/",
  platform: 'neutral',
  esbuildPlugins: [noNodeImpl],
  format: "esm",
  ...sharedConfig,
})

// ESM Bunny Build
await build({
  minify: true,
  splitting: false,
  sourcemap: false,
  outDir: "esm-bunny/",
  platform: 'neutral',
  esbuildPlugins: [noNodeImpl],
  format: "esm",
  ...sharedConfig,
})

// ESM Node
await build({
  minify: true,
  splitting: false,
  sourcemap: false,
  outDir: "esm-node/",
  platform: 'neutral',
  esbuildPlugins: [],
  format: "esm",
  ...sharedConfig,
})
