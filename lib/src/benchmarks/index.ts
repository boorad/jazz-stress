export { BenchmarkProvider, useBenchmark } from "./BenchmarkContext";
export type { BenchmarkContextType } from "./BenchmarkContext";
export { BenchmarkComponent } from "../components/BenchmarkComponent";
export { formatNumber, calculateTimes, cleanResults } from "./utils";

// Export storage benchmark utilities
export {
  processResults,
  runStorageBenchmarks,
  runSingleStorageBenchmark,
} from "./storage";

export type {
  BenchmarkResult,
  CryptoBenchmarkResult,
  StorageBenchmarkResult,
  BenchmarkUtils,
} from "./types";
