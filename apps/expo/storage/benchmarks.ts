import { RNQuickCrypto } from "jazz-react-native-core/crypto";
import { Bench } from "tinybench";
import { ExpoSQLiteAdapter } from "jazz-expo";
import { CoValueHeader, idforHeader } from "cojson/dist/coValueCore.js";
import { PermissionsDef } from "cojson/dist/permissions.js";
import {
  runStorageBenchmarks,
  runSingleStorageBenchmark,
  setupJazzEnvironment,
} from "lib/benchmarks";
import type { Mode, StorageBenchmarkResult } from "lib/benchmarks";
import { SyncManager } from "cojson-storage";
import {
  CojsonInternalTypes,
  OutgoingSyncQueue,
  emptyKnownState,
  SyncMessage,
} from "cojson";

const TIME_MS = 1000; // 1 second
const WARMUP_MS = 200; // 0.2 seconds

// Benchmarks for Jazz coValue operations
const benches = [
  covalue_create_benchmark,
  covalue_read_benchmark,
  covalue_update_benchmark,
  covalue_delete_benchmark,
  covalue_stress_benchmark,
  sync_manager_benchmark,
];

// Map benchmark names to functions
export const benchmarkMap: Record<string, (mode: Mode) => Promise<Bench>> = {
  "covalue-create": covalue_create_benchmark,
  "covalue-read": covalue_read_benchmark,
  "covalue-update": covalue_update_benchmark,
  "covalue-delete": covalue_delete_benchmark,
  "covalue-stress": covalue_stress_benchmark,
  "sync-manager": sync_manager_benchmark,
};

const crypto = new RNQuickCrypto();

function getAdapter(dbName: string) {
  return new ExpoSQLiteAdapter(dbName);
}

// Mock OutgoingSyncQueue
class MockOutgoingSyncQueue implements OutgoingSyncQueue {
  async push(_msg: SyncMessage): Promise<void> {
    // No-op for benchmarking DB interaction
    return Promise.resolve();
  }
  close(): void {
    // No-op
  }
}

// Benchmark for creating coValues
async function covalue_create_benchmark(mode: Mode = "async") {
  const { sqliteClient } = await setupJazzEnvironment(getAdapter, mode);

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
  const { sqliteClient } = await setupJazzEnvironment(getAdapter, mode);
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
  const { sqliteAdapter, sqliteClient } = await setupJazzEnvironment(
    getAdapter,
    mode
  );

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
  const { sqliteAdapter, sqliteClient } = await setupJazzEnvironment(
    getAdapter,
    mode
  );

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

// Benchmark for stressing CoValue reads/writes with concurrent operations
async function covalue_stress_benchmark(mode: Mode = "async") {
  const { sqliteAdapter, sqliteClient } = await setupJazzEnvironment(
    getAdapter,
    mode
  );

  const bench = new Bench({
    name: "covalue-stress",
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });

  // Number of operations to perform in each category
  const NUM_OPERATIONS = 20;

  // Create a complex object to use as CoValue content
  // We'll use a simple object structure to avoid type issues
  const generateComplexContent = (index: number) => {
    // Create a large object with nested properties to stress the database
    const largeObject: Record<string, any> = {};

    // Add a lot of nested data - this will create a large JSON object
    // without running into type issues
    for (let i = 0; i < 20; i++) {
      const key = `data_${index}_${i}`;
      largeObject[key] = {
        id: `id_${index}_${i}`,
        timestamp: Date.now() + i,
        name: `Item ${i} for user ${index}`,
        description: `This is a detailed description for item ${i} belonging to user ${index}. It contains enough text to make the JSON object larger and more complex, which should help stress the database more effectively.`,
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          version: i + 1,
          status: ["active", "pending", "archived", "deleted"][i % 4],
          tags: Array.from({ length: 5 }, (_, t) => `tag_${t}_${index}`),
          nested: {
            level1: {
              level2: {
                level3: {
                  value: `Deep nested value ${i}`,
                  array: Array.from({ length: 10 }, (_, a) => ({
                    subId: `subitem_${a}`,
                    subValue: `Value for subitem ${a} in item ${i} for user ${index}`,
                  })),
                },
              },
            },
          },
        },
      };
    }

    return largeObject;
  };

  // Create a set of initial CoValues that we'll use for read operations
  const coValueIds: string[] = [];
  const numInitialCoValues = NUM_OPERATIONS;

  for (let i = 0; i < numInitialCoValues; i++) {
    const header: CoValueHeader = {
      type: "comap",
      ruleset: {} as PermissionsDef,
      meta: { initialId: i },
      uniqueness: i,
    };
    const id = idforHeader(header, crypto);
    await sqliteClient.addCoValue({
      id,
      header,
      action: "content",
      priority: 0,
      new: generateComplexContent(i),
    });
    coValueIds.push(id);
  }

  let counter = numInitialCoValues;

  bench.add(`database-flood (${NUM_OPERATIONS})`, async () => {
    // This benchmark aggressively floods the database with concurrent operations
    // to reproduce the 'database is locked' errors

    // We'll track errors to see how many operations failed
    let errorCount = 0;
    let successCount = 0;

    // Create a function to execute a single operation and return a promise
    const executeOperation = (type: "create" | "read") => {
      if (type === "create") {
        const uniqueCounter = counter++;
        const header: CoValueHeader = {
          type: "comap",
          ruleset: {} as PermissionsDef,
          meta: { createdInBatch: uniqueCounter },
          uniqueness: uniqueCounter,
        };
        const id = idforHeader(header, crypto);

        return sqliteClient
          .addCoValue({
            id,
            header,
            action: "content",
            priority: 0,
            new: generateComplexContent(uniqueCounter),
          })
          .then(() => {
            successCount++;
            return "success";
          })
          .catch((err) => {
            errorCount++;
            return "error";
          });
      } else {
        // read
        const randomIndex = Math.floor(Math.random() * coValueIds.length);
        const id = coValueIds[randomIndex] as `co_z${string}`;

        return sqliteClient
          .getCoValue(id)
          .then(() => {
            successCount++;
            return "success";
          })
          .catch((err) => {
            errorCount++;
            return "error";
          });
      }
    };

    // Create a large number of promises that will all execute in parallel
    // without any coordination or batching
    const promises = [];

    // Add create operations
    for (let i = 0; i < NUM_OPERATIONS; i++) {
      promises.push(executeOperation("create"));
    }

    // Add read operations
    for (let i = 0; i < NUM_OPERATIONS; i++) {
      promises.push(executeOperation("read"));
    }

    // Fire all operations simultaneously
    // This should create maximum contention on the database
    await Promise.allSettled(promises);

    // Return the error count so it can be included in benchmark results
    return { errorCount, successCount };
  });

  return bench;
}

