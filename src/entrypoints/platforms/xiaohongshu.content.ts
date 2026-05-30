import { BasePlatformAdapter } from '../../infrastructure/adapters/BasePlatformAdapter';

class REDContentScript extends BasePlatformAdapter {
  async handlePublish(adapted: { title: string; body: string }): Promise<string> {
    await this.observeElement('.publish-container, .note-editor', 15000);
    this.fillInputBySelector('input[placeholder*="标题"]', adapted.title);
    this.fillInputBySelector('textarea, [contenteditable="true"]', adapted.body);
    this.clickButton('发布');
    return window.location.href;
  }
}
const script = new REDContentScript();

export default defineContentScript({
  matches: ['*://creator.xiaohongshu.com/publish*', '*://edith.xiaohongshu.com/publish*'],
  runAt: 'document_end',
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
