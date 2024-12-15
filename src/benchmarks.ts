import { Bench, TaskResult } from 'tinybench';
import benches from './benches';

export type Results = {
  name: string | undefined;
  pure: Readonly<TaskResult> | undefined;
  rnqc: Readonly<TaskResult> | undefined;
};

export const runBenchmarks = async (): Promise<Results[]> => {
  const results = await Promise.all(benches.map(async (benchFn) => {
    const b = await benchFn();
    await b.run();
    return processResults(b);
  }));

  return results;
};

const processResults = (b: Bench): Results => {
  const tasks = b.tasks;
  const pure = tasks.find((t) => t.name === 'pure');
  const rnqc = tasks.find((t) => t.name === 'rnqc');
  return {
    name: b.name,
    pure: pure?.result,
    rnqc: rnqc?.result,
  };
};

export const cleanResults = (
  name: string | undefined,
  result: Readonly<TaskResult> | undefined
) => {
  if (result?.error) {
    console.log(`error: ${name} - ${result.error.message}`);
  }
  const copy = {...result};
  delete copy.samples;
  // @ts-expect-error - wtf?
  delete copy.latency?.samples;
  // @ts-expect-error - wtf?
  delete copy.throughput?.samples;
  return copy;
};

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

export const calculateTimes = (us: number, them: number): number => {
  return us < them ? 1 + (them - us) / us : 1 + (us - them) / them;
};

