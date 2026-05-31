/**
 * Content script injected into WeChat Official Account editor page.
 */
import { BasePlatformAdapter } from '../infrastructure/adapters/BasePlatformAdapter';

const LOG = '[Xposter WeChat]';

class WechatContentScript extends BasePlatformAdapter {
  async handlePublish(adapted: { title: string; body: string }): Promise<string> {
    console.log(`${LOG} handlePublish called`, { title: adapted.title, bodyLength: adapted.body?.length });

    await this.fillTitle(adapted.title);
    await this.fillBody(adapted.body);
    console.log(`${LOG} Form filled — ready for manual review`);
    return window.location.href;
  }

  private async fillTitle(title: string): Promise<void> {
    await this.delay(1000);
    this.fillInputBySelector('#title', title);
  }

  private async fillBody(html: string): Promise<void> {
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
    console.log(`${LOG} main() executing`);
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      console.log(`${LOG} Message received:`, msg.type);
      if (msg.type === 'PUBLISH_START' && msg.payload) {
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
