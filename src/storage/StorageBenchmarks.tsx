import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useBenchmark } from '../benchmarks/BenchmarkContext';
import { BenchmarkComponent } from '../benchmarks/BenchmarkComponent';
import { formatNumber } from '../benchmarks/utils';
import { runStorageBenchmarks, runSingleBenchmark, benchmarkMap } from './benchmarks';
import { Bench } from 'tinybench';

// We'll use a more dynamic approach to access the benchmark results

// Define the result type for our benchmarks
interface BenchmarkResult {
  name: string;
  latency: { mean: number };
  throughput: { mean: number };
}

export function StorageBenchmarks() {
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string | null>(null);
  const { runId, setBenchmarkComplete } = useBenchmark();

  useEffect(() => {
    if (runId > 0) {
      // Reset results when a new benchmark run is triggered
      setResults([]);

      // Check if we're running a specific benchmark or all benchmarks
      const benchmarkPromise = selectedBenchmark 
        ? runSingleBenchmark(selectedBenchmark)
        : runStorageBenchmarks();

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
        setBenchmarkComplete('storage', true);
        setSelectedBenchmark(null); // Reset selected benchmark after run
      });
    }
  }, [runId, setBenchmarkComplete, selectedBenchmark]);

  // Function to run a specific benchmark
  const runBenchmark = (benchmarkKey: string) => {
    setSelectedBenchmark(benchmarkKey);
    // The useEffect will handle running the benchmark when runId changes
    // We'll use the BenchmarkComponent's re-run button to trigger this
  };

  const renderBenchmark = ({item}: {item: BenchmarkResult}) => {
    const {name, latency, throughput} = item;
    
    // Extract the benchmark key from the name (e.g., 'covalue-parallel-creation' -> 'parallel-creation')
    const benchmarkKey = name.replace('covalue-', '');
    
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{name}</Text>
          <Text style={[styles.text, styles.value]}>latency</Text>
          <Text style={[styles.text, styles.value]}>throughput</Text>
        </View>
        <View style={styles.resultsContainer}>
          <Text style={[styles.text, styles.label]}>SQLite Operations</Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(latency?.mean || 0, 2, 'ms')}
          </Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(throughput?.mean || 0, 2, 'ops/s')}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.runButton}
          onPress={() => runBenchmark(benchmarkKey)}
        >
          <Text style={styles.runButtonText}>Run this benchmark</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <BenchmarkComponent name="Storage Benchmarks">
      <FlatList
        data={results}
        renderItem={renderBenchmark}
        style={styles.list}
        ListEmptyComponent={
          runId > 0 ? (
            <ActivityIndicator />
          ) : (
            null
          )
        }
      />
    </BenchmarkComponent>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    minWidth: 160,
    paddingVertical: 2,
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 3,
    paddingVertical: 4,
  },
  list: {},
  text: {
    color: '#fff',
  },
  label: {
    fontFamily: 'Courier New',
    textAlign: 'left',
    minWidth: 160,
  },
  value: {
    fontFamily: 'Courier New',
    minWidth: 60,
    textAlign: 'right',
    alignSelf: 'flex-end',
  },
  runButton: {
    backgroundColor: '#007AFF',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  runButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
});
