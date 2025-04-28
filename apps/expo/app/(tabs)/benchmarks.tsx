import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { BenchmarkProvider, useBenchmark } from 'lib/benchmarks';
import { CryptoBenchmarks, CoValueBenchmarks } from 'lib/components';
import { runCryptoBenchmarks, runSingleBenchmark } from '../../crypto/benchmarks';
import { runCoValueBenchmarks, runSingleCoValueBenchmark } from '../../storage/benchmarks';

function RunButton() {
  const { runBenchmarks } = useBenchmark();
  return (
    <TouchableOpacity onPress={runBenchmarks} style={styles.runButton}>
      <Text style={styles.buttonText}>Run Benchmarks</Text>
    </TouchableOpacity>
  );
}

function BenchmarksScreenContent(): JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <CryptoBenchmarks runAll={runCryptoBenchmarks} runSingle={runSingleBenchmark} />
        <CoValueBenchmarks mode="async" runAll={runCoValueBenchmarks} runSingle={runSingleCoValueBenchmark} />
        <CoValueBenchmarks mode="sync" runAll={runCoValueBenchmarks} runSingle={runSingleCoValueBenchmark} />
      </ScrollView>
      <RunButton />
    </SafeAreaView>
  );
}

export default function BenchmarksScreen(): JSX.Element {
  return (
    <BenchmarkProvider>
      <BenchmarksScreenContent />
    </BenchmarkProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333',
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  runButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    padding: 12,
    margin: 16,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});
