import {PureJSCrypto} from 'cojson/native';
import {RNQuickCrypto} from 'jazz-react-native';
import {Bench} from 'tinybench';

const TIME_MS = 1000;
const WARMUP_MS = 100;

const data = {b: 'world', a: 'hello'};

const sign_verify = async () => {
  const pure = new PureJSCrypto();
  const pureSigner = pure.newRandomSigner();

  const rnqc = new RNQuickCrypto();
  const rnqcSigner = rnqc.newRandomSigner();

  const bench = new Bench({
    name: 'sign/verify',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });

  bench.add('pure', () => {
    const signature = pure.sign(pureSigner, data);
    if (!pure.verify(signature, data, pure.getSignerID(pureSigner))) {
      throw new Error('signature did not verify');
    }
  });

  bench.add('rnqc', () => {
    const signature = rnqc.sign(rnqcSigner, data);
    if (!rnqc.verify(signature, data, rnqc.getSignerID(rnqcSigner))) {
      throw new Error('signature did not verify');
    }
  });

  return bench;
};

export default [sign_verify];
