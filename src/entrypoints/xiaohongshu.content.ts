import { BasePlatformAdapter } from '../infrastructure/adapters/BasePlatformAdapter';

const LOG = '[Xposter RED]';

class REDContentScript extends BasePlatformAdapter {
  async handlePublish(adapted: { title: string; body: string }): Promise<string> {
    console.log(`${LOG} handlePublish called`, { title: adapted.title, bodyLength: adapted.body?.length });

    await this.observeElement('.publish-container, .note-editor', 15000);
    this.fillInputBySelector('input[placeholder*="标题"]', adapted.title);
    this.fillInputBySelector('textarea, [contenteditable="true"]', adapted.body);
    console.log(`${LOG} Form filled — ready for manual review`);
    return window.location.href;
  }
}
const script = new REDContentScript();

export default defineContentScript({
  matches: ['*://creator.xiaohongshu.com/publish*', '*://edith.xiaohongshu.com/publish*'],
  runAt: 'document_end',
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
