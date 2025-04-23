import { Bench } from 'tinybench';
import { OPSQLiteAdapter } from 'jazz-react-native';

// Increase benchmark time for more accurate results
const TIME_MS = 5000;  // 5 seconds
const WARMUP_MS = 500;  // 0.5 seconds

// Setup the SQLite adapter for benchmarking
const setupSQLiteAdapter = async () => {
  const sqliteAdapter = new OPSQLiteAdapter('jazz-stress-benchmark.db');
  await sqliteAdapter.initialize();
  return sqliteAdapter;
};

// Benchmark for creating many coValues in parallel - this should trigger the database locking issue
export const covalue_parallel_creation_benchmark = async () => {
  const sqliteAdapter = await setupSQLiteAdapter();
  
  // First, ensure the coValues table exists
  try {
    await sqliteAdapter.execute(`
      CREATE TABLE IF NOT EXISTS coValues (
        id TEXT PRIMARY KEY,
        header TEXT NOT NULL
      )
    `);
  } catch (error) {
    console.error('Error creating coValues table:', error);
  }
  
  const bench = new Bench({
    name: 'covalue-parallel-creation',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  // Add a task for the benchmark
  bench.add('sqlite', async () => {
    try {
      // Create 20 coValues in parallel - this should be enough to potentially trigger locking issues
      const promises = [];
      const timestamp = Date.now();
      for (let i = 0; i < 20; i++) {
        const id = `covalue_${i}_${timestamp}`;
        const header = JSON.stringify({
          type: 'comap',
          meta: { createdAt: timestamp, id: `${id}_${i}` } // Ensure unique header by adding unique id
        });
        
        promises.push(
          sqliteAdapter.execute(
            'INSERT OR REPLACE INTO coValues (id, header) VALUES (?, ?)',
            [id, header]
          )
        );
      }
      await Promise.all(promises);
    } catch (error) {
      console.error('Error in parallel creation benchmark:', error);
      throw error; // Re-throw to ensure benchmark records the error
    }
  });
  
  return bench;
};

// Benchmark for sequential coValue creation
export const covalue_sequential_creation_benchmark = async () => {
  const sqliteAdapter = await setupSQLiteAdapter();
  
  // First, ensure the coValues table exists
  try {
    await sqliteAdapter.execute(`
      CREATE TABLE IF NOT EXISTS coValues (
        id TEXT PRIMARY KEY,
        header TEXT NOT NULL
      )
    `);
  } catch (error) {
    console.error('Error creating coValues table:', error);
  }
  
  const bench = new Bench({
    name: 'covalue-sequential-creation',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  let counter = 0;
  
  bench.add('sqlite', async () => {
    try {
      // Create a single coValue
      const timestamp = Date.now();
      const id = `covalue_seq_${counter}_${timestamp}`;
      const header = JSON.stringify({
        type: 'comap',
        meta: { createdAt: timestamp, id: `${id}_${counter}` } // Ensure unique header
      });
      counter++;
      
      await sqliteAdapter.execute(
        'INSERT OR REPLACE INTO coValues (id, header) VALUES (?, ?)',
        [id, header]
      );
    } catch (error) {
      console.error('Error in sequential creation benchmark:', error);
      throw error; // Re-throw to ensure benchmark records the error
    }
  });
  
  return bench;
};

// Benchmark for creating sessions for coValues
export const covalue_sessions_benchmark = async () => {
  const sqliteAdapter = await setupSQLiteAdapter();
  
  // Create a base coValue first
  const timestamp = Date.now();
  const baseId = `base_covalue_${timestamp}`;
  const baseHeader = JSON.stringify({
    type: 'comap',
    meta: { createdAt: timestamp, id: baseId } // Ensure unique header
  });
  
  const result = await sqliteAdapter.execute(
    'INSERT INTO coValues (id, header) VALUES (?, ?)',
    [baseId, baseHeader]
  );
  
  const coValueRowId = result.insertId || 1;
  
  const bench = new Bench({
    name: 'covalue-sessions',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  let counter = 0;
  
  bench.add('sqlite', async () => {
    // Create a new session for the coValue
    const sessionId = `session_${counter}_${Date.now()}`;
    counter++;
    
    await sqliteAdapter.execute(
      'INSERT INTO sessions (coValue, sessionID, lastIdx, lastSignature) VALUES (?, ?, ?, ?)',
      [coValueRowId, sessionId, 0, 'signature']
    );
  });
  
  return bench;
};

// Benchmark for creating coValues with complex headers
export const covalue_complex_header_benchmark = async () => {
  const sqliteAdapter = await setupSQLiteAdapter();
  
  const bench = new Bench({
    name: 'covalue-complex-header',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  let counter = 0;
  
  bench.add('sqlite', async () => {
    // Create a complex header structure
    const timestamp = Date.now();
    const complexData: Record<string, any> = {
      type: 'comap',
      meta: {
        createdAt: timestamp,
        version: '1.0.0',
        author: 'benchmark',
        id: `complex_${counter}_${timestamp}`, // Ensure unique header
        properties: {}
      }
    };
    
    // Add 50 properties to simulate a complex header
    for (let i = 0; i < 50; i++) {
      complexData.meta.properties[`key_${counter}_${i}`] = `value_${counter}_${i}_${Date.now()}`;
    }
    counter++;
    
    const id = `complex_${counter}_${Date.now()}`;
    const header = JSON.stringify(complexData);
    
    await sqliteAdapter.execute(
      'INSERT INTO coValues (id, header) VALUES (?, ?)',
      [id, header]
    );
  });
  
  return bench;
};

// Benchmark specifically designed to reproduce the database locking issue
export const covalue_database_lock_benchmark = async () => {
  const sqliteAdapter = await setupSQLiteAdapter();
  
  const bench = new Bench({
    name: 'covalue-database-lock',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  bench.add('sqlite', async () => {
    // Simulate the scenario that causes the database locking issue
    // by performing multiple operations in parallel
    const operations = [];
    
    // Create 50 coValues in parallel - this should be enough to trigger locking issues
    const timestamp = Date.now();
    for (let i = 0; i < 50; i++) {
      const id = `lock_test_${i}_${timestamp}`;
      const header = JSON.stringify({
        type: 'comap',
        meta: { createdAt: timestamp, index: i, id: `${id}_${i}` } // Ensure unique header
      });
      
      operations.push(
        sqliteAdapter.execute(
          'INSERT INTO coValues (id, header) VALUES (?, ?)',
          [id, header]
        )
      );
    }
    
    // Execute all operations in parallel to increase the likelihood of locking
    await Promise.all(operations);
  });
  
  return bench;
};

// Benchmark for simulating transactions and sessions simultaneously
export const covalue_transaction_session_benchmark = async () => {
  const sqliteAdapter = await setupSQLiteAdapter();
  
  // Create a base coValue first
  const timestamp = Date.now();
  const baseId = `transaction_base_${timestamp}`;
  const baseHeader = JSON.stringify({
    type: 'comap',
    meta: { createdAt: timestamp, id: baseId } // Ensure unique header
  });
  
  const result = await sqliteAdapter.execute(
    'INSERT INTO coValues (id, header) VALUES (?, ?)',
    [baseId, baseHeader]
  );
  
  const coValueRowId = result.insertId || 1;
  
  // Create a session for the coValue
  const sessionResult = await sqliteAdapter.execute(
    'INSERT INTO sessions (coValue, sessionID, lastIdx, lastSignature) VALUES (?, ?, ?, ?)',
    [coValueRowId, `session_${Date.now()}`, 0, 'signature']
  );
  
  const sessionRowId = sessionResult.insertId || 1;
  
  const bench = new Bench({
    name: 'covalue-transaction-session',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  let counter = 0;
  
  bench.add('sqlite', async () => {
    // Create operations that will run in parallel
    const operations = [];
    
    // Add transactions
    for (let i = 0; i < 10; i++) {
      const idx = counter + i;
      const tx = JSON.stringify({
        op: 'set',
        key: `key_${idx}`,
        value: `value_${idx}_${Date.now()}`
      });
      
      operations.push(
        sqliteAdapter.execute(
          'INSERT INTO transactions (ses, idx, tx) VALUES (?, ?, ?)',
          [sessionRowId, idx, tx]
        )
      );
    }
    
    // Create new coValues at the same time
    const timestamp = Date.now();
    for (let i = 0; i < 5; i++) {
      const id = `new_covalue_${counter}_${i}_${timestamp}`;
      const header = JSON.stringify({
        type: 'comap',
        meta: { createdAt: timestamp, id: `${id}_${i}` } // Ensure unique header
      });
      
      operations.push(
        sqliteAdapter.execute(
          'INSERT INTO coValues (id, header) VALUES (?, ?)',
          [id, header]
        )
      );
    }
    
    counter += 10;
    
    // Execute all operations in parallel
    await Promise.all(operations);
  });
  
  return bench;
};

export default [
  covalue_parallel_creation_benchmark,
  covalue_sequential_creation_benchmark,
  covalue_sessions_benchmark,
  covalue_complex_header_benchmark,
  covalue_database_lock_benchmark,
  covalue_transaction_session_benchmark
];
