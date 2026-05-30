import React from 'react';
import { useContentStore } from '../../stores/contentStore';
import { PLATFORM_DISPLAY_NAMES, PLATFORM_COLORS, type PlatformCode } from '../../../shared/constants';
import { PreviewPanel } from '../Editor/PreviewPanel';

export const PlatformAdaptPreview: React.FC = () => {
  const markdown = useContentStore((s) => s.markdown);
  const selectedPlatforms = useContentStore((s) => s.selectedPlatforms);
  const activePlatform = useContentStore((s) => s.activePreviewPlatform);
  const setActivePlatform = useContentStore((s) => s.setActivePreviewPlatform);

  if (selectedPlatforms.length === 0) {
    return (
      <div style={{ padding: 16, color: '#999', textAlign: 'center' }}>
        Select at least one platform to preview
      </div>
    );
  }

  return (
    <div className="xposter-platform-preview">
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '2px solid #eee', marginBottom: 0 }}>
        {selectedPlatforms.map((code) => (
          <button
            key={code}
            onClick={() => setActivePlatform(code)}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderBottom: activePlatform === code
                ? `2px solid ${PLATFORM_COLORS[code]}`
                : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: activePlatform === code ? 600 : 400,
              color: activePlatform === code ? PLATFORM_COLORS[code] : '#666',
              marginBottom: -2,
            }}
          >
            {PLATFORM_DISPLAY_NAMES[code]}
          </button>
        ))}
      </div>

      {/* Preview content */}
      <PreviewPanel
        markdown={markdown}
        platform={activePlatform}
        platformLabel={PLATFORM_DISPLAY_NAMES[activePlatform]}
      />
    </div>
  );
};
