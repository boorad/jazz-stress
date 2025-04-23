import { Bench } from 'tinybench';
import { OPSQLiteAdapter } from 'jazz-react-native';

// Increase benchmark time for more accurate results
const TIME_MS = 5000;  // 5 seconds
const WARMUP_MS = 500;  // 0.5 seconds

// Benchmarks for synchronous SQLite operations
const benches = [
  sqlite_sync_insert_benchmark,
  sqlite_sync_select_benchmark,
  sqlite_sync_update_benchmark,
  sqlite_sync_delete_benchmark,
  sqlite_sync_complex_query_benchmark
];

// Map benchmark names to functions
export const benchmarkMap: Record<string, () => Promise<Bench>> = {
  'sqlite-sync-insert': sqlite_sync_insert_benchmark,
  'sqlite-sync-select': sqlite_sync_select_benchmark,
  'sqlite-sync-update': sqlite_sync_update_benchmark,
  'sqlite-sync-delete': sqlite_sync_delete_benchmark,
  'sqlite-sync-complex-query': sqlite_sync_complex_query_benchmark
};

// Setup the SQLite adapter
export const setupSQLiteAdapter = async () => {
  // Use a unique database name to avoid conflicts
  const dbName = `jazz-stress-sync-benchmark-${Date.now()}.db`;
  const sqliteAdapter = new OPSQLiteAdapter(dbName);
  await sqliteAdapter.initialize();
  return sqliteAdapter;
};

