/**
 * 小红书「写长文」编辑器 content script.
 *
 * 编辑器结构（主页面，非 iframe）：
 *   - 标题: TEXTAREA.d-text[placeholder="输入标题"]
 *   - 正文: .tiptap.ProseMirror (TipTap 富文本编辑器)
 */
import { BasePlatformAdapter } from '../infrastructure/adapters/BasePlatformAdapter';

const LOG = '[Xposter RED]';

class REDContentScript extends BasePlatformAdapter {
  async handlePublish(adapted: { title: string; body: string }): Promise<string> {
    console.log(`${LOG} handlePublish called`, {
      title: adapted.title?.substring(0, 30),
      bodyLength: adapted.body?.length,
    });

    // ── Step 0: Ensure "写长文" tab is active (editor lazy-loads on click) ──
    await this.ensureEditorLoaded();

    // ── Step 1: Fill title (textarea with placeholder="输入标题") ──
    await this.fillTitleField(adapted.title);

    // ── Step 2: Fill body (TipTap/ProseMirror) ──
    await this.fillBodyField(adapted.body);

    console.log(`${LOG} Form filled — ready for manual review`);
    return window.location.href;
  }

  // -----------------------------------------------------------------------
  // Ensure editor is visible by clicking "写长文" if needed
  // -----------------------------------------------------------------------
  private async ensureEditorLoaded(): Promise<void> {
    // Already loaded?
    const hasEditor = document.querySelector('.ProseMirror') ||
      document.querySelector('textarea[placeholder*="输入标题"]');
    if (hasEditor) {
      console.log(`${LOG} Editor already loaded`);
      return;
    }

    // Find and click "写长文" tab
    console.log(`${LOG} Editor not loaded, looking for "写长文" button...`);
    const tabs = [...document.querySelectorAll('[class*="creator-tab"], button, span, div')]
      .filter(el => el.textContent?.trim() === '写长文');
    console.log(`${LOG} Found ${tabs.length} "写长文" elements`);

    if (tabs.length > 0) {
      const tab = tabs[0] as HTMLElement;
      console.log(`${LOG} Clicking "写长文":`, tab.tagName, tab.className?.substring(0, 50));
      tab.click();

      // Wait for editor to appear
      await new Promise((resolve) => {
        const check = () => {
          const ed = document.querySelector('.ProseMirror') ||
            document.querySelector('textarea[placeholder*="输入标题"]');
          if (ed) {
            console.log(`${LOG} Editor appeared after click`);
            resolve(undefined);
            return;
          }
          setTimeout(check, 300);
        };
        check();
        // Timeout after 10s
        setTimeout(() => {
          console.warn(`${LOG} Editor did not appear after 10s`);
          resolve(undefined);
        }, 10000);
      });
    } else {
      console.warn(`${LOG} "写长文" button not found`);
    }
  }

  // -----------------------------------------------------------------------
  // Title: TEXTAREA.d-text[placeholder="输入标题"]
  // -----------------------------------------------------------------------
  private async fillTitleField(title: string): Promise<void> {
    const truncated = title.substring(0, 20); // RED 标题最长 20 字

    // Primary selectors
    const selectors = [
      'textarea[placeholder*="输入标题"]',
      'textarea[placeholder*="标题"]',
      '.d-text[placeholder*="标题"]',
      'textarea.d-text',
    ];

    for (const sel of selectors) {
      console.log(`${LOG} Trying title selector: "${sel}"`);
      const el = await this.observeElement(sel, 5000).catch(() => null) as HTMLTextAreaElement | null;
      if (el) {
        this.setNativeValue(el, truncated);
        console.log(`${LOG} Title filled via "${sel}"`);
        return;
      }
    }

    // Fallback: any visible textarea in the upper portion of the page
    const textareas = document.querySelectorAll('textarea');
    console.log(`${LOG} Found ${textareas.length} textarea elements`);
    for (const ta of textareas) {
      const rect = ta.getBoundingClientRect();
      if (rect.top < 400 && rect.width > 100 && ta.checkVisibility?.() !== false) {
        this.setNativeValue(ta, truncated);
        console.log(`${LOG} Title filled via fallback textarea at y=${rect.top}`);
        return;
      }
    }

    console.warn(`${LOG} Could not find title textarea`);
  }

  // -----------------------------------------------------------------------
  // Body: .tiptap.ProseMirror (paste HTML)
  // -----------------------------------------------------------------------
  private async fillBodyField(body: string): Promise<void> {
    const truncated = this.truncateBody(body);

    // Try ProseMirror paste first (works with B站)
    try {
      console.log(`${LOG} Trying .ProseMirror paste`);
      const pm = await this.observeElement('.ProseMirror', 8000) as HTMLElement | null;
      if (pm) {
        pm.focus();
        const dt = new DataTransfer();
        dt.setData('text/html', truncated);
        dt.setData('text/plain', truncated.replace(/<[^>]*>/g, ''));
        pm.dispatchEvent(new ClipboardEvent('paste', {
          bubbles: true, cancelable: true, clipboardData: dt,
        }));
        console.log(`${LOG} Body filled via ProseMirror paste`);
        return;
      }
    } catch { /* continue */ }

    // Fallback 1: any contentEditable
    const editable = document.querySelector('[contenteditable="true"]');
    if (editable) {
      (editable as HTMLElement).focus();
      const dt = new DataTransfer();
      dt.setData('text/html', truncated);
      dt.setData('text/plain', truncated.replace(/<[^>]*>/g, ''));
      editable.dispatchEvent(new ClipboardEvent('paste', {
        bubbles: true, cancelable: true, clipboardData: dt,
      }));
      console.log(`${LOG} Body filled via contentEditable paste`);
      return;
    }

    // Fallback 2: shadow textarea
    const shadow = document.querySelector('.d-textarea-shadow') as HTMLTextAreaElement | null;
    if (shadow) {
      this.setNativeValue(shadow, truncated);
      console.log(`${LOG} Body filled via shadow textarea`);
      return;
    }

    console.warn(`${LOG} Could not find body editor`);
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  private truncateBody(body: string): string {
    const plain = body.replace(/<[^>]*>/g, '');
    if (plain.length <= 1000) return body;
    const ratio = 1000 / plain.length;
    return body.substring(0, Math.floor(body.length * ratio * 0.9));
  }

  private setNativeValue(el: HTMLTextAreaElement, value: string): void {
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

const script = new REDContentScript();

export default defineContentScript({
  matches: ['*://creator.xiaohongshu.com/publish*', '*://edith.xiaohongshu.com/publish*'],
  runAt: 'document_end',
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
