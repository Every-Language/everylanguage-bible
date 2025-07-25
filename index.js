import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';

// Enable react-native-screens for better performance
enableScreens();

import App from './src/app/App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