// Benchmark for SyncManager operations
async function sync_manager_benchmark(
  mode: Mode = "async",
  numInitialCoValues: number = 100 // Configurable pre-warm count
) {
  const { sqliteClient } = await setupJazzEnvironment(getAdapter, mode);
  const mockQueue = new MockOutgoingSyncQueue();

  const bench = new Bench({
    name: `sync-manager (${numInitialCoValues} pre-warmed)`,
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });

  // Pre-warm the database
  const coValueIds: `co_z${string}`[] = [];
  for (let i = 0; i < numInitialCoValues; i++) {
    const header: CoValueHeader = {
      type: "comap",
      ruleset: {} as PermissionsDef,
      meta: { prewarmIndex: i },
      uniqueness: `prewarm_${i}`,
    };
    const id = idforHeader(header, crypto);
    await sqliteClient.addCoValue({
      id,
      header,
      action: "content",
      priority: 0,
      new: {}, // Fix: Use empty object for initial add
    });
    coValueIds.push(id);
  }

  // Instantiate SyncManager *once* before the benchmark tasks run
  const syncManager = new SyncManager(sqliteClient, mockQueue);
  let coValueIndex = 0;

  bench.add("sync-manager", async () => {
    // Cycle through pre-warmed CoValues for different runs
    const targetId = coValueIds[coValueIndex % numInitialCoValues];
    coValueIndex++;

    if (!targetId) {
      throw new Error("Failed to get pre-warmed CoValue ID for benchmark task");
    }

    // Simulate a peer asking for this CoValue with no prior knowledge
    const knownState = emptyKnownState(targetId);

    // Measure the time taken to collect and prepare data for sending
    await syncManager.sendNewContent(knownState);
  });

  return bench;
}

// Run all benchmarks and return the results using shared library function
export const runCoValueBenchmarks = async (
  mode: Mode = "async"
): Promise<StorageBenchmarkResult[]> => {
  return runStorageBenchmarks(benches, mode);
};

// Run a single benchmark by name using shared library function
export const runSingleCoValueBenchmark = async (
  benchmarkName: string,
  mode: Mode = "async"
): Promise<StorageBenchmarkResult[]> => {
  return runSingleStorageBenchmark(benchmarkMap, benchmarkName, mode);
};
