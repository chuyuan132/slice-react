import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import replace from '@rollup/plugin-replace';
import { resolvePkgPath } from '../rollup/utils';
import path from 'path';
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    replace({
      __DEV__: true,
      preventAssignment: true
    })
  ],
  resolve: {
    alias: [
      {
        find: 'react',
        replacement: resolvePkgPath('react')
      },
      {
        find: 'react-dom',
        replacement: resolvePkgPath('react-dom')
      },
      // 脱离宿主环境测试
      {
        find: 'react-noop-renderer',
        replacement: resolvePkgPath('react-noop-renderer')
      },
      {
        find: 'hostConfig',
        replacement: path.resolve(resolvePkgPath('react-noop-renderer'), './src/hostConfig.ts')
      }
      // 在浏览器环境下测试

      // {
      //   find: 'hostConfig',
      //   replacement: path.resolve(resolvePkgPath('react-dom'), './src/hostConfig.ts')
      // }
    ]
  }
});
