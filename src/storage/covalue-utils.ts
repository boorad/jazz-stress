import { OPSQLiteAdapter } from 'jazz-react-native';
import { Bench } from 'tinybench';
import { Account, CoMap, Group, LocalNode } from 'cojson';

// Constants for benchmarking
export const TIME_MS = 1000;
export const WARMUP_MS = 100;

// Define a simple CoMap class for benchmarking
export class BenchmarkMap extends CoMap {
  static create(initialData: Record<string, string>, owner: Group | Account) {
    return CoMap.create(initialData, owner) as BenchmarkMap;
  }
}

// Setup the Jazz environment with SQLite storage
export const setupJazzEnvironment = async () => {
  // Initialize the SQLite adapter
  const sqliteAdapter = new OPSQLiteAdapter('jazz-stress-benchmark.db');
  await sqliteAdapter.initialize();
  
  // Create a local node with the SQLite adapter
  const localNode = new LocalNode({
    storage: {
      execute: sqliteAdapter.execute.bind(sqliteAdapter),
      transaction: sqliteAdapter.transaction.bind(sqliteAdapter),
    },
  });
  
  // Create a test account
  const account = await Account.create(localNode, {
    profile: { name: 'Benchmark User' },
  });
  
  return { localNode, account, sqliteAdapter };
};
