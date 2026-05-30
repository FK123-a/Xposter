import React, { useMemo } from 'react';
import { MarkdownParser } from '../../../application/services/MarkdownParser';
import type { PlatformCode } from '../../../shared/constants';

interface PreviewPanelProps {
  markdown: string;
  platform: PlatformCode;
  platformLabel: string;
}

const parser = new MarkdownParser();

export const PreviewPanel: React.FC<PreviewPanelProps> = ({ markdown, platformLabel }) => {
  const html = useMemo(() => parser.renderHtml(markdown), [markdown]);

  return (
    <div className="xposter-preview" style={{ padding: 16 }}>
      <div
        className="xposter-preview-header"
        style={{
          marginBottom: 12,
          padding: '4px 8px',
          background: '#f5f5f5',
          borderRadius: 4,
          fontSize: 12,
          color: '#666',
        }}
      >
        Preview — {platformLabel}
      </div>
      <div
        className="xposter-preview-content markdown-body"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          padding: '12px 16px',
          border: '1px solid #eee',
          borderRadius: 6,
          background: '#fff',
          lineHeight: 1.8,
        }}
      />
    </div>
  );
};
