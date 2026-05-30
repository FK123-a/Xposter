import React, { useState } from 'react';
import { useContentStore } from '../../stores/contentStore';
import type { PlatformCode, PublishMode } from '../../../shared/constants';
import { PLATFORM_DISPLAY_NAMES, PLATFORM_COLORS } from '../../../shared/constants';
import { platformRegistry } from '../../../infrastructure/adapters/platforms';

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

    // Simulate per-platform progress
    for (const platform of selectedPlatforms) {
      setResults((prev) =>
        prev.map((r) => (r.code === platform ? { ...r, status: 'publishing' as const } : r)),
      );

      // Simulate work
      await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));

      const publisher = platformRegistry.isRegistered(platform)
        ? platformRegistry.getPublisher(platform)
        : null;

      if (publisher && mode === 'simulated') {
        setResults((prev) =>
          prev.map((r) => (r.code === platform ? { ...r, status: 'done' as const } : r)),
        );
      } else if (!publisher) {
        setResults((prev) =>
          prev.map((r) =>
            r.code === platform
              ? { ...r, status: 'error' as const, error: 'Platform not registered' }
              : r,
          ),
        );
      } else {
        setResults((prev) =>
          prev.map((r) =>
            r.code === platform
              ? { ...r, status: 'done' as const }
              : r,
          ),
        );
      }
    }

    setIsPublishing(false);
  };

  const allDone = results.length > 0 && results.every((r) => r.status === 'done' || r.status === 'error');

  return (
    <div style={{ padding: 16 }}>
      {/* Mode selector */}
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <input type="radio" checked={mode === 'simulated'} onChange={() => setMode('simulated')} />
          Simulated
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
          <input type="radio" checked={mode === 'real'} onChange={() => setMode('real')} />
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
                r.status === 'done' ? '#4CAF50' : r.status === 'error' ? '#f44336' : r.status === 'publishing' ? '#FFC107' : '#ccc',
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
    </div>
  );
};
