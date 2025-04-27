import React, { useEffect, useId } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useBenchmark } from './BenchmarkContext';

interface BenchmarkComponentProps {
  name: string;
  id?: string; // Optional ID, will use name if not provided
  children: React.ReactNode;
}

export const BenchmarkComponent: React.FC<BenchmarkComponentProps> = ({ 
  name, 
  id: providedId,
  children 
}) => {
  // Use provided ID or convert name to a valid ID (lowercase, no spaces)
  const id = providedId || name.toLowerCase().replace(/\s+/g, '-');
  const { registerBenchmark, unregisterBenchmark, runSingleBenchmark } = useBenchmark();

  // Register this benchmark when the component mounts
  useEffect(() => {
    registerBenchmark(id, name);
    
    // Unregister when the component unmounts
    return () => {
      unregisterBenchmark(id);
    };
  }, [id, name, registerBenchmark, unregisterBenchmark]);

  // Handler for the re-run button
  const handleReRun = () => {
    runSingleBenchmark(id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{name}</Text>
        <TouchableOpacity onPress={handleReRun} style={styles.rerunButton}>
          <Text style={styles.buttonText}>Re-run</Text>
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  rerunButton: {
    backgroundColor: '#007AFF',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
});
