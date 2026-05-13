export type StorageProviderType = "local" | "s3";

export type FileVisibility = "public" | "private";

export interface UploadOptions {
  filename: string;
  buffer: Buffer;
  mimeType: string;
  folder?: string;
  visibility?: FileVisibility;
  attachableType?: string;
  attachableId?: string;
  uploadedById?: string;
  metadata?: Record<string, unknown>;
}

export interface UploadResult {
  storagePath: string;
  publicUrl: string | null;
  filename: string;
  mimeType: string;
  size: number;
  provider: StorageProviderType;
  bucket: string | null;
  visibility: FileVisibility;
}

export interface DeleteOptions {
  path: string;
  bucket?: string;
}

export interface GetUrlOptions {
  path: string;
  bucket?: string;
  expiresIn?: number;
}

export interface StorageProvider {
  readonly type: StorageProviderType;
  upload(options: UploadOptions): Promise<UploadResult>;
  delete(options: DeleteOptions): Promise<void>;
  getUrl(options: GetUrlOptions): Promise<string>;
  exists(path: string): Promise<boolean>;
}
