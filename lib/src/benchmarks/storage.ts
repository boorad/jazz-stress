import { Bench } from "tinybench";
import type { Mode, StorageBenchmarkResult } from "./types";
import { SQLiteAdapterBase, SQLiteClient } from "jazz-react-native-core";

export async function setupJazzEnvironment(
  getAdapter: (dbName: string) => SQLiteAdapterBase,
  mode: Mode = "async"
) {
  const dbName = `jazz-rn-benchmark-${mode}-${Date.now()}.db`;
  const sqliteAdapter = getAdapter(dbName);
  const sqliteClient = new SQLiteClient(sqliteAdapter, [] as any, mode);
  await sqliteClient.ensureInitialized();

  const localNode = {
    id: `node-${Date.now()}`,
    storage: {
      execute: sqliteAdapter.executeSync.bind(sqliteAdapter),
      transaction: sqliteAdapter.transactionSync.bind(sqliteAdapter),
    },
  };

  const account = {
    id: `account-${Date.now()}`,
    profile: { name: `Benchmark User ${Date.now()}` },
  };

  return { localNode, account, sqliteAdapter, sqliteClient };
}

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
