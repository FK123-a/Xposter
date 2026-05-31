import { BasePlatformAdapter } from '../infrastructure/adapters/BasePlatformAdapter';

const LOG = '[Xposter Bilibili]';

class BilibiliContentScript extends BasePlatformAdapter {
  async handlePublish(adapted: { title: string; body: string; tags: string[] }): Promise<string> {
    console.log(`${LOG} handlePublish called`, { title: adapted.title, bodyLength: adapted.body?.length });

    await this.observeElement('.upload-container, .article-editor', 15000);
    this.fillInputBySelector('input[placeholder*="标题"]', adapted.title);
    this.fillInputBySelector('textarea[placeholder*="简介"], textarea[placeholder*="描述"]', adapted.body);
    for (const tag of adapted.tags) {
      try {
        this.fillInputBySelector('input[placeholder*="标签"]', tag);
        await new Promise((r) => setTimeout(r, 300));
      } catch { /* skip */ }
    }
    console.log(`${LOG} Form filled — ready for manual review`);
    return window.location.href;
  }
}
const script = new BilibiliContentScript();

export default defineContentScript({
  matches: ['*://member.bilibili.com/platform/upload/*', '*://member.bilibili.com/article-editor/*'],
  runAt: 'document_idle',
  main() {
    console.log(`${LOG} main() executing`);
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
