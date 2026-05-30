import React, { useEffect, useRef } from 'react';
import { EditorView, keymap, placeholder, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { useContentStore } from '../../stores/contentStore';

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

  // Initialize editor
  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString();
        onChange(newValue);

        // Debounced auto-save
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
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Only mount once

  // Sync external value changes back to editor
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

  return (
    <div
      ref={containerRef}
      className="xposter-editor"
      style={{
        minHeight: '200px',
        maxHeight: '400px',
        overflow: 'auto',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        fontSize: '14px',
      }}
    />
  );
};
