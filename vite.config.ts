import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { readdirSync, statSync } from 'fs';

/** Recursively collect all .ts source files (excluding tests) */
function collectEntries(dir: string, base: string = dir): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const name of readdirSync(dir)) {
    const full = resolve(dir, name);
    if (statSync(full).isDirectory()) {
      Object.assign(entries, collectEntries(full, base));
    } else if (name.endsWith('.ts') && !name.endsWith('.test.ts') && !name.endsWith('.d.ts')) {
      const rel = full.slice(resolve(base).length + 1).replace(/\.ts$/, '');
      entries[rel] = full;
    }
  }
  return entries;
}


const entries = collectEntries(resolve(__dirname, 'src'));
const testAliases = {
  '@themislib/themis/svelte-store': resolve(__dirname, 'src/svelte-store.ts'),
  '@themislib/themis/streaming-store': resolve(__dirname, 'src/streaming-store.ts'),
  '@themislib/themis/react-store': resolve(__dirname, 'src/react-store.ts'),
  '@themislib/themis/saga': resolve(__dirname, 'src/saga.ts'),
  '@themislib/themis/types': resolve(__dirname, 'src/types.ts'),
  '@themislib/themis/utils/collections/collection-utils': resolve(__dirname, 'src/utils/collections/collection-utils.ts'),
  '@themislib/themis/utils/store/create-action': resolve(__dirname, 'src/utils/store/create-action.ts'),
  '@themislib/themis/utils/store/create-reducer': resolve(__dirname, 'src/utils/store/create-reducer.ts'),
  '@themislib/themis/utils/store/boolean-preference': resolve(__dirname, 'src/utils/store/boolean-preference.ts'),
  '@themislib/themis/utils/store/domain-scoped': resolve(__dirname, 'src/utils/store/domain-scoped.ts'),
  '@themislib/themis/components-svelte/use-init-store': resolve(__dirname, 'src/components-svelte/use-init-store.ts'),
  '@themislib/themis/components-svelte/use-run-saga': resolve(__dirname, 'src/components-svelte/use-run-saga.ts'),
  '@themislib/themis/utils/sagas/selector-channel-effects': resolve(__dirname, 'src/utils/sagas/selector-channel-effects.ts'),
};

export default defineConfig({
  test: {
    alias: testAliases,
  },
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      outDir: 'dist',
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: {
    lib: {
      entry: entries,
      formats: ['es'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        'redux',
        'redux-saga',
        'redux-saga/effects',
        'typed-redux-saga',
        'typed-redux-saga/macro',
        'fast-equals',
        'kefir',
        '@preact/signals-react',
        '@preact/signals-react/runtime',
        '@preact/signals-core',
        'react',
        'use-sync-external-store',
        'svelte',
        /^react\//,
        /^use-sync-external-store\//,
        /^svelte\//,
        /^redux-saga\//,
        /^typed-redux-saga\//,
      ],
      output: {
        format: 'es',
        preserveModules: true,
        preserveModulesRoot: 'src',
        entryFileNames: '[name].js',
      },
    },
    minify: false,
    sourcemap: true,
  },
});

