# Spec 001: Content Model

## Problem
Users author content in Markdown and expect it to be parsed once, then adapted to each platform's format. We need a universal content model that captures everything needed for cross-platform publishing.

## Domain Types

### MarkdownContent (Universal Input)
```typescript
interface MarkdownContent {
  raw: string;           // Original Markdown text
  title: string;          // Extracted from first H1
  images: ImageAsset[];   // Referenced images
  metadata: ContentMetadata; // tags, category, cover, source URL
}
```

### AdaptedContent (Platform-Specific Output)
```typescript
interface AdaptedContent {
  platformCode: PlatformCode;
  title: string;          // Trimmed per platform limits
  body: string;           // Platform-specific format (HTML, rich text, markdown)
  plainText: string;      // Fallback for search/indexing
  images: AdaptedImage[]; // Resized, format-converted
  tags: string[];
  category: string | null;
  metadata: Record<string, unknown>; // Platform-specific extras
}
```

## Acceptance Criteria

### AC-1: Title Extraction
GIVEN Markdown text with a `# Title` heading
WHEN `createMarkdownContent(raw)` is called
THEN `content.title` is "Title" (trimmed)

### AC-2: Tag Extraction
GIVEN Markdown body containing `#TypeScript` and `#React`
WHEN `createMarkdownContent(raw)` is called
THEN `content.metadata.tags` contains "TypeScript" and "React"

### AC-3: Image Reference Extraction
GIVEN Markdown containing `![alt](url)`
WHEN `createMarkdownContent(raw)` is called
THEN `content.images[]` contains an ImageAsset with `remoteUrl = url`

### AC-4: Empty Input
GIVEN Markdown text with no H1
WHEN `createMarkdownContent(raw)` is called
THEN `content.title` is "" (empty string)

### AC-5: Platform Limits
GIVEN a PlatformCode
WHEN querying `PLATFORM_LIMITS[code]`
THEN return maxTitleLength, maxContentLength, maxImageSizeMB, and other constraints

## Error Scenarios
| Scenario | Input | Expected Behavior |
|----------|-------|-------------------|
| No H1 heading | Plain text only | title = "" |
| No tags | Text without #word patterns | tags = [] |
| No images | Text without ![]() patterns | images = [] |
| CJK tags | Text with #中文标签 | Tag extracted correctly |

## References
- Plan: vivid-munching-sifakis.md (Phase 2)
- Related: specs/003-content-adaptation-pipeline.md
