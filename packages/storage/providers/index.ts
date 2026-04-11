import { keys } from "../keys";
import type { StorageProvider, StorageProviderType } from "../types";
import { LocalStorageProvider } from "./local";
import { S3StorageProvider } from "./s3";

const env = keys();

let localProvider: LocalStorageProvider | null = null;
let s3Provider: S3StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  const providerType = env.STORAGE_PROVIDER as StorageProviderType;

  switch (providerType) {
    case "s3": {
      if (!s3Provider) {
        s3Provider = new S3StorageProvider();
      }
      return s3Provider;
    }
    default: {
      if (!localProvider) {
        localProvider = new LocalStorageProvider();
      }
      return localProvider;
    }
  }
}

export { LocalStorageProvider } from "./local";
export { S3StorageProvider } from "./s3";
