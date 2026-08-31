import { readFileSync } from 'fs';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import external from 'rollup-plugin-peer-deps-external';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import alias from '@rollup/plugin-alias';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync('./package.json'));

const aliasPlugin = alias({
  entries: [
    { find: /^@\/(.*)/, replacement: path.resolve(__dirname, './$1') },
  ],
});

const sharedPlugins = [
  aliasPlugin,
  external(),
  resolve(),
  commonjs(),
  postcss({
    extract: 'styles.css',
    minimize: true,
  }),
  terser(),
];

const aliasDistPlugin = alias({
  entries: [
    { find: /^@\/(.*)/, replacement: path.resolve(__dirname, 'dist/esm/types/$1') },
  ],
});

const config = [
  // ESM build (with type declarations)
  {
    input: './src/index.ts',
    output: {
      file: packageJson.module,
      format: 'es',
      sourcemap: true,
      exports: 'named',
    },
    plugins: [
      ...sharedPlugins,
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: true,
        declarationDir: 'dist/esm/types',
      }),
    ],
  },
  // CJS build (no declarations)
  {
    input: './src/index.ts',
    output: {
      file: packageJson.main,
      format: 'cjs',
      sourcemap: true,
      name: packageJson.name,
    },
    plugins: [
      ...sharedPlugins,
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
      }),
    ],
  },
  // Bundle type declarations
  {
    input: 'dist/esm/types/src/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    external: [/\.css$/],
    plugins: [aliasDistPlugin, dts()],
  },
  // Icons ESM build
  {
    input: './src/icons.ts',
    output: {
      file: 'dist/esm/icons.js',
      format: 'es',
      sourcemap: true,
      exports: 'named',
    },
    external: ['lucide-react'],
    plugins: [
      aliasPlugin,
      external(),
      resolve(),
      commonjs(),
      terser(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: true,
        declarationDir: 'dist/esm/types',
      }),
    ],
  },
  // Icons CJS build
  {
    input: './src/icons.ts',
    output: {
      file: 'dist/cjs/icons.js',
      format: 'cjs',
      sourcemap: true,
    },
    external: ['lucide-react'],
    plugins: [
      aliasPlugin,
      external(),
      resolve(),
      commonjs(),
      terser(),
      typescript({
        tsconfig: './tsconfig.build.json',
        declaration: false,
      }),
    ],
  },
  // Icons type declarations
  {
    input: 'dist/esm/types/src/icons.d.ts',
    output: [{ file: 'dist/icons.d.ts', format: 'es' }],
    external: ['lucide-react'],
    plugins: [aliasDistPlugin, dts()],
  },
];

export default config;