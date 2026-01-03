import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { readFileSync } from 'fs';
import { join } from 'path';

// 读取版本号
const packageJson = JSON.parse(
  readFileSync(join(__dirname, 'package.json'), 'utf-8')
);
const version = packageJson.version;

// 生成构建日期
const buildDate = new Date().toISOString().split('T')[0];

export default defineConfig({
  html: {
    template: './public/index.html',
  },
  plugins: [pluginReact()],
  source: {
    define: {
      __APP_VERSION__: JSON.stringify(version),
      __BUILD_DATE__: JSON.stringify(buildDate),
    },
  },
  dev: {
    // 开发模式下将编译后的文件输出到磁盘
    writeToDisk: true,
  },
});
