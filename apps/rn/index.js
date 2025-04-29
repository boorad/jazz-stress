// Apply custom polyfills before loading React Native modules
import "lib/polyfills";

import { AppRegistry } from "react-native";
import { App } from "./src/App";
import { name as appName } from "./app.json";

AppRegistry.registerComponent(appName, () => App);
