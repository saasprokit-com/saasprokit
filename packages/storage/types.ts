export type StorageProviderType = "local" | "s3";

export type FileVisibility = "public" | "private";

export interface UploadOptions {
  attachableId?: string;
  attachableType?: string;
  buffer: Buffer;
  filename: string;
  folder?: string;
  metadata?: Record<string, unknown>;
  mimeType: string;
  uploadedById?: string;
  visibility?: FileVisibility;
}

export interface UploadResult {
  bucket: string | null;
  filename: string;
  mimeType: string;
  provider: StorageProviderType;
  publicUrl: string | null;
  size: number;
  storagePath: string;
  visibility: FileVisibility;
}

export interface DeleteOptions {
  bucket?: string;
  path: string;
}

export interface GetUrlOptions {
  bucket?: string;
  expiresIn?: number;
  path: string;
}

export interface StorageProvider {
  delete(options: DeleteOptions): Promise<void>;
  exists(path: string): Promise<boolean>;
  getUrl(options: GetUrlOptions): Promise<string>;
  readonly type: StorageProviderType;
  upload(options: UploadOptions): Promise<UploadResult>;
}
