import { Bench } from 'tinybench';
import benches, {
  covalue_parallel_creation_benchmark,
  covalue_sequential_creation_benchmark,
  covalue_sessions_benchmark,
  covalue_complex_header_benchmark,
  covalue_database_lock_benchmark,
  covalue_transaction_session_benchmark
} from './benches';

// Define the type for benchmark functions
type BenchmarkFunction = () => Promise<Bench>;

// Map of benchmark names to their functions
export const benchmarkMap: Record<string, BenchmarkFunction> = {
  'parallel-creation': covalue_parallel_creation_benchmark,
  'sequential-creation': covalue_sequential_creation_benchmark,
  'sessions': covalue_sessions_benchmark,
  'complex-header': covalue_complex_header_benchmark,
  'database-lock': covalue_database_lock_benchmark,
  'transaction-session': covalue_transaction_session_benchmark
};

// Run all storage benchmarks
export const runStorageBenchmarks = async (): Promise<Bench[]> => {
  const benchmarks = [];
  
  // Run each benchmark and collect the results
  for (const benchFn of benches) {
    try {
      // Create and configure the benchmark
      const bench = await benchFn();
      
      // Run the benchmark
      await bench.run();
      
      benchmarks.push(bench);
    } catch (error) {
      console.error(`Error running benchmark:`, error);
    }
  }

  return benchmarks;
};

// Run a specific benchmark by name
export const runSingleBenchmark = async (benchmarkName: string): Promise<Bench[]> => {
  // Find the benchmark function
  const benchFn = benchmarkMap[benchmarkName];
  
  if (!benchFn) {
    console.warn(`Benchmark '${benchmarkName}' not found`);
    return [];
  }
  
  try {
    // Create and configure the benchmark
    const bench = await benchFn();
    
    // Run the benchmark
    await bench.run();
    
    return [bench];
  } catch (error) {
    console.error(`Error running single benchmark:`, error);
    return [];
  }
};


