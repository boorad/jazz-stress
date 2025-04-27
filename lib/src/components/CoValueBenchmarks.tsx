import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useBenchmark, BenchmarkComponent, formatNumber } from "../benchmarks";
import type { StorageBenchmarkResult } from "../benchmarks/types";

export type Mode = "async" | "sync";

interface CoValueBenchmarksProps {
  mode: Mode;
  runAll: (mode: Mode) => Promise<StorageBenchmarkResult[]>;
  runSingle: (key: string, mode: Mode) => Promise<StorageBenchmarkResult[]>;
}

export const CoValueBenchmarks: React.FC<CoValueBenchmarksProps> = ({
  mode,
  runAll,
  runSingle,
}) => {
  const [results, setResults] = useState<StorageBenchmarkResult[]>([]);
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
    const id = `covalue-${mode}`;
    registerBenchmark(id, `CoValue (op-sqlite, ${mode})`);
    return () => unregisterBenchmark(id);
  }, [mode, registerBenchmark, unregisterBenchmark]);

  useEffect(() => {
    if (runId > 0 && shouldRunBenchmark(`covalue-${mode}`)) {
      setResults([]);
      const promise = selectedBenchmark
        ? runSingle(selectedBenchmark, mode)
        : runAll(mode);
      promise.then((benchResults) => {
        setResults(benchResults);
        setBenchmarkComplete(`covalue-${mode}`, true);
        setSelectedBenchmark(null);
      });
    }
  }, [
    runId,
    shouldRunBenchmark,
    selectedBenchmark,
    runAll,
    runSingle,
    mode,
    setBenchmarkComplete,
  ]);

  const renderBenchmark = ({ item }: { item: StorageBenchmarkResult }) => {
    const { name, latency, throughput } = item;
    const cleanName = name
      ? name.replace("covalue-", "").replace(/-/g, " ")
      : "";
    return (
      <View style={styles.resultsContainer} key={name}>
        <Text style={[styles.text, styles.label]}>{cleanName}</Text>
        <Text style={[styles.text, styles.value]}>
          {formatNumber(latency.mean, 2, "")}
        </Text>
        <Text style={[styles.text, styles.value]}>
          {formatNumber(throughput.mean, 2, "")}
        </Text>
      </View>
    );
  };

  return (
    <BenchmarkComponent
      name={`CoValue (op-sqlite, ${mode})`}
      id={`covalue-${mode}`}
    >
      {results.length > 0 ? (
        <View style={styles.tableContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.text, styles.label]}>Benchmark</Text>
            <Text style={[styles.text, styles.headerValue]}>ms</Text>
            <Text style={[styles.text, styles.headerValue]}>ops/s</Text>
          </View>
          <FlatList
            data={results}
            renderItem={renderBenchmark}
            keyExtractor={(item) => item.name || ""}
            style={styles.list}
          />
        </View>
      ) : runId > 0 ? (
        <ActivityIndicator />
      ) : null}
    </BenchmarkComponent>
  );
};

const styles = StyleSheet.create({
  tableContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#555",
    marginBottom: 8,
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
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
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
