import React, {useEffect} from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  runBenchmarks,
  cleanResults,
  formatNumber,
  calculateTimes,
} from './src/benchmarks';
import type {Results} from './src/benchmarks';

function App(): React.JSX.Element {
  const [results, setResults] = React.useState<Results[]>([]);
  useEffect(() => {
    // runBenchmarks().then(setResults);
  }, []);

  const renderBenchmark = ({item}: {item: Results}) => {
    const {name, pure, rnqc} = item;
    const p = cleanResults(name, pure);
    const r = cleanResults(name, rnqc);

    if (!name) {
      return null;
    }

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{name}</Text>
          <Text style={[styles.text, styles.value]}>latency</Text>
          <Text style={[styles.text, styles.value]}>throughput</Text>
        </View>
        <View style={styles.resultsContainer}>
          <Text style={[styles.text, styles.label]}>PureJSCrypto</Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(p.latency?.mean || 0, 2, 'ms')}
          </Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(p.throughput?.mean || 0, 2, 'ops/s')}
          </Text>
        </View>
        <View style={styles.resultsContainer}>
          <Text style={[styles.text, styles.label]}>RNQuickCrypto</Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(r.latency?.mean || 0, 2, 'ms')}
          </Text>
          <Text style={[styles.text, styles.value]}>
            {formatNumber(r.throughput?.mean || 0, 2, 'ops/s')}
          </Text>
        </View>
        <View style={styles.resultsContainer}>
          <Text style={[styles.text, styles.label]}>&nbsp;</Text>
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
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Jazz Stress Tests</Text>
      <View style={styles.sectionContainer}>
        <FlatList
          data={results}
          renderItem={renderBenchmark}
          style={styles.list}
        />
      </View>
      <TouchableOpacity
        onPress={() => runBenchmarks().then(setResults)}
        style={styles.runButton}>
        <Text style={styles.buttonText}>Run Benchmarks</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  list: {},
  sectionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
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
    borderRadius: 6,
    padding: 10,
    marginHorizontal: 10,
    width: '80%',
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default App;
