import { TaskResult } from "tinybench";

// Mode controls sync or async SQLiteClient
export type Mode = "async" | "sync";

// Generic benchmark result type
export interface BenchmarkResult {
  name: string;
  [key: string]: any;
}

// Crypto-specific benchmark result type
export interface CryptoBenchmarkResult {
  name: string | undefined;
  pure: Readonly<TaskResult> | undefined;
  rnqc: Readonly<TaskResult> | undefined;
}

// Storage-specific benchmark result type for SQLite operations
export interface StorageBenchmarkResult {
  name: string | undefined;
  latency: { mean: number };
  throughput: { mean: number };
}

// Common benchmark utilities
export interface BenchmarkUtils {
  formatNumber: (n: number, decimals: number, suffix: string) => string;
  calculateTimes: (us: number, them: number) => number;
}
