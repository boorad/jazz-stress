import { Bench } from 'tinybench';
import { OPSQLiteAdapter } from 'jazz-react-native';

// Import types from cojson
type CoMap = any;
type Account = any;
type LocalNode = any;

// Increase benchmark time for more accurate results
const TIME_MS = 5000;  // 5 seconds
const WARMUP_MS = 500;  // 0.5 seconds

// Benchmarks for Jazz coValue operations
const benches = [
  covalue_create_benchmark,
  covalue_set_benchmark,
  covalue_get_benchmark,
  covalue_batch_operations_benchmark,
  covalue_nested_map_benchmark
];

// Map benchmark names to functions
export const benchmarkMap: Record<string, () => Promise<Bench>> = {
  'covalue-create': covalue_create_benchmark,
  'covalue-set': covalue_set_benchmark,
  'covalue-get': covalue_get_benchmark,
  'covalue-batch-operations': covalue_batch_operations_benchmark,
  'covalue-nested-map': covalue_nested_map_benchmark
};

// Setup the Jazz environment with SQLite storage
export const setupJazzEnvironment = async () => {
  // Initialize the SQLite adapter with a unique database name to avoid conflicts
  const dbName = `jazz-stress-benchmark-${Date.now()}.db`;
  const sqliteAdapter = new OPSQLiteAdapter(dbName);
  await sqliteAdapter.initialize();
  
  // Mock the LocalNode and Account for benchmarking
  const localNode = {
    id: `node-${Date.now()}`,
    storage: {
      execute: sqliteAdapter.execute.bind(sqliteAdapter),
      transaction: sqliteAdapter.transaction.bind(sqliteAdapter),
    }
  };
  
  // Mock account
  const account = {
    id: `account-${Date.now()}`,
    profile: { name: `Benchmark User ${Date.now()}` }
  };
  
  return { localNode, account, sqliteAdapter };
};

