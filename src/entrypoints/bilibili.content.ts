/**
 * B站专栏编辑器 content script.
 *
 * B站专栏使用 TipTap/ProseMirror 富文本编辑器，整个编辑器在一个 iframe 内。
 * 无独立的 <input> 标签 — 标题和正文都在同一个 .ProseMirror 可编辑区域内。
 */
import { BasePlatformAdapter } from '../infrastructure/adapters/BasePlatformAdapter';

const LOG = '[Xposter Bilibili]';

class BilibiliContentScript extends BasePlatformAdapter {
  async handlePublish(adapted: { title: string; body: string; tags: string[] }): Promise<string> {
    console.log(`${LOG} handlePublish called`, {
      title: adapted.title?.substring(0, 40),
      bodyLength: adapted.body?.length,
    });

    // Find the editor — it's in an iframe
    const editorDoc = this.findEditorDocument();
    if (!editorDoc) {
      throw new Error('Bilibili editor iframe not found');
    }

    // Wait for TipTap/ProseMirror to mount
    const pm = await this.observeElementInDocument(editorDoc, '.ProseMirror', 15000);
    console.log(`${LOG} ProseMirror found`);

    // ── Fill content (title + body together, since B站 has no separate title input) ──
    // Build the full HTML with the title as the first heading
    const fullHtml = `<h1>${adapted.title}</h1>\n${adapted.body}`;
    this.pasteIntoProseMirror(pm as HTMLElement, fullHtml);
    console.log(`${LOG} Content pasted into ProseMirror`);

    // ── Tags ──
    for (const tag of adapted.tags) {
      try { await this.addTag(editorDoc, tag); } catch { /* skip */ }
    }

    console.log(`${LOG} Form filled — ready for manual review`);
    return window.location.href;
  }

  // -----------------------------------------------------------------------
  // Locate the editor document (inside iframe)
  // -----------------------------------------------------------------------
  private findEditorDocument(): Document | null {
    const iframes = document.querySelectorAll('iframe');
    console.log(`${LOG} Found ${iframes.length} iframes on page`);

    for (let i = 0; i < iframes.length; i++) {
      try {
        const doc = iframes[i]!.contentDocument;
        if (doc?.querySelector('.ProseMirror')) {
          console.log(`${LOG} Editor found in iframe#${i}`);
          return doc;
        }
      } catch { /* cross-origin, skip */ }
    }

    // Fallback: check main document
    if (document.querySelector('.ProseMirror')) {
      console.log(`${LOG} Editor found in main document`);
      return document;
    }

    return null;
  }

  // -----------------------------------------------------------------------
  // Paste HTML into ProseMirror (TipTap handles paste natively)
  // -----------------------------------------------------------------------
  private pasteIntoProseMirror(pm: HTMLElement, html: string): void {
    pm.focus();
    const dt = new DataTransfer();
    dt.setData('text/html', html);
    dt.setData('text/plain', html.replace(/<[^>]*>/g, ''));
    pm.dispatchEvent(new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: dt,
    }));
  }

  // -----------------------------------------------------------------------
  // Tags (inside iframe document)
  // -----------------------------------------------------------------------
  private async addTag(doc: Document, tag: string): Promise<void> {
    const addBtn =
      doc.querySelector('[class*="tag-add"], [class*="add-tag"]') as HTMLElement | null;

    if (addBtn) {
      addBtn.click();
      await new Promise((r) => setTimeout(r, 500));
    }

    const tagInput = doc.querySelector(
      'input[placeholder*="标签"], input[placeholder*="话题"]',
    ) as HTMLInputElement | null;

    if (tagInput) {
      const proto = HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(proto.prototype, 'value')?.set;
      if (setter) setter.call(tagInput, tag);
      else tagInput.value = tag;
      tagInput.dispatchEvent(new Event('input', { bubbles: true }));
      tagInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise((r) => setTimeout(r, 300));
      console.log(`${LOG} Tag added: ${tag}`);
    }
  }

  // -----------------------------------------------------------------------
  // observeElement with scoped document
  // -----------------------------------------------------------------------
  private observeElementInDocument(
    doc: Document,
    selector: string,
    timeoutMs = 30000,
  ): Promise<Element> {
    const existing = doc.querySelector(selector);
    if (existing) return Promise.resolve(existing);

    return new Promise((resolve, reject) => {
      const start = Date.now();
      const observer = new MutationObserver(() => {
        const el = doc.querySelector(selector);
        if (el) { observer.disconnect(); resolve(el); }
        if (Date.now() - start > timeoutMs) {
          observer.disconnect();
          reject(new Error(`Timeout waiting for ${selector}`));
        }
      });
      observer.observe(doc.body, { childList: true, subtree: true });
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout: ${selector}`));
      }, timeoutMs);
    });
  }
}

const script = new BilibiliContentScript();

export default defineContentScript({
  matches: ['*://member.bilibili.com/platform/upload/*', '*://member.bilibili.com/article-editor/*'],
  runAt: 'document_idle',
  main() {
    console.log(`${LOG} main() executing @ ${location.href}`);
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      console.log(`${LOG} Message received:`, msg.type);
      if (msg.type === 'PUBLISH_START') {
        script.handlePublish(msg.payload.adapted)
          .then((url) => {
            console.log(`${LOG} handlePublish succeeded`);
            sendResponse({ type: 'PUBLISH_COMPLETE', payload: { jobId: msg.payload.jobId, result: { url } } });
          })
          .catch((err) => {
            console.error(`${LOG} handlePublish failed:`, err);
            sendResponse({ type: 'PUBLISH_ERROR', payload: { jobId: msg.payload.jobId, error: { message: err instanceof Error ? err.message : String(err) } } });
          });
        return true;
      }
      return false;
    });
    console.log(`${LOG} Listener registered`);
  },
});
