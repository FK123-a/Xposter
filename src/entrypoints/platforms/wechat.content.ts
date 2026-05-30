/**
 * Content script injected into WeChat Official Account editor page.
 *
 * Runs in the ISOLATED world of the target page.
 * Receives adapted content via chrome.runtime.onMessage and fills the editor.
 */
import { BasePlatformAdapter } from '../../infrastructure/adapters/BasePlatformAdapter';

class WechatContentScript extends BasePlatformAdapter {
  async handlePublish(adapted: { title: string; body: string }): Promise<string> {
    // Wait for the editor to fully load (WeChat uses an iframe-based editor)
    // The title is an input, the body is in a contentEditable iframe
    await this.fillTitle(adapted.title);
    await this.fillBody(adapted.body);

    // Wait for draft auto-save, then submit
    this.clickButton('保存为草稿');
    await this.delay(2000);
    this.clickButton('发布');

    return window.location.href;
  }

  private async fillTitle(title: string): Promise<void> {
    // WeChat editor title input
    await this.delay(1000);
    this.fillInputBySelector('#title', title);
  }

  private async fillBody(html: string): Promise<void> {
    // WeChat editor body is in an iframe with contentEditable
    const iframe = await this.observeElement('#ueditor_0') as HTMLIFrameElement;
    const body = iframe.contentDocument?.body;
    if (!body) throw new Error('Editor iframe body not found');

    body.innerHTML = html;
    body.dispatchEvent(new Event('input', { bubbles: true }));
    body.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

const script = new WechatContentScript();

export default defineContentScript({
  matches: [
    '*://mp.weixin.qq.com/cgi-bin/appmsg*',
    '*://mp.weixin.qq.com/cgi-bin/appmsg?*action=edit*',
  ],
  runAt: 'document_idle',

  main() {
    browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg.type === 'PUBLISH_START' && msg.payload) {
        script.handlePublish(msg.payload.adapted)
          .then((url) => {
            sendResponse({ type: 'PUBLISH_COMPLETE', payload: { jobId: msg.payload.jobId, result: { url } } });
          })
          .catch((err) => {
            sendResponse({ type: 'PUBLISH_ERROR', payload: { jobId: msg.payload.jobId, error: { message: err.message } } });
          });
        return true; // keep channel open for async response
      }
      return false;
    });
  },
});
