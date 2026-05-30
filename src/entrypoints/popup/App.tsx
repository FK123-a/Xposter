import React, { useCallback, useEffect, useRef } from 'react';
import { MarkdownEditor } from '../../presentation/components/Editor/MarkdownEditor';
import { PlatformAdaptPreview } from '../../presentation/components/Platform/PlatformAdaptPreview';
import { useContentStore } from '../../presentation/stores/contentStore';
import { ChromeStorageRepository } from '../../infrastructure/storage/ChromeStorageRepository';
import { createMarkdownContent } from '../../domain/models/content';

const storage = new ChromeStorageRepository();

export const App: React.FC = () => {
  const markdown = useContentStore((s) => s.markdown);
  const title = useContentStore((s) => s.title);
  const setMarkdown = useContentStore((s) => s.setMarkdown);
  const markSaved = useContentStore((s) => s.markSaved);
  const loadDraft = useContentStore((s) => s.loadDraft);
  const isDirty = useContentStore((s) => s.isDirty);
  const lastSaved = useContentStore((s) => s.lastSaved);

  const initialLoadDone = useRef(false);

  // Load saved draft on mount
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    storage.loadDraft().then((content) => {
      if (content) {
        loadDraft(content);
      }
    });
  }, [loadDraft]);

  // Auto-save hook
  const handleAutoSave = useCallback(() => {
    const content = createMarkdownContent(markdown, { tags: [] });
    storage.saveDraft(content).then(() => {
      markSaved();
    });
  }, [markdown, markSaved]);

  return (
    <div className="xposter-app" style={{ padding: 16, minHeight: 360 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 22 }}>✉️</span>
          Xposter
        </h1>
        <div style={{ fontSize: 11, color: '#999' }}>
          {isDirty ? '● Unsaved' : lastSaved ? `Saved ${new Date(lastSaved).toLocaleTimeString()}` : ''}
        </div>
      </div>

      {/* Editor */}
      <div style={{ marginBottom: 12 }}>
        <MarkdownEditor
          value={markdown}
          onChange={setMarkdown}
          onAutoSave={handleAutoSave}
          autoSaveDelay={500}
        />
      </div>

      {/* Platform preview */}
      <div style={{ marginBottom: 12 }}>
        <PlatformAdaptPreview />
      </div>

      {/* Publish bar (placeholder for Phase 8) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 0',
          borderTop: '1px solid #eee',
        }}
      >
        <span style={{ fontSize: 12, color: '#aaa' }}>
          Publish dashboard — Phase 8
        </span>
      </div>
    </div>
  );
};
