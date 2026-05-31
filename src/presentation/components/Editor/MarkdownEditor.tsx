import React, { useEffect, useRef, useCallback } from 'react';
import { EditorView, keymap, placeholder, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';

interface MarkdownEditorProps {
  /** External value (controlled mode) */
  value: string;
  /** Called on every change */
  onChange: (value: string) => void;
  /** Auto-save debounce callback */
  onAutoSave?: () => void;
  /** Debounce delay in ms */
  autoSaveDelay?: number;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onAutoSave,
  autoSaveDelay = 300,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------
  // Image handling: read a File → base64 data URL → insert at cursor
  // -------------------------------------------------------------------
  const insertImageAtCursor = useCallback(
    (dataUrl: string, fileName: string) => {
      const view = viewRef.current;
      if (!view) return;

      const imageMd = `![${fileName}](${dataUrl})`;
      view.dispatch({
        changes: {
          from: view.state.selection.main.from,
          to: view.state.selection.main.to,
          insert: imageMd,
        },
        selection: {
          anchor: view.state.selection.main.from + imageMd.length,
        },
      });
    },
    [],
  );

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          insertImageAtCursor(reader.result, file.name);
        }
      };
      reader.onerror = () => {
        console.error('[Xposter] Failed to read image:', file.name);
      };
      reader.readAsDataURL(file);
    },
    [insertImageAtCursor],
  );

  // Handle file input button
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        for (const file of files) processFile(file);
        // Reset so the same file can be selected again
        e.target.value = '';
      }
    },
    [processFile],
  );

  // -------------------------------------------------------------------
  // Initialize CodeMirror editor
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString();
        onChange(newValue);

        if (onAutoSave) {
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          saveTimerRef.current = setTimeout(() => {
            onAutoSave();
          }, autoSaveDelay);
        }
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        markdown(),
        lineNumbers(),
        highlightActiveLine(),
        history(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        placeholder('Start writing in Markdown...'),
        EditorView.lineWrapping,
        // Drag-and-drop handler
        EditorView.domEventHandlers({
          drop(event, view) {
            const files = event.dataTransfer?.files;
            if (files && files.length > 0) {
              event.preventDefault();
              // Position cursor at drop point
              const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
              if (pos) {
                view.dispatch({ selection: { anchor: pos, head: pos } });
              }
              // Process each file
              for (const file of files) {
                if (file.type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      const md = `![${file.name}](${reader.result})`;
                      view.dispatch({
                        changes: {
                          from: view.state.selection.main.from,
                          insert: md,
                        },
                      });
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }
            }
          },
          dragover(event) {
            if (event.dataTransfer?.types.includes('Files')) {
              event.preventDefault();
            }
          },
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Only mount once

  // -------------------------------------------------------------------
  // Sync external value changes back to editor
  // -------------------------------------------------------------------
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentValue = view.state.doc.toString();
    if (value !== currentValue) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value,
        },
      });
    }
  }, [value]);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  return (
    <div style={{ position: 'relative' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          border: '1px solid #e0e0e0',
          borderBottom: 'none',
          borderRadius: '6px 6px 0 0',
          background: '#fafafa',
          fontSize: 12,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Insert image"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            border: '1px solid #ddd',
            borderRadius: 4,
            background: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            color: '#555',
          }}
        >
          <span>🖼</span> Insert Image
        </button>
        <span style={{ color: '#bbb' }}>or drag &amp; drop images here</span>
      </div>

      {/* Editor */}
      <div
        ref={containerRef}
        className="xposter-editor"
        style={{
          minHeight: '200px',
          maxHeight: '400px',
          overflow: 'auto',
          border: '1px solid #e0e0e0',
          borderRadius: '0 0 6px 6px',
          fontSize: '14px',
        }}
      />
    </div>
  );
};
