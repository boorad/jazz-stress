import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useBenchmark } from '../benchmarks/BenchmarkContext';
import { BenchmarkComponent } from '../benchmarks/BenchmarkComponent';
import { CryptoBenchmarkResult } from '../benchmarks/types';
import { calculateTimes, cleanResults, formatNumber } from '../benchmarks/utils';
import { runCryptoBenchmarks, runSingleBenchmark, benchmarkMap } from './benchmarks';

export function CryptoBenchmarks() {
  const [results, setResults] = useState<CryptoBenchmarkResult[]>([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string | null>(null);
  const { runId, setBenchmarkComplete, registerBenchmark, unregisterBenchmark, shouldRunBenchmark } = useBenchmark();

  // Register this benchmark component when mounted
  useEffect(() => {
    registerBenchmark('crypto', 'Crypto Benchmarks');
    return () => unregisterBenchmark('crypto');
  }, [registerBenchmark, unregisterBenchmark]);

  useEffect(() => {
    // Only run if this benchmark component should run
    if (runId > 0 && shouldRunBenchmark('crypto')) {
      // Reset results when a new benchmark run is triggered
      setResults([]);

      // Check if we're running a specific benchmark or all benchmarks
      const benchmarkPromise = selectedBenchmark
        ? runSingleBenchmark(selectedBenchmark)
        : runCryptoBenchmarks();

      // Run the benchmarks and update the results
      benchmarkPromise.then((newResults) => {
        setResults(newResults);
        setBenchmarkComplete('crypto', true);
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

  const renderBenchmark = ({item}: {item: CryptoBenchmarkResult}) => {
    const {name, pure, rnqc} = item;
    const p = cleanResults(name, pure);
    const r = cleanResults(name, rnqc);

    if (!name) {
      return null;
    }

    // Extract the benchmark key from the name
    const benchmarkKey = name.replace(/\//g, '-').toLowerCase();

    return (
      <View style={styles.sectionContainer}>
        {/* Benchmark title on its own row */}
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>{name}</Text>
        </View>

        {/* Headers row with more space */}
        <View style={styles.headerRow}>
          <Text style={[styles.text, styles.label]}>Implementation</Text>
          <Text style={[styles.text, styles.headerValue]}>ms</Text>
          <Text style={[styles.text, styles.headerValue]}>ops/s</Text>
        </View>

        {/* Results rows */}
        <View style={styles.resultsContainer}>
          <Text style={[styles.text, styles.label]}>PureJSCrypto</Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(p.latency?.mean || 0, 2, '')}
          </Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(p.throughput?.mean || 0, 2, '')}
          </Text>
        </View>
        <View style={styles.resultsContainer}>
          <Text style={[styles.text, styles.label]}>RNQuickCrypto</Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(r.latency?.mean || 0, 2, '')}
          </Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(r.throughput?.mean || 0, 2, '')}
          </Text>
        </View>
        <View style={styles.resultsContainer}>
          <Text style={[styles.text, styles.label]}>Improvement</Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(
              calculateTimes(r.latency?.mean || 0, p.latency?.mean || 0),
              2,
              'x',
            )}
          </Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(
              calculateTimes(r.throughput?.mean || 0, p.throughput?.mean || 0),
              2,
              'x',
            )}
          </Text>
        </View>


      </View>
    );
  };

  return (
    <BenchmarkComponent name="Crypto Benchmarks" id="crypto">
      <FlatList
        data={results}
        renderItem={renderBenchmark}
        style={styles.list}
        ListEmptyComponent={
          runId > 0 ? (
            <ActivityIndicator />
          ) : null
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
  titleRow: {
    marginBottom: 8,
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
    paddingVertical: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
    marginBottom: 4,
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
    minWidth: 80,
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
