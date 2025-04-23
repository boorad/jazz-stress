import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Define the context types
type BenchmarkContextType = {
  isRunning: boolean;
  runId: number;
  runBenchmarks: () => void;
  runSingleBenchmark: (id: string) => void;
  registerBenchmark: (id: string, name: string) => void;
  unregisterBenchmark: (id: string) => void;
  benchmarks: Record<string, { name: string; isComplete: boolean }>;
  setBenchmarkComplete: (id: string, isComplete: boolean) => void;
};

// Create the context with default values
const BenchmarkContext = createContext<BenchmarkContextType>({
  isRunning: false,
  runId: 0,
  runBenchmarks: () => {},
  runSingleBenchmark: () => {},
  registerBenchmark: () => {},
  unregisterBenchmark: () => {},
  benchmarks: {},
  setBenchmarkComplete: () => {},
});

// Hook for components to use the benchmark context
export const useBenchmark = () => useContext(BenchmarkContext);

// Provider component
export const BenchmarkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [runId, setRunId] = useState(0);
  const [benchmarks, setBenchmarks] = useState<Record<string, { name: string; isComplete: boolean }>>({});

  // Register a benchmark component
  const registerBenchmark = useCallback((id: string, name: string) => {
    setBenchmarks(prev => ({
      ...prev,
      [id]: { name, isComplete: false }
    }));
  }, []);

  // Unregister a benchmark component
  const unregisterBenchmark = useCallback((id: string) => {
    setBenchmarks(prev => {
      const newBenchmarks = { ...prev };
      delete newBenchmarks[id];
      return newBenchmarks;
    });
  }, []);

  // Set a benchmark as complete
  const setBenchmarkComplete = useCallback((id: string, isComplete: boolean) => {
    setBenchmarks(prev => ({
      ...prev,
      [id]: { ...prev[id], isComplete }
    }));
  }, []);

  // Run all benchmarks
  const runBenchmarks = useCallback(() => {
    // Reset completion status for all benchmarks
    setBenchmarks(prev => {
      const resetBenchmarks: Record<string, { name: string; isComplete: boolean }> = {};
      Object.keys(prev).forEach(id => {
        resetBenchmarks[id] = { ...prev[id], isComplete: false };
      });
      return resetBenchmarks;
    });
    
    // Trigger a new benchmark run
    setIsRunning(true);
    setRunId(prev => prev + 1);
    
    // We'll let individual benchmark components set themselves as complete
  }, []);
  
  // Run a single benchmark by ID
  const runSingleBenchmark = useCallback((id: string) => {
    // Reset completion status for the specific benchmark
    setBenchmarks(prev => {
      const updatedBenchmarks = { ...prev };
      if (updatedBenchmarks[id]) {
        updatedBenchmarks[id] = { ...updatedBenchmarks[id], isComplete: false };
      }
      return updatedBenchmarks;
    });
    
    // Trigger a new benchmark run
    setIsRunning(true);
    setRunId(prev => prev + 1);
  }, []);

  const value = {
    isRunning,
    runId,
    runBenchmarks,
    runSingleBenchmark,
    registerBenchmark,
    unregisterBenchmark,
    benchmarks,
    setBenchmarkComplete,
  };

  return (
    <BenchmarkContext.Provider value={value}>
      {children}
    </BenchmarkContext.Provider>
  );
};
