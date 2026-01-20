const { default } = require('jest-config')
module.exports = {
  ...defaults,
  rootDir: process.cwd(),
  modulePathIgnorePatterns: ['<rootDir>/.history'],
  moduleDirectories: [
    'dist/node_modules',
    ...defaults.moduleDirectories
  ],
  testEnvironment: 'jsdom'
};
