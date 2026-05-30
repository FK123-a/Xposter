/**
 * Domain model: Content
 *
 * Represents the universal content format that users author in Markdown.
 * This is the single source of truth before platform-specific adaptation.
 */

// ---------------------------------------------------------------------------
// Value objects
// ---------------------------------------------------------------------------

export interface ImageAsset {
  readonly id: string;
  readonly localPath?: string;
  readonly remoteUrl?: string;
  readonly width: number;
  readonly height: number;
  readonly sizeBytes: number;
  readonly format: 'jpg' | 'jpeg' | 'png' | 'gif' | 'webp';
  readonly alt: string;
}

export interface ContentMetadata {
  readonly tags: string[];
  readonly category: string;
  readonly coverImageUrl?: string;
  readonly sourceUrl?: string;
}

export interface MarkdownContent {
  readonly raw: string;
  readonly title: string;
  readonly images: ImageAsset[];
  readonly metadata: ContentMetadata;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createMarkdownContent(
  raw: string,
  metadata?: Partial<ContentMetadata>,
  existingImages?: ImageAsset[],
): MarkdownContent {
  const title = extractTitle(raw);
  const images = existingImages ?? extractImageRefs(raw);
  const tags = metadata?.tags ?? extractTags(raw);

  return {
    raw,
    title,
    images,
    metadata: {
      tags,
      category: metadata?.category ?? '',
      coverImageUrl: metadata?.coverImageUrl,
      sourceUrl: metadata?.sourceUrl,
    },
  };
}

// ---------------------------------------------------------------------------
// Pure helpers (exported for testing)
// ---------------------------------------------------------------------------

export function extractTitle(raw: string): string {
  const match = raw.match(/^#\s+(.+)$/m);
  return match ? match[1]!.trim() : '';
}

export function extractTags(raw: string): string[] {
  const body = stripHeadingsAndCode(raw);
  const matches = body.match(/(?:^|\s)#([\w一-鿿-]+)/g);
  if (!matches) return [];

  return [
    ...new Set(
      matches
        .map((m) => m.trim().replace(/^#/, ''))
        .filter((t) => t.length > 1 && t.length <= 30),
    ),
  ];
}

export function extractImageRefs(raw: string): ImageAsset[] {
  const regex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
  const assets: ImageAsset[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    const alt = match[1] ?? '';
    const url = match[2] ?? '';
    assets.push({
      id: `img-${assets.length}-${Date.now()}`,
      remoteUrl: url,
      width: 0,
      height: 0,
      sizeBytes: 0,
      format: guessFormat(url),
      alt: alt || '',
    });
  }

  return assets;
}

// ---------------------------------------------------------------------------
// Platform-adapted content
// ---------------------------------------------------------------------------

export interface AdaptedImage {
  readonly originalId: string;
  readonly blob: Blob;
  readonly width: number;
  readonly height: number;
  readonly format: string;
}

import type { PlatformCode } from '../../shared/constants';

export interface AdaptedContent {
  readonly platformCode: PlatformCode;
  readonly title: string;
  readonly body: string;
  readonly plainText: string;
  readonly images: AdaptedImage[];
  readonly tags: string[];
  readonly category: string | null;
  readonly metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function stripHeadingsAndCode(raw: string): string {
  return raw
    .replace(/^#{1,6}\s+.+$/gm, '')
    .replace(/```[\s\S]*?```/g, '');
}

function guessFormat(url: string): ImageAsset['format'] {
  const ext = url.split('.').pop()?.toLowerCase().split('?')[0];
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'jpeg';
    case 'png':
      return 'png';
    case 'gif':
      return 'gif';
    case 'webp':
      return 'webp';
    default:
      return 'png';
  }
}
