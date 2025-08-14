import { resolve } from 'path';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';

const ENV_PATH = './env';

export default ({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, ENV_PATH) };

  return defineConfig({
    plugins: [
      vue(),
      svgLoader({
        // https://github.com/jpkleemans/vite-svg-loader/issues/101
        svgoConfig: {
          plugins: ['prefixIds'],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    envDir: resolve(__dirname, ENV_PATH),
    server: {
      port: parseInt(env.VITE_APP_PORT) || 3000,
    },
  });
};
