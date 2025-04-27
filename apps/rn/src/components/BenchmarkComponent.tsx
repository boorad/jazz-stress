import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BenchmarkComponentProps {
  name: string;
  children: ReactNode;
}

const BenchmarkComponent: React.FC<BenchmarkComponentProps> = ({ name, children }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{name}</Text>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#444',
    borderRadius: 8,
    padding: 16,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  content: {
    width: '100%',
  },
});

export default BenchmarkComponent;
