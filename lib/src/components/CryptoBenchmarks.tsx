import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useBenchmark,
  BenchmarkComponent,
  formatNumber,
  calculateTimes,
  cleanResults,
} from "../benchmarks";
import type { CryptoBenchmarkResult } from "../benchmarks/types";

interface CryptoBenchmarksProps {
  runAll: () => Promise<CryptoBenchmarkResult[]>;
  runSingle: (id: string) => Promise<CryptoBenchmarkResult[]>;
}

export const CryptoBenchmarks: React.FC<CryptoBenchmarksProps> = ({
  runAll,
  runSingle,
}) => {
  const [results, setResults] = useState<CryptoBenchmarkResult[]>([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string | null>(
    null
  );
  const {
    runId,
    setBenchmarkComplete,
    registerBenchmark,
    unregisterBenchmark,
    shouldRunBenchmark,
  } = useBenchmark();

  useEffect(() => {
    registerBenchmark("crypto", "Crypto Benchmarks");
    return () => unregisterBenchmark("crypto");
  }, [registerBenchmark, unregisterBenchmark]);

  useEffect(() => {
    if (runId > 0 && shouldRunBenchmark("crypto")) {
      setResults([]);
      const promise = selectedBenchmark
        ? runSingle(selectedBenchmark)
        : runAll();
      promise.then((newResults) => {
        setResults(newResults);
        setBenchmarkComplete("crypto", true);
        setSelectedBenchmark(null);
      });
    }
  }, [
    runId,
    shouldRunBenchmark,
    selectedBenchmark,
    runAll,
    runSingle,
    setBenchmarkComplete,
  ]);

  const renderBenchmark = ({ item }: { item: CryptoBenchmarkResult }) => {
    const { name, pure, rnqc } = item;
    const p = cleanResults(name, pure);
    const r = cleanResults(name, rnqc);
    if (!name) return null;
    const key = name.replace(/\//g, "-").toLowerCase();
    return (
      <View style={styles.sectionContainer} key={key}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>{name}</Text>
        </View>
        <View style={styles.headerRow}>
          <Text style={[styles.text, styles.label]}>Implementation</Text>
          <Text style={[styles.text, styles.headerValue]}>ms</Text>
          <Text style={[styles.text, styles.headerValue]}>ops/s</Text>
        </View>
        <View style={styles.resultsContainer}>
          <Text style={[styles.text, styles.label]}>PureJSCrypto</Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(p.latency?.mean || 0, 2, "")}
          </Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(p.throughput?.mean || 0, 2, "")}
          </Text>
        </View>
        <View style={styles.resultsContainer}>
          <Text style={[styles.text, styles.label]}>RNQuickCrypto</Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(r.latency?.mean || 0, 2, "")}
          </Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(r.throughput?.mean || 0, 2, "")}
          </Text>
        </View>
        <View style={styles.resultsContainer}>
          <Text style={[styles.text, styles.label]}>Improvement</Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(
              calculateTimes(r.latency?.mean || 0, p.latency?.mean || 0),
              2,
              "x"
            )}
          </Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(
              calculateTimes(r.throughput?.mean || 0, p.throughput?.mean || 0),
              2,
              "x"
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
        ListEmptyComponent={runId > 0 ? <ActivityIndicator /> : null}
      />
    </BenchmarkComponent>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  titleRow: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    paddingVertical: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#555",
    marginBottom: 4,
  },
  headerValue: {
    fontFamily: "Courier New",
    minWidth: 80,
    textAlign: "right",
    alignSelf: "flex-end",
    fontSize: 14,
    color: "#aaa",
  },
  resultsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flex: 3,
    paddingVertical: 4,
  },
  list: {},
  text: {
    color: "#fff",
  },
  label: {
    fontFamily: "Courier New",
    textAlign: "left",
    minWidth: 160,
  },
  value: {
    fontFamily: "Courier New",
    minWidth: 80,
    textAlign: "right",
    alignSelf: "flex-end",
  },
});
