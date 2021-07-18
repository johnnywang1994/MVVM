import { defineConfig } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve'; // allocate modules
import commonjs from '@rollup/plugin-commonjs'; // convert cjs to es6 module
import babel from '@rollup/plugin-babel';
import { terser } from "rollup-plugin-terser";
import typescript from '@rollup/plugin-typescript';

const isProd = process.env.NODE_ENV === 'production';

const config = defineConfig({
  input: 'src/index.ts',
  output: {
    name: 'Maju',
    file: `dist/maju${isProd ? '.min' : ''}.js`,
    format: 'umd',
    exports: 'default',
    // @rollup/plugin-typescript 'sourcemap' option warning
    sourcemap: !isProd,
    compact: isProd
  },
  plugins: [
    nodeResolve(),
    typescript(),
    babel({
      babelHelpers: 'runtime',
      exclude: 'node_modules/**',
    }),
    (isProd && terser()),
    commonjs()
  ],
  external: [/@babel\/runtime/]
});

export default config;
