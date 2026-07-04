const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  watchFolders: [],
  resolver: {
    blockList: [
      /android\/app\/\.cxx\/.*/,
      /android\/\.gradle\/.*/,
      /android\/build\/.*/,
    ],
  },
  watcher: {
    watchman: {
      deferStates: ['hg.update'],
    },
    additionalExts: ['mjs', 'cjs'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);