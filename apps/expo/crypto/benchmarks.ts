import { Bench } from "tinybench";
import { PureJSCrypto } from "cojson/crypto/PureJSCrypto";
import { RNQuickCrypto } from "jazz-react-native-core/crypto";
import type { CryptoBenchmarkResult } from "lib/benchmarks";
import { cojsonInternals } from "cojson";
import { base58 } from "@scure/base";
import { randomBytes } from "react-native-quick-crypto";

export type Results = CryptoBenchmarkResult;

const { stableStringify } = cojsonInternals;
const TIME_MS = 1000;
const WARMUP_MS = 100;

const rnqc = new RNQuickCrypto();
const pjc = new PureJSCrypto();
const data = new TextEncoder().encode("Jazz crypto benchmark data for testing!");
const dataString = new TextDecoder().decode(data);
const dataJsonValue = { data: dataString }; // Use a JSON value for consistency with crypto methods
const dataStringified = stableStringify(dataJsonValue);

async function sign_verify(): Promise<Bench> {
  const pjcSigner = pjc.newRandomSigner();
  const rnqcSigner = rnqc.newRandomSigner();

  const bench = new Bench({
    name: "sign/verify",
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });

  bench.add("pjc", () => {
    const signature = pjc.sign(pjcSigner, dataJsonValue);
    if (!pjc.verify(signature, dataJsonValue, pjc.getSignerID(pjcSigner))) {
      throw new Error("signature did not verify");
    }
  });

  bench.add("rnqc", () => {
    const signature = rnqc.sign(rnqcSigner, dataJsonValue);
    if (!rnqc.verify(signature, dataJsonValue, rnqc.getSignerID(rnqcSigner))) {
      throw new Error("signature did not verify");
    }
  });

  return bench;
}

async function encrypt_decrypt(): Promise<Bench> {
  const bench = new Bench({
    name: "encrypt/decrypt",
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });

  // Generate a symmetric key (both instances use PureJSCrypto's encrypt/decrypt)
  const keyBytes = randomBytes(32);
  const keySecret = `keySecret_z${base58.encode(keyBytes)}` as `keySecret_z${string}`; // Assert specific template literal type
  const nOnceMaterial = { benchmark: "encrypt-decrypt", unique: Date.now() };

  // Ensure keys are generated correctly (simple check)
  if (!keySecret) {
    throw new Error("Failed to generate symmetric keys");
  }

  bench.add("pjc", async () => {
    const encrypted = pjc.encrypt(dataJsonValue, keySecret, nOnceMaterial);
    const decryptedString = pjc.decryptRaw(encrypted, keySecret, nOnceMaterial);
    // Simple verification - could compare ArrayBuffers byte-by-byte if needed
    if (decryptedString !== dataStringified) {
      throw new Error("PJC decryption failed");
    }
  });

  bench.add("rnqc", async () => {
    // RNQuickCrypto inherits encrypt/decryptRaw from PureJSCrypto
    const encrypted = rnqc.encrypt(dataJsonValue, keySecret, nOnceMaterial);
    const decryptedString = rnqc.decryptRaw(encrypted, keySecret, nOnceMaterial);
    // Simple verification
    if (decryptedString !== dataStringified) {
      throw new Error("RNQC decryption failed");
    }
  });

  return bench;
}

// Benchmark for seal/unseal (asymmetric encryption)
async function seal_unseal(): Promise<Bench> {
  const bench = new Bench({
    name: "seal/unseal",
    time: TIME_MS,
    warmupTime: WARMUP_MS,
  });

  // Generate sealer key pairs (secret + ID) for sender and receiver
  const pjcFromSecret = pjc.newRandomSealer();
  const pjcFromId = pjc.getSealerID(pjcFromSecret);
  const pjcToSecret = pjc.newRandomSealer();
  const pjcToId = pjc.getSealerID(pjcToSecret);

  const rnqcFromSecret = rnqc.newRandomSealer(); // RNQuickCrypto inherits this
  const rnqcFromId = rnqc.getSealerID(rnqcFromSecret);
  const rnqcToSecret = rnqc.newRandomSealer();
  const rnqcToId = rnqc.getSealerID(rnqcToSecret);

  // Dummy nonce material required by seal/unseal API
  const nOnceMaterial = {
    in: "co_zDummyCoID" as `co_z${string}`,
    tx: "tx_zDummyTxID" as any, // Use 'any' as TransactionID import is problematic
  };

  bench.add("pjc", () => {
    const sealed = pjc.seal({
      message: dataJsonValue,
      from: pjcFromSecret,
      to: pjcToId,
      nOnceMaterial,
    });
    const unsealed = pjc.unseal(
        sealed,
        pjcToSecret, // Receiver uses their secret
        pjcFromId,   // Needs sender's ID
        nOnceMaterial
    );
    // unseal returns the parsed JSON or undefined
    if (stableStringify(unsealed) !== dataStringified) {
        throw new Error("PJC unseal failed or data mismatch");
    }
  });

  bench.add("rnqc", () => {
    // RNQuickCrypto inherits seal/unseal from PureJSCrypto
    const sealed = rnqc.seal({
        message: dataJsonValue,
        from: rnqcFromSecret,
        to: rnqcToId,
        nOnceMaterial,
    });
    const unsealed = rnqc.unseal(
        sealed,
        rnqcToSecret,
        rnqcFromId,
        nOnceMaterial
    );
     if (stableStringify(unsealed) !== dataStringified) {
       throw new Error("RNQC unseal failed or data mismatch");
    }
  });

  return bench;
}

const benches: Array<() => Promise<Bench>> = [
  sign_verify,
  encrypt_decrypt,
  seal_unseal,
];

type BenchmarkFunction = () => Promise<Bench>;
export const benchmarkMap: Record<string, BenchmarkFunction> = {
  "sign-verify": sign_verify,
  "encrypt-decrypt": encrypt_decrypt,
  "seal-unseal": seal_unseal,
};

export const runCryptoBenchmarks = async (): Promise<CryptoBenchmarkResult[]> => {
  const results: CryptoBenchmarkResult[] = [];
  for (const benchFn of benches) {
    const bench = await benchFn();
    await bench.run();
    // Use 'pjc' and 'rnqc' as task names based on the benchmark add calls
    const pjcTask = bench.tasks.find((t) => t.name === "pjc");
    const rnqcTask = bench.tasks.find((t) => t.name === "rnqc");
    results.push({
      name: bench.name || 'unknown', // Use bench.name if available
      pure: pjcTask?.result,
      rnqc: rnqcTask?.result,
    });
  }
  return results;
};

export const runSingleCryptoBenchmark = async (
  benchmarkName: string,
): Promise<CryptoBenchmarkResult[]> => {
  const benchFn = benchmarkMap[benchmarkName];
  if (!benchFn) {
    console.warn(`Benchmark '${benchmarkName}' not found`);
    return [];
  }
  const bench = await benchFn();
  await bench.run();
  // Use 'pjc' and 'rnqc' as task names
  const pjcTask = bench.tasks.find((t) => t.name === "pjc");
  const rnqcTask = bench.tasks.find((t) => t.name === "rnqc");
  return [{ name: bench.name || benchmarkName, pure: pjcTask?.result, rnqc: rnqcTask?.result }];
};