// Benchmark for creating coValues
async function covalue_create_benchmark() {
  const { account, sqliteAdapter } = await setupJazzEnvironment();
  
  const bench = new Bench({
    name: 'covalue-create',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  bench.add('create-comap', async () => {
    // Simulate creating a CoMap with unique data
    const timestamp = Date.now();
    const uniqueId = `${timestamp}-${Math.random().toString(36).substring(2, 10)}`;
    
    // Insert directly into SQLite to simulate CoMap creation
    const header = JSON.stringify({
      type: 'comap',
      meta: { createdAt: timestamp, id: uniqueId }
    });
    
    await sqliteAdapter.execute(
      'INSERT OR REPLACE INTO coValues (id, header) VALUES (?, ?)',
      [`comap-${uniqueId}`, header]
    );
  });
  
  return bench;
}

// Benchmark for setting values in a coValue
async function covalue_set_benchmark() {
  const { account, sqliteAdapter } = await setupJazzEnvironment();
  
  // Create a unique ID for this benchmark run
  const mapId = `comap-${Date.now()}`;
  
  // Insert the initial map into SQLite
  const header = JSON.stringify({
    type: 'comap',
    meta: { createdAt: Date.now(), id: mapId }
  });
  
  await sqliteAdapter.execute(
    'INSERT OR REPLACE INTO coValues (id, header) VALUES (?, ?)',
    [mapId, header]
  );
  
  const bench = new Bench({
    name: 'covalue-set',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  let counter = 0;
  
  bench.add('set-value', async () => {
    const uniqueKey = `key-${counter++}-${Date.now()}`;
    const uniqueValue = `value-${Date.now()}-${Math.random()}`;
    
    // Simulate setting a value by creating a transaction
    const tx = JSON.stringify({
      op: 'set',
      key: uniqueKey,
      value: uniqueValue
    });
    
    await sqliteAdapter.execute(
      'INSERT OR IGNORE INTO transactions (ses, idx, tx) VALUES (?, ?, ?)',
      [1, counter, tx]
    );
  });
  
  return bench;
}

// Benchmark for getting values from a coValue
async function covalue_get_benchmark() {
  const { account, sqliteAdapter } = await setupJazzEnvironment();
  
  // Create a unique ID for this benchmark run
  const mapId = `comap-get-${Date.now()}`;
  
  // Insert the initial map into SQLite
  const header = JSON.stringify({
    type: 'comap',
    meta: { createdAt: Date.now(), id: mapId }
  });
  
  await sqliteAdapter.execute(
    'INSERT OR REPLACE INTO coValues (id, header) VALUES (?, ?)',
    [mapId, header]
  );
  
  // Create a session for this map
  const sessionId = `session-${Date.now()}`;
  await sqliteAdapter.execute(
    'INSERT OR REPLACE INTO sessions (coValue, sessionID, lastIdx) VALUES (?, ?, ?)',
    [1, sessionId, 100]
  );
  
  // Add 100 entries to the CoMap as transactions
  const keys: string[] = [];
  for (let i = 0; i < 100; i++) {
    const key = `benchmark-key-${i}`;
    keys.push(key);
    const tx = JSON.stringify({
      op: 'set',
      key: key,
      value: `benchmark-value-${i}-${Date.now()}`
    });
    
    await sqliteAdapter.execute(
      'INSERT OR IGNORE INTO transactions (ses, idx, tx) VALUES (?, ?, ?)',
      [1, i, tx]
    );
  }
  
  const bench = new Bench({
    name: 'covalue-get',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  bench.add('get-value', async () => {
    // Get a random key from the CoMap by simulating a get operation
    const randomIndex = Math.floor(Math.random() * keys.length);
    const key = keys[randomIndex];
    
    // Simulate getting a value by reading the transaction
    await sqliteAdapter.execute(
      'SELECT tx FROM transactions WHERE ses = ? AND idx = ?',
      [1, randomIndex]
    );
  });
  
  return bench;
}

// Benchmark for batch operations on a coValue
async function covalue_batch_operations_benchmark() {
  const { account, sqliteAdapter } = await setupJazzEnvironment();
  
  // Create a unique ID for this benchmark run
  const mapId = `comap-batch-${Date.now()}`;
  
  // Insert the initial map into SQLite
  const header = JSON.stringify({
    type: 'comap',
    meta: { createdAt: Date.now(), id: mapId }
  });
  
  await sqliteAdapter.execute(
    'INSERT OR REPLACE INTO coValues (id, header) VALUES (?, ?)',
    [mapId, header]
  );
  
  // Create a session for this map
  const sessionId = `session-batch-${Date.now()}`;
  await sqliteAdapter.execute(
    'INSERT OR REPLACE INTO sessions (coValue, sessionID, lastIdx) VALUES (?, ?, ?)',
    [1, sessionId, 0]
  );
  
  const bench = new Bench({
    name: 'covalue-batch-operations',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  let batchCounter = 0;
  
  bench.add('batch-operations', async () => {
    const batchId = `batch-${batchCounter++}-${Date.now()}`;
    
    // Perform a batch of operations (10 sets) using multiple statements
    for (let i = 0; i < 10; i++) {
      const key = `${batchId}-key-${i}`;
      const value = `${batchId}-value-${i}-${Date.now()}`;
      
      const txData = JSON.stringify({
        op: 'set',
        key: key,
        value: value
      });
      
      await sqliteAdapter.execute(
        'INSERT OR IGNORE INTO transactions (ses, idx, tx) VALUES (?, ?, ?)',
        [1, batchCounter * 10 + i, txData]
      );
    }
  });
  
  return bench;
}

// Benchmark for nested map operations
async function covalue_nested_map_benchmark() {
  const { account, sqliteAdapter } = await setupJazzEnvironment();
  
  // Create parent and child map IDs
  const parentMapId = `parent-map-${Date.now()}`;
  const childMapId = `child-map-${Date.now()}`;
  
  // Insert the parent map into SQLite
  const parentHeader = JSON.stringify({
    type: 'comap',
    meta: { createdAt: Date.now(), id: parentMapId }
  });
  
  await sqliteAdapter.execute(
    'INSERT OR REPLACE INTO coValues (id, header) VALUES (?, ?)',
    [parentMapId, parentHeader]
  );
  
  // Insert the child map into SQLite
  const childHeader = JSON.stringify({
    type: 'comap',
    meta: { createdAt: Date.now(), id: childMapId }
  });
  
  await sqliteAdapter.execute(
    'INSERT OR REPLACE INTO coValues (id, header) VALUES (?, ?)',
    [childMapId, childHeader]
  );
  
  // Create sessions for both maps
  await sqliteAdapter.execute(
    'INSERT OR REPLACE INTO sessions (coValue, sessionID, lastIdx) VALUES (?, ?, ?)',
    [1, `parent-session-${Date.now()}`, 1]
  );
  
  await sqliteAdapter.execute(
    'INSERT OR REPLACE INTO sessions (coValue, sessionID, lastIdx) VALUES (?, ?, ?)',
    [2, `child-session-${Date.now()}`, 2]
  );
  
  // Link the child map to the parent with a transaction
  const linkTx = JSON.stringify({
    op: 'set',
    key: 'child',
    value: childMapId
  });
  
  await sqliteAdapter.execute(
    'INSERT OR IGNORE INTO transactions (ses, idx, tx) VALUES (?, ?, ?)',
    [1, 0, linkTx]
  );
  
  // Add initial values to child map
  const childTx1 = JSON.stringify({
    op: 'set',
    key: 'childKey1',
    value: 'childValue1'
  });
  
  const childTx2 = JSON.stringify({
    op: 'set',
    key: 'childKey2',
    value: 'childValue2'
  });
  
  await sqliteAdapter.execute(
    'INSERT OR IGNORE INTO transactions (ses, idx, tx) VALUES (?, ?, ?)',
    [2, 0, childTx1]
  );
  
  await sqliteAdapter.execute(
    'INSERT OR IGNORE INTO transactions (ses, idx, tx) VALUES (?, ?, ?)',
    [2, 1, childTx2]
  );
  
  const bench = new Bench({
    name: 'covalue-nested-map',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  let nestedCounter = 0;
  
  bench.add('nested-operations', async () => {
    const uniqueId = `nested-${nestedCounter++}-${Date.now()}`;
    
    // Add a new key to the parent with a transaction
    const parentTx = JSON.stringify({
      op: 'set',
      key: `parent-${uniqueId}`,
      value: `parent-value-${uniqueId}`
    });
    
    await sqliteAdapter.execute(
      'INSERT OR IGNORE INTO transactions (ses, idx, tx) VALUES (?, ?, ?)',
      [1, nestedCounter * 2, parentTx]
    );
    
    // Add a new key to the child with a transaction
    const childTx = JSON.stringify({
      op: 'set',
      key: `child-${uniqueId}`,
      value: `child-value-${uniqueId}`
    });
    
    await sqliteAdapter.execute(
      'INSERT OR IGNORE INTO transactions (ses, idx, tx) VALUES (?, ?, ?)',
      [2, nestedCounter * 2 + 2, childTx]
    );
  });
  
  return bench;
}

// Run all benchmarks and return the results
export const runCoValueBenchmarks = async (): Promise<Bench[]> => {
  const benchmarks = [];
  
  // Run each benchmark and collect the results
  for (const benchFn of benches) {
    const bench = await benchFn();
    await bench.run();
    benchmarks.push(bench);
  }
  
  return benchmarks;
};

// Run a single benchmark by name
export const runSingleCoValueBenchmark = async (benchmarkName: string): Promise<Bench[]> => {
  const benchFn = benchmarkMap[benchmarkName];
  if (!benchFn) {
    console.warn(`Benchmark '${benchmarkName}' not found`);
    return [];
  }
  
  const bench = await benchFn();
  await bench.run();
  return [bench];
};
