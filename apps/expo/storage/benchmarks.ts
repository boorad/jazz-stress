import { RNQuickCrypto } from "jazz-react-native-core/crypto";
import { Bench } from "tinybench";
import { ExpoSQLiteAdapter } from "jazz-expo";
import { SQLiteClient } from "jazz-react-native-core";
import { CoValueHeader, idforHeader } from "cojson/dist/coValueCore.js";
import { PermissionsDef } from "cojson/dist/permissions.js";
import type { StorageBenchmarkResult } from "lib/benchmarks";

// Reduced benchmark time for quicker feedback
const TIME_MS = 1000; // 1 second
const WARMUP_MS = 200; // 0.2 seconds

// Mode controls sync or async SQLiteClient
export type Mode = "async" | "sync";

// Benchmarks for Jazz coValue operations
const benches = [
  covalue_create_benchmark,
  covalue_read_benchmark,
  covalue_update_benchmark,
  covalue_delete_benchmark,
];

// Map benchmark names to functions
export const benchmarkMap: Record<string, (mode: Mode) => Promise<Bench>> = {
  "covalue-create": covalue_create_benchmark,
  "covalue-read": covalue_read_benchmark,
  "covalue-update": covalue_update_benchmark,
  "covalue-delete": covalue_delete_benchmark,
};

// Setup the Jazz environment with SQLite storage
export const setupJazzEnvironment = async (mode: Mode = "async") => {
  const dbName = `jazz-expo-benchmark-${Date.now()}.db`;
  const sqliteAdapter = new ExpoSQLiteAdapter(dbName);
  const sqliteClient = new SQLiteClient(sqliteAdapter, [] as any, mode);
  await sqliteClient.ensureInitialized();
  const crypto = new RNQuickCrypto();

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

  return { localNode, account, sqliteAdapter, sqliteClient, crypto };
};

// Benchmark for creating coValues
async function covalue_create_benchmark(mode: Mode = "async") {
  const { sqliteClient, crypto } = await setupJazzEnvironment(mode);

  const bench = new Bench({
    name: "covalue-create",
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });

  let createCounter = 0;

  bench.add("create-comap", async () => {
    const header: CoValueHeader = {
      type: "comap",
      ruleset: {} as PermissionsDef,
      meta: null,
      uniqueness: createCounter++,
    };

    const id = idforHeader(header, crypto);

    await sqliteClient.addCoValue({
      id,
      header,
      action: "content",
      priority: 0,
      new: {},
    });
  });

  return bench;
}

// Benchmark for getting values from a coValue
async function covalue_read_benchmark(mode: Mode = "async") {
  const { sqliteClient, crypto } = await setupJazzEnvironment(mode);
  const header: CoValueHeader = {
    type: "comap",
    meta: { createdAt: Date.now() },
    ruleset: {} as PermissionsDef,
    uniqueness: null,
  };
  const id = idforHeader(header, crypto);

  await sqliteClient.addCoValue({
    id,
    header,
    action: "content",
    priority: 0,
    new: {},
  });

  const bench = new Bench({
    name: "covalue-read",
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });

  bench.add("read-comap", async () => {
    await sqliteClient.getCoValue(id);
  });

  return bench;
}

