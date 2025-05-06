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
import { runCryptoBenchmarks, runSingleCryptoBenchmark } from "../crypto/benchmarks";
import {
  runCoValueBenchmarks,
  runSingleCoValueBenchmark,
} from "../storage/benchmarks";

// Suppress VirtualizedLists nesting warning
LogBox.ignoreLogs(["VirtualizedLists should never be nested"]);
LogBox.ignoreLogs(["Linking requires a build-time setting"]);

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
      <Text style={styles.title}>Jazz Stress Tests (Expo)</Text>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <CryptoBenchmarks
          runAll={runCryptoBenchmarks}
          runSingle={runSingleCryptoBenchmark}
        />
        <CoValueBenchmarks
          library="expo-sqlite"
          mode="async"
          runAll={runCoValueBenchmarks}
          runSingle={runSingleCoValueBenchmark}
        />
        <CoValueBenchmarks
          library="expo-sqlite"
          mode="sync"
          runAll={runCoValueBenchmarks}
          runSingle={runSingleCoValueBenchmark}
        />
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
    backgroundColor: "#333",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: 10,
    paddingVertical: 16,
  },
  runButton: {
    backgroundColor: "#007AFF",
    borderRadius: 6,
    padding: 12,
    margin: 16,
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
});
