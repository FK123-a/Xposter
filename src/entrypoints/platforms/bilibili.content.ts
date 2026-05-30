import { BasePlatformAdapter } from '../../infrastructure/adapters/BasePlatformAdapter';

class BilibiliContentScript extends BasePlatformAdapter {
  async handlePublish(adapted: { title: string; body: string; tags: string[] }): Promise<string> {
    await this.observeElement('.upload-container, .article-editor', 15000);
    this.fillInputBySelector('input[placeholder*="标题"]', adapted.title);
    this.fillInputBySelector('textarea[placeholder*="简介"], textarea[placeholder*="描述"]', adapted.body);
    for (const tag of adapted.tags) {
      try {
        this.fillInputBySelector('input[placeholder*="标签"]', tag);
        await new Promise((r) => setTimeout(r, 300));
      } catch { /* skip */ }
    }
    this.clickButton('提交');
    return window.location.href;
  }
}
const script = new BilibiliContentScript();

export default defineContentScript({
  matches: ['*://member.bilibili.com/platform/upload/*', '*://member.bilibili.com/article-editor/*'],
  runAt: 'document_idle',
  main() {
    browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg.type === 'PUBLISH_START') {
        script.handlePublish(msg.payload.adapted)
          .then((url) => sendResponse({ type: 'PUBLISH_COMPLETE', payload: { jobId: msg.payload.jobId, result: { url } } }))
          .catch((err) => sendResponse({ type: 'PUBLISH_ERROR', payload: { jobId: msg.payload.jobId, error: { message: err.message } } }));
        return true;
      }
      return false;
    });
  },
});