// Benchmark for updating CoValue headers
async function covalue_update_benchmark(mode: Mode = "async") {
  const { sqliteAdapter, sqliteClient, crypto } =
    await setupJazzEnvironment(mode);

  const initialHeader: CoValueHeader = {
    type: "comap",
    ruleset: {} as PermissionsDef,
    meta: null,
    uniqueness: 0,
  };
  const id = idforHeader(initialHeader, crypto);
  await sqliteClient.addCoValue({
    id,
    header: initialHeader,
    action: "content",
    priority: 0,
    new: {},
  });

  const bench = new Bench({
    name: "covalue-update",
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  let counter = 1;

  bench.add("update-header", async () => {
    const newHeader: CoValueHeader = {
      ...initialHeader,
      meta: { updated: counter },
      uniqueness: counter++,
    };
    if (mode === "sync") {
      sqliteAdapter.executeSync("UPDATE coValues SET header = ? WHERE id = ?", [
        JSON.stringify(newHeader),
        id,
      ]);
    } else {
      await sqliteAdapter.executeAsync(
        "UPDATE coValues SET header = ? WHERE id = ?",
        [JSON.stringify(newHeader), id]
      );
    }
  });

  return bench;
}

// Benchmark for deleting CoValue entries
async function covalue_delete_benchmark(mode: Mode = "async") {
  const { sqliteAdapter, sqliteClient, crypto } =
    await setupJazzEnvironment(mode);

  const bench = new Bench({
    name: "covalue-delete",
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  let counter = 0;

  bench.add("delete-comap", async () => {
    const header: CoValueHeader = {
      type: "comap",
      ruleset: {} as PermissionsDef,
      meta: null,
      uniqueness: counter,
    };
    const id = idforHeader(header, crypto);
    await sqliteClient.addCoValue({
      id,
      header,
      action: "content",
      priority: 0,
      new: {},
    });
    if (mode === "sync") {
      sqliteAdapter.executeSync("DELETE FROM coValues WHERE id = ?", [id]);
    } else {
      await sqliteAdapter.executeAsync("DELETE FROM coValues WHERE id = ?", [
        id,
      ]);
    }
    counter++;
  });

  return bench;
}

// Run all benchmarks and return the results
export const runCoValueBenchmarks = async (
  mode: Mode = "async"
): Promise<StorageBenchmarkResult[]> => {
  const results: StorageBenchmarkResult[] = [];
  for (const benchFn of benches) {
    const bench = await benchFn(mode);
    await bench.run();
    for (const task of bench.tasks) {
      const rawResult = task.result as any;
      let latencyMean = 0;
      let throughputMean = 0;
      if (rawResult) {
        if (rawResult.latency && typeof rawResult.latency.mean === "number") {
          latencyMean = rawResult.latency.mean * 1000;
        } else if (typeof rawResult.mean === "number") {
          latencyMean = rawResult.mean * 1000;
        }
        if (
          rawResult.throughput &&
          typeof rawResult.throughput.mean === "number"
        ) {
          throughputMean = rawResult.throughput.mean;
        } else if (typeof rawResult.hz === "number") {
          throughputMean = rawResult.hz;
        }
      }
      results.push({
        name: task.name,
        latency: { mean: latencyMean },
        throughput: { mean: throughputMean },
      });
    }
  }
  return results;
};

// Run a single benchmark by name
export const runSingleCoValueBenchmark = async (
  benchmarkName: string,
  mode: Mode = "async"
): Promise<StorageBenchmarkResult[]> => {
  const benchFn = benchmarkMap[benchmarkName];
  if (!benchFn) {
    console.warn(`Benchmark '${benchmarkName}' not found`);
    return [];
  }
  const bench = await benchFn(mode);
  await bench.run();
  const results: StorageBenchmarkResult[] = [];
  for (const task of bench.tasks) {
    const rawResult = task.result as any;
    let latencyMean = 0;
    let throughputMean = 0;
    if (rawResult) {
      if (rawResult.latency && typeof rawResult.latency.mean === "number") {
        latencyMean = rawResult.latency.mean * 1000;
      } else if (typeof rawResult.mean === "number") {
        latencyMean = rawResult.mean * 1000;
      }
      if (
        rawResult.throughput &&
        typeof rawResult.throughput.mean === "number"
      ) {
        throughputMean = rawResult.throughput.mean;
      } else if (typeof rawResult.hz === "number") {
        throughputMean = rawResult.hz;
      }
    }
    results.push({
      name: task.name,
      latency: { mean: latencyMean },
      throughput: { mean: throughputMean },
    });
  }
  return results;
};
