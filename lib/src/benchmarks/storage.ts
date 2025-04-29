import { Bench } from "tinybench";
import type { StorageBenchmarkResult } from "./types";

// Process benchmark results and convert to StorageBenchmarkResult format
export function processResults(
  bench: Bench,
  results: StorageBenchmarkResult[]
) {
  for (const task of bench.tasks) {
    const rawResult = task.result as any;
    let latencyMean = 0;
    let throughputMean = 0;

    if (rawResult) {
      // Calculate latency in microseconds (µs)
      if (rawResult.latency && typeof rawResult.latency.mean === "number") {
        // tinybench returns ms, convert to µs
        latencyMean = rawResult.latency.mean * 1000;
      } else if (typeof rawResult.mean === "number") {
        latencyMean = rawResult.mean * 1000;
      }

      // Calculate throughput (ops/sec)
      if (
        rawResult.throughput &&
        typeof rawResult.throughput.mean === "number"
      ) {
        throughputMean = rawResult.throughput.mean;
      } else if (typeof rawResult.hz === "number") {
        throughputMean = rawResult.hz;
      }
    }

    // Add processed result
    results.push({
      name: task.name,
      latency: { mean: latencyMean },
      throughput: { mean: throughputMean },
    });
  }
}

// Generic function to run all benchmarks
export async function runStorageBenchmarks<T extends any>(
  benches: Array<(mode: T) => Promise<Bench>>,
  mode: T
): Promise<StorageBenchmarkResult[]> {
  const results: StorageBenchmarkResult[] = [];

  for (const benchFn of benches) {
    const bench = await benchFn(mode);
    await bench.run();
    processResults(bench, results);
  }

  return results;
}

// Generic function to run a single benchmark by name
export async function runSingleStorageBenchmark<T extends any>(
  benchmarkMap: Record<string, (mode: T) => Promise<Bench>>,
  benchmarkName: string,
  mode: T
): Promise<StorageBenchmarkResult[]> {
  const benchFn = benchmarkMap[benchmarkName];
  if (!benchFn) {
    console.warn(`Benchmark '${benchmarkName}' not found`);
    return [];
  }

  const bench = await benchFn(mode);
  await bench.run();

  const results: StorageBenchmarkResult[] = [];
  processResults(bench, results);
  return results;
}
