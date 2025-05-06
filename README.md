# Jazz React Native Stress Tests

This repo contains a collection of stress tests for the Jazz React Native stack.  It includes two apps:
* rn: A React Native app
* expo: An Expo app

The stress tests are benchmarks using the [tinybench](https://github.com/tinylibs/tinybench) library.  They measure latency (ms or µs) and throughput (ops/s).

## `rn`

To run the tests, you can use the following commands:

```bash
bun i
bun pods
bun start # then choose ios or android
```

## `expo`

To run the tests, you can use the following commands:

```bash
bun i
bun expo prebuild --clean --platform ios
cd ios
pod install --repo-update
cd ..
bun ios
```
