import React, { useState } from 'react';
import { useContentStore } from '../../stores/contentStore';
import type { PlatformCode, PublishMode } from '../../../shared/constants';
import { PLATFORM_DISPLAY_NAMES, PLATFORM_COLORS } from '../../../shared/constants';
import { platformRegistry } from '../../../infrastructure/adapters/platforms';
import { createMarkdownContent } from '../../../domain/models/content';

interface PublishStatus {
  code: PlatformCode;
  status: 'idle' | 'adapting' | 'publishing' | 'done' | 'error';
  error?: string;
  url?: string;
}

export const PublishDashboard: React.FC = () => {
  const markdown = useContentStore((s) => s.markdown);
  const selectedPlatforms = useContentStore((s) => s.selectedPlatforms);
  const togglePlatform = useContentStore((s) => s.togglePlatform);

  const [mode, setMode] = useState<PublishMode>('simulated');
  const [isPublishing, setIsPublishing] = useState(false);
  const [results, setResults] = useState<PublishStatus[]>([]);

  const allCodes: PlatformCode[] = ['wechat-mp', 'zhihu', 'bilibili', 'xiaohongshu'];

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) return;

    setIsPublishing(true);
    const initialResults: PublishStatus[] = selectedPlatforms.map((code) => ({
      code,
      status: 'adapting',
    }));
    setResults(initialResults);

    if (mode === 'simulated') {
      // -------------------------------------------------------------------
      // Simulated mode: adapt + validate content through real adapters,
      // but do NOT open tabs or call APIs.
      // -------------------------------------------------------------------
      for (const platform of selectedPlatforms) {
        setResults((prev) =>
          prev.map((r) => (r.code === platform ? { ...r, status: 'publishing' as const } : r)),
        );

        // Small delay so the user can see each platform progress
        await new Promise((resolve) => setTimeout(resolve, 400));

        try {
          const publisher = platformRegistry.getPublisher(platform);
          const content = createMarkdownContent(markdown, { tags: [] });
          const adapted = await publisher.getContentAdapter().adapt(content);
          const validation = publisher.getContentAdapter().validate(adapted);

          setResults((prev) =>
            prev.map((r) =>
              r.code === platform
                ? {
                    ...r,
                    status: validation.valid ? ('done' as const) : ('error' as const),
                    error: validation.valid
                      ? undefined
                      : validation.issues.map((i) => i.message).join('; '),
                  }
                : r,
            ),
          );
        } catch (err) {
          setResults((prev) =>
            prev.map((r) =>
              r.code === platform
                ? {
                    ...r,
                    status: 'error' as const,
                    error: err instanceof Error ? err.message : 'Adapter error',
                  }
                : r,
            ),
          );
        }
      }
    } else {
      // -------------------------------------------------------------------
      // Real mode: send to background service worker for orchestration.
      // Background will ~> open editor tabs ~> inject content scripts ~> fill forms.
      // -------------------------------------------------------------------
      try {
        const jobId = `job-${Date.now()}`;

        // Update all to "publishing" — background will handle them one by one
        setResults((prev) =>
          prev.map((r) => ({ ...r, status: 'publishing' as const })),
        );

        const response = await chrome.runtime.sendMessage({
          type: 'PUBLISH_REQUEST',
          payload: {
            markdown,
            platforms: selectedPlatforms,
            jobId,
          },
        });

        if (response?.results) {
          setResults(
            response.results.map(
              (r: { platformCode: PlatformCode; status: string; error?: string }) => ({
                code: r.platformCode,
                status: r.status === 'published' ? ('done' as const) : ('error' as const),
                error: r.error,
              }),
            ),
          );
        } else if (response?.error) {
          // Background returned a top-level error
          setResults((prev) =>
            prev.map((r) => ({ ...r, status: 'error' as const, error: response.error })),
          );
        }
      } catch (err) {
        // Failed to reach background (service worker may be asleep)
        setResults((prev) =>
          prev.map((r) => ({
            ...r,
            status: 'error' as const,
            error: err instanceof Error ? err.message : 'Connection to background failed',
          })),
        );
      }
    }

    setIsPublishing(false);
  };

  const allDone =
    results.length > 0 && results.every((r) => r.status === 'done' || r.status === 'error');

  return (
    <div style={{ padding: 16 }}>
      {/* Mode selector */}
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}
        >
          <input
            type="radio"
            checked={mode === 'simulated'}
            onChange={() => setMode('simulated')}
            disabled={isPublishing}
          />
          Simulated
        </label>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}
        >
          <input
            type="radio"
            checked={mode === 'real'}
            onChange={() => setMode('real')}
            disabled={isPublishing}
          />
          Real
        </label>
      </div>

      {/* Platform selection */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Target platforms:</div>
        {allCodes.map((code) => (
          <label
            key={code}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 0',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={selectedPlatforms.includes(code)}
              onChange={() => togglePlatform(code)}
              disabled={isPublishing}
            />
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: PLATFORM_COLORS[code],
                display: 'inline-block',
              }}
            />
            {PLATFORM_DISPLAY_NAMES[code]}
          </label>
        ))}
      </div>

      {/* Publish button */}
      <button
        onClick={handlePublish}
        disabled={isPublishing || selectedPlatforms.length === 0}
        style={{
          width: '100%',
          padding: '10px',
          background: allDone ? '#4CAF50' : isPublishing ? '#ccc' : '#1a73e8',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          cursor: isPublishing ? 'not-allowed' : 'pointer',
          marginBottom: 12,
        }}
      >
        {isPublishing
          ? 'Publishing...'
          : allDone
            ? 'Done!'
            : `Publish to ${selectedPlatforms.length} platform(s)`}
      </button>

      {/* Progress list */}
      {results.map((r) => (
        <div
          key={r.code}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 0',
            borderTop: '1px solid #f0f0f0',
            fontSize: 13,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background:
                r.status === 'done'
                  ? '#4CAF50'
                  : r.status === 'error'
                    ? '#f44336'
                    : r.status === 'publishing'
                      ? '#FFC107'
                      : '#ccc',
            }}
          />
          <span style={{ flex: 1 }}>{PLATFORM_DISPLAY_NAMES[r.code]}</span>
          <span style={{ fontSize: 11, color: '#999' }}>
            {r.status === 'idle'
              ? 'Waiting'
              : r.status === 'adapting'
                ? 'Adapting...'
                : r.status === 'publishing'
                  ? 'Publishing...'
                  : r.status === 'done'
                    ? 'OK'
                    : r.error || 'Error'}
          </span>
        </div>
      ))}

      {/* Tips for real mode */}
      {mode === 'real' && (
        <div
          style={{
            marginTop: 12,
            padding: 8,
            background: '#FFF9C4',
            borderRadius: 4,
            fontSize: 11,
            color: '#666',
            lineHeight: 1.5,
          }}
        >
          真实模式将打开编辑器页面并自动填充内容。
          发布前请确保已在目标平台登录。
        </div>
      )}
    </div>
  );
};
