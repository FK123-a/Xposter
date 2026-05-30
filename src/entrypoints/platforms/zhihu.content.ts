/**
 * Content script injected into Zhihu article editor page.
 * Zhihu uses Draft.js for rich text editing — requires paste-based filling.
 */
import { BasePlatformAdapter } from '../../infrastructure/adapters/BasePlatformAdapter';

class ZhihuContentScript extends BasePlatformAdapter {
  async handlePublish(adapted: { title: string; body: string; tags: string[] }): Promise<string> {
    // Wait for Draft.js editor to mount
    await this.observeElement('.public-DraftEditor-content', 15000);

    // Fill title
    this.fillInputBySelector('.WriteIndexTitle-input input, .WriteIndexTitle-input textarea', adapted.title);

    // Fill body via rich text paste (Draft.js expects paste events)
    await this.fillRichTextViaPaste('.public-DraftEditor-content', adapted.body);

    // Add tags
    for (const tag of adapted.tags) {
      await this.addTopicTag(tag);
    }

    // Submit
    this.clickButton('发布文章');

    // Wait for success URL change
    return window.location.href;
  }

  private async addTopicTag(tag: string): Promise<void> {
    // Click '添加话题' button
    const addBtn = this.findButtonByText('添加话题');
    if (addBtn) addBtn.click();

    await new Promise((r) => setTimeout(r, 500));

    // Search for the topic
    try {
      this.fillInputBySelector('.TopicSearch-input input, [class*="topic-search"] input', tag);
      await new Promise((r) => setTimeout(r, 1500));

      // Click the first result
      const firstResult = document.querySelector('[class*="topic-result"] li, [class*="topic-item"]');
      if (firstResult) (firstResult as HTMLElement).click();
    } catch {
      // Topic not found — non-fatal
    }
  }
}

const script = new ZhihuContentScript();

export default defineContentScript({
  matches: ['*://zhuanlan.zhihu.com/write*', '*://zhuanlan.zhihu.com/p/*/edit*'],
  runAt: 'document_end',
  main() {
    browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg.type === 'PUBLISH_START' && msg.payload) {
        script.handlePublish(msg.payload.adapted)
          .then((url) => sendResponse({ type: 'PUBLISH_COMPLETE', payload: { jobId: msg.payload.jobId, result: { url } } }))
          .catch((err) => sendResponse({ type: 'PUBLISH_ERROR', payload: { jobId: msg.payload.jobId, error: { message: err.message } } }));
        return true;
      }
      return false;
    });
  },
});
