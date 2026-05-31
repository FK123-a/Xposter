/**
 * Content script injected into Zhihu article editor page.
 * Zhihu uses a rich text editor — supports paste-based and direct filling.
 */
import { BasePlatformAdapter } from '../infrastructure/adapters/BasePlatformAdapter';

const LOG_PREFIX = '[Xposter Zhihu]';

class ZhihuContentScript extends BasePlatformAdapter {
  async handlePublish(adapted: { title: string; body: string; tags: string[] }): Promise<string> {
    console.log(`${LOG_PREFIX} handlePublish called`, { titleLength: adapted.title.length, bodyLength: adapted.body.length, tags: adapted.tags });

    // ── Step 1: Fill title ──
    await this.fillTitleField(adapted.title);

    // ── Step 2: Fill body ──
    await this.fillBodyField(adapted.body);

    // ── Step 3: Add tags (non-critical) ──
    for (const tag of adapted.tags) {
      try { await this.addTopicTag(tag); } catch { /* skip */ }
    }

    // ── Step 4: Do NOT auto-submit for demo ──
    // User can manually verify the filled content and click submit
    console.log(`${LOG_PREFIX} Form filled — ready for manual review`);
    return window.location.href;
  }

  // -----------------------------------------------------------------------
  // Title: try multiple selectors (Zhihu changes these occasionally)
  // -----------------------------------------------------------------------
  private async fillTitleField(title: string): Promise<void> {
    const selectors = [
      '.WriteIndexTitle-input input',
      '[data-testid="write-title"] input',
      '[class*="Title"] input',
      '[class*="title"] input',
      '.title-input input',
      'input[placeholder*="标题"]',
      'input[placeholder*="输入标题"]',
      // Fallback: any input near the top of the page
    ];

    for (const sel of selectors) {
      try {
        console.log(`${LOG_PREFIX} Trying title selector: "${sel}"`);
        const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement | null;
        if (el) {
          this.setNativeValue(el, title);
          console.log(`${LOG_PREFIX} Title filled via "${sel}"`);
          return;
        }
      } catch { /* continue */ }
    }

    // Last resort: try to find any visible input/textarea at the top
    const allInputs = document.querySelectorAll('input[type="text"], textarea, [contenteditable="true"]');
    console.log(`${LOG_PREFIX} Found ${allInputs.length} input elements on page`);
    for (const el of allInputs) {
      const rect = el.getBoundingClientRect();
      if (rect.top < 300 && rect.width > 200) {
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          this.setNativeValue(el, title);
          console.log(`${LOG_PREFIX} Title filled via fallback input at y=${rect.top}`);
          return;
        }
        if ((el as HTMLElement).contentEditable === 'true') {
          (el as HTMLElement).textContent = title;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          console.log(`${LOG_PREFIX} Title filled via contentEditable at y=${rect.top}`);
          return;
        }
      }
    }

    console.warn(`${LOG_PREFIX} Could not find title input on page`);
  }

  // -----------------------------------------------------------------------
  // Body: try multiple approaches
  // -----------------------------------------------------------------------
  private async fillBodyField(body: string): Promise<void> {
    // Approach 1: Draft.js editor via paste
    const draftSelectors = [
      '.public-DraftEditor-content',
      '[data-testid="write-editor"] .public-DraftEditor-content',
      '.DraftEditor-root .public-DraftEditor-content',
    ];

    for (const sel of draftSelectors) {
      try {
        console.log(`${LOG_PREFIX} Trying Draft.js body selector: "${sel}"`);
        const el = await this.observeElement(sel, 5000).catch(() => null);
        if (el) {
          await this.fillRichTextViaPaste(sel, body);
          console.log(`${LOG_PREFIX} Body filled via Draft.js paste`);
          return;
        }
      } catch { /* continue */ }
    }

    // Approach 2: contentEditable
    const editableSelectors = [
      '[contenteditable="true"]',
      '[role="textbox"]',
      '.ql-editor',
      '.CodeMirror',
    ];

    for (const sel of editableSelectors) {
      try {
        console.log(`${LOG_PREFIX} Trying contentEditable selector: "${sel}"`);
        const el = await this.observeElement(sel, 3000).catch(() => null);
        if (el && (el as HTMLElement).isContentEditable) {
          (el as HTMLElement).focus();
          // Use paste event for rich text editors
          const dt = new DataTransfer();
          dt.setData('text/html', body);
          dt.setData('text/plain', body.replace(/<[^>]*>/g, ''));
          el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt }));
          console.log(`${LOG_PREFIX} Body filled via paste on contentEditable`);
          return;
        }
      } catch { /* continue */ }
    }

    // Approach 3: Any large textarea
    const textareas = document.querySelectorAll('textarea');
    for (const ta of textareas) {
      if (ta.offsetHeight > 100) {
        this.setNativeValue(ta, body);
        console.log(`${LOG_PREFIX} Body filled via textarea`);
        return;
      }
    }

    console.warn(`${LOG_PREFIX} Could not find body editor on page`);
  }

  // -----------------------------------------------------------------------
  // Tag helper
  // -----------------------------------------------------------------------
  private async addTopicTag(tag: string): Promise<void> {
    const addBtn = this.findButtonByText('添加话题') ?? this.findButtonByText('添加');
    if (addBtn) {
      addBtn.click();
      await new Promise((r) => setTimeout(r, 800));
    }

    try {
      const searchInput = document.querySelector(
        '.TopicSearch-input input, [class*="topic-search"] input, input[placeholder*="搜索"]',
      ) as HTMLInputElement | null;
      if (searchInput) {
        this.setNativeValue(searchInput, tag);
        await new Promise((r) => setTimeout(r, 1500));
        const firstResult = document.querySelector(
          '[class*="topic-result"] li, [class*="topic-item"], [class*="popover"] li',
        );
        if (firstResult) (firstResult as HTMLElement).click();
        console.log(`${LOG_PREFIX} Tag added: ${tag}`);
      }
    } catch {
      // Topic not found — non-fatal
    }
  }

  // -----------------------------------------------------------------------
  // Helper: set input value natively (triggers React onChange)
  // -----------------------------------------------------------------------
  private setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string): void {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}

const script = new ZhihuContentScript();

export default defineContentScript({
  matches: ['*://zhuanlan.zhihu.com/write*', '*://zhuanlan.zhihu.com/p/*/edit*'],
  runAt: 'document_end',
  main() {
    console.log(`${LOG_PREFIX} main() executing`);

    // Use chrome.* directly to avoid webextension-polyfill wrapping issues
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      console.log(`${LOG_PREFIX} Message received`, msg.type);

      if (msg.type === 'PUBLISH_START' && msg.payload) {
        console.log(`${LOG_PREFIX} PUBLISH_START payload keys:`, Object.keys(msg.payload.adapted || {}));

        script
          .handlePublish(msg.payload.adapted)
          .then((url) => {
            console.log(`${LOG_PREFIX} handlePublish succeeded, url:`, url);
            sendResponse({
              type: 'PUBLISH_COMPLETE',
              payload: { jobId: msg.payload.jobId, result: { url } },
            });
          })
          .catch((err) => {
            console.error(`${LOG_PREFIX} handlePublish failed:`, err);
            sendResponse({
              type: 'PUBLISH_ERROR',
              payload: { jobId: msg.payload.jobId, error: { message: err instanceof Error ? err.message : String(err) } },
            });
          });
        return true; // keep message channel open for async response
      }
      return false;
    });

    console.log(`${LOG_PREFIX} Listener registered`);
  },
});
