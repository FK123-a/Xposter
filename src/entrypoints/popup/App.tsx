import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MarkdownEditor } from '../../presentation/components/Editor/MarkdownEditor';
import { PlatformAdaptPreview } from '../../presentation/components/Platform/PlatformAdaptPreview';
import { PublishDashboard } from '../../presentation/components/Publish/PublishDashboard';
import { useContentStore } from '../../presentation/stores/contentStore';
import { ChromeStorageRepository } from '../../infrastructure/storage/ChromeStorageRepository';
import { createMarkdownContent } from '../../domain/models/content';
import { registerAllPlatforms } from '../../infrastructure/adapters/platforms';

const storage = new ChromeStorageRepository();
registerAllPlatforms();

type Tab = 'editor' | 'publish';

export const App: React.FC = () => {
  const [tab, setTab] = useState<Tab>('editor');
  const markdown = useContentStore((s) => s.markdown);
  const setMarkdown = useContentStore((s) => s.setMarkdown);
  const markSaved = useContentStore((s) => s.markSaved);
  const loadDraft = useContentStore((s) => s.loadDraft);
  const isDirty = useContentStore((s) => s.isDirty);
  const lastSaved = useContentStore((s) => s.lastSaved);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    storage.loadDraft().then((content) => { if (content) loadDraft(content); });
  }, [loadDraft]);

  const handleAutoSave = useCallback(() => {
    storage.saveDraft(createMarkdownContent(markdown, { tags: [] })).then(() => markSaved());
  }, [markdown, markSaved]);

  return (
    <div style={{ padding: 16, minHeight: 380, minWidth: 480 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
          Xposter
        </h1>
        <div style={{ display: 'flex', gap: 0 }}>
          <button onClick={() => setTab('editor')} style={{
            padding: '4px 12px', fontSize: 12, border: '1px solid #ddd', borderRadius: '4px 0 0 4px',
            background: tab === 'editor' ? '#1a73e8' : '#fff', color: tab === 'editor' ? '#fff' : '#333',
          }}>Editor</button>
          <button onClick={() => setTab('publish')} style={{
            padding: '4px 12px', fontSize: 12, border: '1px solid #ddd', borderRadius: '0 4px 4px 0',
            background: tab === 'publish' ? '#1a73e8' : '#fff', color: tab === 'publish' ? '#fff' : '#333',
          }}>Publish</button>
        </div>
      </div>
      {tab === 'editor' ? (
        <>
          <div style={{ marginBottom: 10 }}>
            <MarkdownEditor value={markdown} onChange={setMarkdown} onAutoSave={handleAutoSave} autoSaveDelay={500} />
          </div>
          <PlatformAdaptPreview />
        </>
      ) : (
        <PublishDashboard />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid #eee', fontSize: 11, color: '#999' }}>
        <span>{isDirty ? 'Unsaved' : lastSaved ? 'Saved ' + new Date(lastSaved).toLocaleTimeString() : ''}</span>
        <span>{tab === 'editor' ? 'Editor' : 'Publish'} tab</span>
      </div>
    </div>
  );
};
