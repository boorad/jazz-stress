import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  LogBox,
} from "react-native";
import { BenchmarkProvider, useBenchmark } from "lib/benchmarks";
import { CryptoBenchmarks, CoValueBenchmarks } from "lib/components";
import { runCryptoBenchmarks, runSingleBenchmark } from "./crypto/benchmarks";
import {
  runCoValueBenchmarks,
  runSingleCoValueBenchmark,
} from "./storage/benchmarks";

// Suppress VirtualizedLists nesting warning
LogBox.ignoreLogs(["VirtualizedLists should never be nested"]);

// Button component that uses the benchmark context
function RunButton() {
  const { runBenchmarks } = useBenchmark();

  return (
    <TouchableOpacity onPress={runBenchmarks} style={styles.runButton}>
      <Text style={styles.buttonText}>Run Benchmarks</Text>
    </TouchableOpacity>
  );
}

// Main app content
function AppContent(): React.JSX.Element {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Jazz Stress Tests (RN)</Text>
      <ScrollView style={styles.scrollView}>
        <CryptoBenchmarks
          runAll={runCryptoBenchmarks}
          runSingle={runSingleBenchmark}
        />
        <CoValueBenchmarks
          library="op-sqlite"
          mode="async"
          runAll={runCoValueBenchmarks}
          runSingle={runSingleCoValueBenchmark}
        />
        <CoValueBenchmarks
          library="op-sqlite"
          mode="sync"
          runAll={runCoValueBenchmarks}
          runSingle={runSingleCoValueBenchmark}
        />
      </ScrollView>
      <RunButton />
    </SafeAreaView>
  );
}

// Root component that provides the benchmark context
export function App(): React.JSX.Element {
  return (
    <BenchmarkProvider>
      <AppContent />
    </BenchmarkProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#333",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginVertical: 4,
  },
  runButton: {
    backgroundColor: "#007AFF",
    borderRadius: 6,
    padding: 10,
    marginHorizontal: 10,
    marginVertical: 16,
    width: "80%",
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
});
