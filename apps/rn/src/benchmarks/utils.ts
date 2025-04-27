import { TaskResult } from 'tinybench';

// Format a number with a suffix
export const formatNumber = (
  n: number,
  decimals: number,
  suffix: string,
): string => {
  if (isNaN(n)) {
    return '';
  }
  return n.toFixed(decimals) + suffix;
};

// Calculate the performance difference between two values
export const calculateTimes = (us: number, them: number): number => {
  return us < them ? 1 + (them - us) / us : 1 + (us - them) / them;
};

// Clean benchmark results by removing large sample arrays
export const cleanResults = (
  name: string | undefined,
  result: Readonly<TaskResult> | undefined
) => {
  if (result?.error) {
    console.log(`error: ${name} - ${result.error.message}`);
  }
  const copy = {...result};
  delete copy.samples;
  // @ts-expect-error - samples property is not in the type definition
  delete copy.latency?.samples;
  // @ts-expect-error - samples property is not in the type definition
  delete copy.throughput?.samples;
  return copy;
};
