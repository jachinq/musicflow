import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  html: {
    template: './public/index.html',
  },
  plugins: [pluginReact()],
  dev: {
    // 开发模式下将编译后的文件输出到磁盘
    writeToDisk: true,
  },
});
