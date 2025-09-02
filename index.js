/**
 * @format
 */
import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';
import '@react-native-firebase/app';


AppRegistry.registerComponent(appName, () => App);
