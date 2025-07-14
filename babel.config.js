module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'transform-inline-environment-variables',
        {
          include: ['EXPO_ROUTER_APP_ROOT'],
        },
      ],
    ],
  };
};
