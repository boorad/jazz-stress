import { Bench, TaskResult } from 'tinybench';
import benches, { sign_verify } from './benches';
import { CryptoBenchmarkResult } from '../benchmarks/types';

// Legacy type kept for backward compatibility
export type Results = CryptoBenchmarkResult;

// Define the type for benchmark functions
type BenchmarkFunction = () => Promise<Bench>;

// Map of benchmark names to their functions
export const benchmarkMap: Record<string, BenchmarkFunction> = {
  'sign-verify': sign_verify
  // Add more benchmarks here as they are created
};

export const runCryptoBenchmarks = async (): Promise<CryptoBenchmarkResult[]> => {
  const results = await Promise.all(benches.map(async (benchFn) => {
    const b = await benchFn();
    await b.run();
    return processResults(b);
  }));

  return results;
};

// Run a specific benchmark by name
export const runSingleBenchmark = async (benchmarkName: string): Promise<CryptoBenchmarkResult[]> => {
  // Find the benchmark function
  const benchFn = benchmarkMap[benchmarkName];
  
  if (!benchFn) {
    console.warn(`Benchmark '${benchmarkName}' not found`);
    return [];
  }
  
  // Run the benchmark
  const bench = await benchFn();
  await bench.run();
  
  return [processResults(bench)];
};

const processResults = (b: Bench): CryptoBenchmarkResult => {
  const tasks = b.tasks;
  const pure = tasks.find((t) => t.name === 'pure');
  const rnqc = tasks.find((t) => t.name === 'rnqc');
  return {
    name: b.name,
    pure: pure?.result,
    rnqc: rnqc?.result,
  };
};

// Re-export for backward compatibility, but the actual implementation is moved to utils.ts
export { cleanResults, formatNumber, calculateTimes } from '../benchmarks/utils';





