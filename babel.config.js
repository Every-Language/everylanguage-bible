module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          web: {
            unstable_transformProfile: 'default',
          },
        },
      ],
    ],
    plugins: [
      '@babel/plugin-syntax-import-meta',
      'react-native-reanimated/plugin',
      [
        'transform-inline-environment-variables',
        {
          include: ['EXPO_ROUTER_APP_ROOT'],
        },
      ],
      // Temporarily disable Tamagui babel plugin for web debugging
      // [
      //   '@tamagui/babel-plugin',
      //   {
      //     components: ['tamagui'],
      //     config: './tamagui.config.ts',
      //     logTimings: true,
      //   },
      // ],
    ],
  };
};
