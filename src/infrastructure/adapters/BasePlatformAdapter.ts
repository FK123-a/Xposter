/**
 * Shared DOM interaction primitives for content-script-based platform adapters.
 * Provides element observation, input filling, click simulation, and file upload utilities.
 */

export abstract class BasePlatformAdapter {
  /** Wait for an element to appear in the DOM (MutationObserver-based) */
  protected async observeElement(selector: string, timeoutMs = 30000): Promise<Element> {
    const start = Date.now();
    const existing = document.querySelector(selector);
    if (existing) return existing;

    return new Promise((resolve, reject) => {
      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) { observer.disconnect(); resolve(el); }
        if (Date.now() - start > timeoutMs) {
          observer.disconnect();
          reject(new Error(`Timeout waiting for element: ${selector}`));
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { observer.disconnect(); reject(new Error(`Timeout: ${selector}`)); }, timeoutMs);
    });
  }

  /** Fill a standard input/textarea (triggers React change events) */
  protected fillInputBySelector(selector: string, value: string): void {
    const el = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el) throw new Error(`Input not found: ${selector}`);
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
    const nativeSetter = Object.getOwnPropertyDescriptor(proto.prototype, 'value')?.set;
    if (nativeSetter) nativeSetter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /** Fill a contentEditable element via ClipboardEvent (for Draft.js / Slate) */
  protected async fillRichTextViaPaste(selector: string, html: string): Promise<void> {
    const el = await this.observeElement(selector);
    el.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    const dt = new DataTransfer();
    dt.setData('text/html', html);
    dt.setData('text/plain', html.replace(/<[^>]*>/g, ''));
    el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt }));
  }

  /** Find a button by visible text */
  protected findButtonByText(text: string, container: Element = document.body): HTMLElement | null {
    const buttons = container.querySelectorAll('button, [role="button"], a.btn, span[role="button"]');
    for (const btn of buttons) {
      if (btn.textContent?.trim() === text) return btn as HTMLElement;
    }
    return null;
  }

  protected clickButton(text: string): void {
    const btn = this.findButtonByText(text);
    if (!btn) throw new Error(`Button not found: ${text}`);
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  }

  /** Upload a file to a hidden file input */
  protected async uploadViaFileInput(selector: string, blob: Blob, fileName: string): Promise<void> {
    const input = await this.observeElement(selector) as HTMLInputElement;
    const file = new File([blob], fileName, { type: blob.type });
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
