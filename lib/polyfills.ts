// @ts-expect-error - @types/react-native doesn't cover this file
import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';

import { Buffer } from 'buffer';
polyfillGlobal('Buffer', () => Buffer);

import 'react-native-get-random-values';

import '@bacons/text-decoder/install';

import 'event-target-polyfill';
