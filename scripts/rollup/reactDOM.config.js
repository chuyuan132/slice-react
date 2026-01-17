import { getBaseRollupPlugins, getPackageJson, resolvePkgPath } from './utils.js';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';

const { name, module, peerDependencies } = getPackageJson('react-dom');

// react包路径
const pkgPath = resolvePkgPath(name);
const distPkgPath = resolvePkgPath(name, true);

export default [
  {
    input: `${pkgPath}/${module}`,
    output: {
      file: `${distPkgPath}/index.js`,
      name: `name`,
      format: 'umd'
    },
    external: [...(Object.keys(peerDependencies) || [])],
    plugins: [
      ...getBaseRollupPlugins(),
      alias({
        entries: [{ find: 'hostConfig', replacement: `${pkgPath}/src/hostConfig.ts` }]
      }),
      generatePackageJson({
        inputFolder: pkgPath,
        outputFolder: distPkgPath,
        baseContents: ({ name, version, description }) => {
          return {
            name,
            version,
            peerDependencies: {
              react: version
            },
            description,
            main: 'index.js'
          };
        }
      })
    ]
  }
];