// Benchmark for synchronous INSERT operations
async function sqlite_sync_insert_benchmark() {
  const sqliteAdapter = await setupSQLiteAdapter();
  
  // Create a test table
  sqliteAdapter.executeSync(`
    CREATE TABLE IF NOT EXISTS test_sync_insert (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);
  
  const bench = new Bench({
    name: 'sqlite-sync-insert',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  let counter = 0;
  
  bench.add('sync-insert', () => {
    const id = `id_${counter++}_${Date.now()}`;
    const value = `value_${Date.now()}_${Math.random()}`;
    const timestamp = Date.now();
    
    // Use synchronous execute
    sqliteAdapter.executeSync(
      'INSERT OR REPLACE INTO test_sync_insert (id, value, timestamp) VALUES (?, ?, ?)',
      [id, value, timestamp]
    );
  });
  
  return bench;
}

// Benchmark for synchronous SELECT operations
async function sqlite_sync_select_benchmark() {
  const sqliteAdapter = await setupSQLiteAdapter();
  
  // Create a test table
  sqliteAdapter.executeSync(`
    CREATE TABLE IF NOT EXISTS test_sync_select (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);
  
  // Insert test data
  const totalRows = 1000;
  for (let i = 0; i < totalRows; i++) {
    const id = `id_${i}`;
    const value = `value_${i}`;
    const timestamp = Date.now() - i * 1000; // Different timestamps
    
    sqliteAdapter.executeSync(
      'INSERT OR REPLACE INTO test_sync_select (id, value, timestamp) VALUES (?, ?, ?)',
      [id, value, timestamp]
    );
  }
  
  const bench = new Bench({
    name: 'sqlite-sync-select',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  bench.add('sync-select', () => {
    // Random ID between 0 and totalRows-1
    const randomId = Math.floor(Math.random() * totalRows);
    
    // Use synchronous execute for SELECT
    sqliteAdapter.executeSync(
      'SELECT * FROM test_sync_select WHERE id = ?',
      [`id_${randomId}`]
    );
  });
  
  return bench;
}

// Benchmark for synchronous UPDATE operations
async function sqlite_sync_update_benchmark() {
  const sqliteAdapter = await setupSQLiteAdapter();
  
  // Create a test table
  sqliteAdapter.executeSync(`
    CREATE TABLE IF NOT EXISTS test_sync_update (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      counter INTEGER NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);
  
  // Insert test data
  const totalRows = 1000;
  for (let i = 0; i < totalRows; i++) {
    const id = `id_${i}`;
    const value = `value_${i}`;
    const timestamp = Date.now() - i * 1000; // Different timestamps
    
    sqliteAdapter.executeSync(
      'INSERT OR REPLACE INTO test_sync_update (id, value, counter, timestamp) VALUES (?, ?, ?, ?)',
      [id, value, 0, timestamp]
    );
  }
  
  const bench = new Bench({
    name: 'sqlite-sync-update',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  bench.add('sync-update', () => {
    // Random ID between 0 and totalRows-1
    const randomId = Math.floor(Math.random() * totalRows);
    const newValue = `updated_${Date.now()}_${Math.random()}`;
    
    // Use synchronous execute for UPDATE
    sqliteAdapter.executeSync(
      'UPDATE test_sync_update SET value = ?, counter = counter + 1, timestamp = ? WHERE id = ?',
      [newValue, Date.now(), `id_${randomId}`]
    );
  });
  
  return bench;
}

// Benchmark for synchronous DELETE operations
async function sqlite_sync_delete_benchmark() {
  const sqliteAdapter = await setupSQLiteAdapter();
  
  // Create a test table
  sqliteAdapter.executeSync(`
    CREATE TABLE IF NOT EXISTS test_sync_delete (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    )
  `);
  
  const bench = new Bench({
    name: 'sqlite-sync-delete',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  let counter = 0;
  
  bench.add('sync-delete', () => {
    // First insert a row
    const id = `id_${counter++}_${Date.now()}`;
    const value = `value_${Date.now()}_${Math.random()}`;
    const timestamp = Date.now();
    
    sqliteAdapter.executeSync(
      'INSERT INTO test_sync_delete (id, value, timestamp) VALUES (?, ?, ?)',
      [id, value, timestamp]
    );
    
    // Then delete it immediately
    sqliteAdapter.executeSync(
      'DELETE FROM test_sync_delete WHERE id = ?',
      [id]
    );
  });
  
  return bench;
}

// Benchmark for complex synchronous queries
async function sqlite_sync_complex_query_benchmark() {
  const sqliteAdapter = await setupSQLiteAdapter();
  
  // Create test tables
  sqliteAdapter.executeSync(`
    CREATE TABLE IF NOT EXISTS test_sync_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  
  sqliteAdapter.executeSync(`
    CREATE TABLE IF NOT EXISTS test_sync_posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES test_sync_users (id)
    )
  `);
  
  // Insert test users
  const userCount = 100;
  for (let i = 0; i < userCount; i++) {
    const userId = `user_${i}`;
    const name = `User ${i}`;
    const email = `user${i}@example.com`;
    const createdAt = Date.now() - i * 86400000; // Different days
    
    sqliteAdapter.executeSync(
      'INSERT OR REPLACE INTO test_sync_users (id, name, email, created_at) VALUES (?, ?, ?, ?)',
      [userId, name, email, createdAt]
    );
    
    // Insert posts for each user
    const postsPerUser = 10;
    for (let j = 0; j < postsPerUser; j++) {
      const postId = `post_${i}_${j}`;
      const title = `Post ${j} by User ${i}`;
      const content = `This is the content of post ${j} by user ${i}. ${Math.random().toString(36).substring(2, 15)}`;
      const postCreatedAt = createdAt + j * 3600000; // Different hours
      
      sqliteAdapter.executeSync(
        'INSERT OR REPLACE INTO test_sync_posts (id, user_id, title, content, created_at) VALUES (?, ?, ?, ?, ?)',
        [postId, userId, title, content, postCreatedAt]
      );
    }
  }
  
  const bench = new Bench({
    name: 'sqlite-sync-complex-query',
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });
  
  bench.add('sync-complex-query', () => {
    // Random user ID
    const randomUserId = Math.floor(Math.random() * userCount);
    
    // Complex query with JOIN, ORDER BY, and LIMIT
    sqliteAdapter.executeSync(`
      SELECT 
        u.name, 
        u.email, 
        p.title, 
        p.content, 
        p.created_at
      FROM 
        test_sync_users u
      JOIN 
        test_sync_posts p ON u.id = p.user_id
      WHERE 
        u.id = ?
      ORDER BY 
        p.created_at DESC
      LIMIT 5
    `, [`user_${randomUserId}`]);
  });
  
  return bench;
}

// Run all benchmarks and return the results
export const runSyncBenchmarks = async (): Promise<Bench[]> => {
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
export const runSingleSyncBenchmark = async (benchmarkName: string): Promise<Bench[]> => {
  const benchFn = benchmarkMap[benchmarkName];
  if (!benchFn) {
    console.warn(`Benchmark '${benchmarkName}' not found`);
    return [];
  }
  
  const bench = await benchFn();
  await bench.run();
  return [bench];
};
