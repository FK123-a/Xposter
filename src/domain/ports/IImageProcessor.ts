import type { ImageAsset, AdaptedImage } from '../models/content';

export interface IImageProcessor {
  /** Resize and reformat an image for a given platform's constraints */
  processImage(
    asset: ImageAsset,
    maxSizeMB: number,
    allowedFormats: string[],
  ): Promise<AdaptedImage>;

  /** Fetch an image from a remote URL via background worker (CORS bypass) */
  fetchRemoteImage(url: string): Promise<Blob>;

  /** Convert a Blob to a base64 data URI */
  blobToBase64(blob: Blob): Promise<string>;
}
