import { Bench } from 'tinybench';
import { PureJSCrypto } from 'cojson/dist/crypto/PureJSCrypto';
import { RNQuickCrypto } from 'jazz-react-native/crypto';
import type { CryptoBenchmarkResult } from 'lib/benchmarks';

// Legacy type kept for backward compatibility
export type Results = CryptoBenchmarkResult;

const TIME_MS = 1000;
const WARMUP_MS = 100;

const data = { b: 'world', a: 'hello' };

async function sign_verify(): Promise<Bench> {
  const pure = new PureJSCrypto();
  const pureSigner = pure.newRandomSigner();

  const rnqc = new RNQuickCrypto();
  const rnqcSigner = rnqc.newRandomSigner();

  const bench = new Bench({
    name: 'sign-verify',
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
}

const benches: Array<() => Promise<Bench>> = [sign_verify];

// Define the type for benchmark functions
type BenchmarkFunction = () => Promise<Bench>;

// Map of benchmark names to their functions
export const benchmarkMap: Record<string, BenchmarkFunction> = {
  'sign-verify': sign_verify,
  // Add more benchmarks here as they are created
};

export const runCryptoBenchmarks = async (): Promise<
  CryptoBenchmarkResult[]
> => {
  const results: CryptoBenchmarkResult[] = [];
  for (const benchFn of benches) {
    const bench = await benchFn();
    await bench.run();
    const pureTask = bench.tasks.find(t => t.name === 'pure');
    const rnqcTask = bench.tasks.find(t => t.name === 'rnqc');
    results.push({
      name: bench.name,
      pure: pureTask?.result,
      rnqc: rnqcTask?.result,
    });
  }
  return results;
};

export const runSingleBenchmark = async (
  benchmarkName: string,
): Promise<CryptoBenchmarkResult[]> => {
  const benchFn = benchmarkMap[benchmarkName];
  if (!benchFn) {
    console.warn(`Benchmark '${benchmarkName}' not found`);
    return [];
  }
  const bench = await benchFn();
  await bench.run();
  const pureTask = bench.tasks.find(t => t.name === 'pure');
  const rnqcTask = bench.tasks.find(t => t.name === 'rnqc');
  return [{ name: bench.name, pure: pureTask?.result, rnqc: rnqcTask?.result }];
};
