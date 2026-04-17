import "react-native-get-random-values";

import * as ExpoCrypto from "expo-crypto";

type CryptoLike = {
  getRandomValues: typeof ExpoCrypto.getRandomValues;
  randomUUID: typeof ExpoCrypto.randomUUID;
};

const globalScope = globalThis as typeof globalThis & {
  crypto?: Partial<CryptoLike>;
};

globalScope.crypto = {
  ...(globalScope.crypto ?? {}),
  getRandomValues:
    globalScope.crypto?.getRandomValues ?? ExpoCrypto.getRandomValues,
  randomUUID: globalScope.crypto?.randomUUID ?? ExpoCrypto.randomUUID,
};
