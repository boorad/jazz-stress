
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

const TIME_MS = 1000; // 1 second
const WARMUP_MS = 200; // 0.2 seconds

// Benchmarks for Jazz coValue operations
const benches = [
  covalue_create_benchmark,
  covalue_read_benchmark,
  covalue_update_benchmark,
  covalue_delete_benchmark,
  covalue_stress_benchmark,
];

// Map benchmark names to functions
export const benchmarkMap: Record<string, (mode: Mode) => Promise<Bench>> = {
  "covalue-create": covalue_create_benchmark,
  "covalue-read": covalue_read_benchmark,
  "covalue-update": covalue_update_benchmark,
  "covalue-delete": covalue_delete_benchmark,
  "covalue-stress": covalue_stress_benchmark,
};

const crypto = new RNQuickCrypto();

function getAdapter(dbName: string) {
  return new ExpoSQLiteAdapter(dbName);
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
      new: {}, // Empty object for new content to avoid type errors
    });
    coValueIds.push(id);
  }

  let counter = numInitialCoValues;

  bench.add("concurrent-operations", async () => {
    // Create an array of promises for concurrent operations
    const operations: Promise<any>[] = [];
    
    // Add create operations
    for (let i = 0; i < NUM_OPERATIONS; i++) {
      const uniqueCounter = counter++;
      const header: CoValueHeader = {
        type: "comap",
        ruleset: {} as PermissionsDef,
        meta: { createdInBatch: uniqueCounter },
        uniqueness: uniqueCounter,
      };
      const id = idforHeader(header, crypto);
      
      const createPromise = sqliteClient.addCoValue({
        id,
        header,
        action: "content",
        priority: 0,
        new: {}, // Empty object for new content to avoid type errors
      });
      
      operations.push(createPromise);
    }
    
    // Add read operations for existing CoValues
    for (let i = 0; i < NUM_OPERATIONS; i++) {
      // Pick a random CoValue from our initial set
      const randomIndex = Math.floor(Math.random() * coValueIds.length);
      // Type assertion to handle the ID format requirement
      const id = coValueIds[randomIndex] as `co_z${string}`;
      const readPromise = sqliteClient.getCoValue(id);
      operations.push(readPromise);
    }
    
    // Add update operations
    for (let i = 0; i < NUM_OPERATIONS; i++) {
      // Pick a random CoValue from our initial set
      const randomIndex = Math.floor(Math.random() * coValueIds.length);
      const id = coValueIds[randomIndex];
      const uniqueCounter = counter++;
      
      if (mode === "sync") {
        // For sync mode, wrap in a Promise to maintain consistency in the operations array
        const updatePromise = Promise.resolve().then(() => {
          return sqliteAdapter.executeSync(
            "UPDATE coValues SET header = JSON_SET(header, '$.meta.updated', ?) WHERE id = ?", 
            [uniqueCounter, id]
          );
        });
        operations.push(updatePromise);
      } else {
        const updatePromise = sqliteAdapter.executeAsync(
          "UPDATE coValues SET header = JSON_SET(header, '$.meta.updated', ?) WHERE id = ?", 
          [uniqueCounter, id]
        );
        operations.push(updatePromise);
      }
    }
    
    // Wait for all operations to complete
    await Promise.all(operations);
  });

  return bench;
}

// Run all benchmarks and return the results using shared library function
export const runCoValueBenchmarks = async (
  mode: Mode = "async"
): Promise<StorageBenchmarkResult[]> => {
  // Use the shared runStorageBenchmarks function from lib
  return runStorageBenchmarks(benches, mode);
};

// Run a single benchmark by name using shared library function
export const runSingleCoValueBenchmark = async (
  benchmarkName: string,
  mode: Mode = "async"
): Promise<StorageBenchmarkResult[]> => {
  // Use the shared runSingleStorageBenchmark function from lib
  return runSingleStorageBenchmark(benchmarkMap, benchmarkName, mode);
};
