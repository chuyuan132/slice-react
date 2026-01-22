const { default: defaults } = require('jest-config');
module.exports = {
  ...defaults,
  rootDir: process.cwd(),
  modulePathIgnorePatterns: ['<rootDir>/.history'],
  moduleDirectories: [
    'dist/node_modules',
    'node_modules' // jest 默认的 node_modules 目录
  ], // jest 默认的根目录],
  testEnvironment: 'jsdom'
};
