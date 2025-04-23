import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useBenchmark } from '../benchmarks/BenchmarkContext';
import { BenchmarkComponent } from '../benchmarks/BenchmarkComponent';
import { formatNumber } from '../benchmarks/utils';
import { runSyncBenchmarks, runSingleSyncBenchmark, benchmarkMap } from './sync-benches';
import { Bench } from 'tinybench';

// Define the result type for our benchmarks
interface BenchmarkResult {
  name: string;
  latency: { mean: number };
  throughput: { mean: number };
}

function SyncStorageBenchmarks() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string | null>(null);
  const { runId, setBenchmarkComplete, registerBenchmark, unregisterBenchmark, shouldRunBenchmark } = useBenchmark();

  // Register this benchmark component when mounted
  useEffect(() => {
    registerBenchmark('sync-storage', 'Sync Storage Benchmarks');
    return () => unregisterBenchmark('sync-storage');
  }, [registerBenchmark, unregisterBenchmark]);

  useEffect(() => {
    // Only run if this benchmark component should run
    if (runId > 0 && shouldRunBenchmark('sync-storage')) {
      // Reset results when a new benchmark run is triggered
      setResults([]);

      // Check if we're running a specific benchmark or all benchmarks
      const benchmarkPromise = selectedBenchmark
        ? runSingleSyncBenchmark(selectedBenchmark)
        : runSyncBenchmarks();

      // Run the benchmarks and update the results
      benchmarkPromise.then((benchResults) => {
        // Transform the benchmark results into a format for display
        const formattedResults = benchResults.map(bench => {
          // Ensure the bench has a name and tasks
          const name = bench.name || 'Unnamed Benchmark';
          const task = bench.tasks[0];

          // Access the result object dynamically to avoid TypeScript errors
          const rawResult = task?.result as any;

          // Extract latency and throughput values
          let latencyMean = 0;
          let throughputMean = 0;

          if (rawResult) {
            // Try to get latency from stats.mean or directly from mean
            if (rawResult.stats && typeof rawResult.stats.mean === 'number') {
              latencyMean = rawResult.stats.mean;
            } else if (typeof rawResult.mean === 'number') {
              latencyMean = rawResult.mean;
            }

            // Try to get throughput from hz
            if (typeof rawResult.hz === 'number') {
              throughputMean = rawResult.hz;
            }
          }

          return {
            name,
            latency: { mean: latencyMean },
            throughput: { mean: throughputMean }
          };
        });

        setResults(formattedResults);
        setBenchmarkComplete('sync-storage', true);
        setSelectedBenchmark(null); // Reset selected benchmark after run
      });
    }
  }, [runId, setBenchmarkComplete, selectedBenchmark, shouldRunBenchmark]);

  // Function to run a specific benchmark
  const runBenchmark = (benchmarkKey: string) => {
    setSelectedBenchmark(benchmarkKey);
    // The useEffect will handle running the benchmark when runId changes
    // We'll use the BenchmarkComponent's re-run button to trigger this
  };

  const renderBenchmark = ({item}: {item: BenchmarkResult}) => {
    const {name, latency, throughput} = item;

    // Extract a cleaner name from the benchmark name
    const cleanName = name.replace('sqlite-sync-', '').replace(/-/g, ' ');

    return (
      <View style={styles.resultsContainer}>
        <Text style={[styles.text, styles.label]}>{cleanName}</Text>
        <Text style={[styles.text, styles.value]}>
          {formatNumber(latency?.mean || 0, 2, '')}
        </Text>
        <Text style={[styles.text, styles.value]}>
          {formatNumber(throughput?.mean || 0, 2, '')}
        </Text>
      </View>
    );
  };

  return (
    <BenchmarkComponent name="Storage (op-sqlite, sync)" id="sync-storage">
      {results.length > 0 && (
        <View style={styles.tableContainer}>
          {/* Table header */}
          <View style={styles.headerRow}>
            <Text style={[styles.text, styles.label]}>Benchmark</Text>
            <Text style={[styles.text, styles.headerValue]}>ms</Text>
            <Text style={[styles.text, styles.headerValue]}>ops/s</Text>
          </View>

          {/* Table rows */}
          <FlatList
            data={results}
            renderItem={renderBenchmark}
            style={styles.list}
          />
        </View>
      )}

      {results.length === 0 && (
        <Text style={styles.text}>
          {runId > 0 ? <ActivityIndicator /> : null}
        </Text>
      )}
    </BenchmarkComponent>
  );
}

const styles = StyleSheet.create({
  tableContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
    marginBottom: 8,
  },
  headerValue: {
    fontFamily: 'Courier New',
    minWidth: 80,
    textAlign: 'right',
    alignSelf: 'flex-end',
    fontSize: 14,
    color: '#aaa',
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  list: {
    flex: 1,
  },
  text: {
    color: '#fff',
  },
  label: {
    fontFamily: 'Courier New',
    textAlign: 'left',
    minWidth: 160,
    color: '#fff',
  },
  value: {
    fontFamily: 'Courier New',
    minWidth: 80,
    textAlign: 'right',
    alignSelf: 'flex-end',
    color: '#fff',
  },
});

export { SyncStorageBenchmarks };
