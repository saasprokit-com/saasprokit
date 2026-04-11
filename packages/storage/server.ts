import "server-only";

import { getStorageProvider } from "./providers";
import type { UploadOptions, UploadResult } from "./types";

export async function uploadFile(
  options: UploadOptions
): Promise<UploadResult> {
  const provider = getStorageProvider();
  return await provider.upload(options);
}

export async function deleteFile(path: string, bucket?: string): Promise<void> {
  const provider = getStorageProvider();
  return await provider.delete({ path, bucket });
}
