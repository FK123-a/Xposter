/**
 * Service Worker entry point
 *
 * Serves as the central orchestrator: handles messages from popup,
 * routes to platform adapters (API or content-script), manages
 * image fetching (CORS bypass), and keeps the worker alive during
 * active publish operations.
 */
import { platformRegistry, registerAllPlatforms } from '../infrastructure/adapters/platforms';
import { createMarkdownContent } from '../domain/models/content';
import { PLATFORM_PUBLISH_URLS, type PlatformCode } from '../shared/constants';

// Register all platforms at startup
registerAllPlatforms();

export default defineBackground(() => {
  console.log('[Xposter] Background service worker started', { id: browser.runtime.id });

  // -----------------------------------------------------------------------
  // Keep-alive: Prevent service worker termination during active publishes
  // -----------------------------------------------------------------------
  let activePublishCount = 0;

  async function enterPublish(): Promise<void> {
    activePublishCount += 1;
    if (activePublishCount === 1) {
      await browser.alarms.create('keepalive', { periodInMinutes: 0.5 });
    }
  }

  async function exitPublish(): Promise<void> {
    activePublishCount = Math.max(0, activePublishCount - 1);
    if (activePublishCount === 0) {
      await browser.alarms.clear('keepalive');
    }
  }

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'keepalive') {
      // No-op; the existence of an active alarm prevents termination
    }
  });

  // -----------------------------------------------------------------------
  // Message router
  // -----------------------------------------------------------------------
  browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'FETCH_IMAGE') {
      handleFetchImage(msg.payload.url)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse({ error: err.message }));
      return true; // keep channel open for async response
    }

    if (msg.type === 'PUBLISH_REQUEST') {
      handlePublishRequest(msg.payload)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse({ error: err instanceof Error ? err.message : 'Unknown error' }));
      return true;
    }

    return false;
  });

  // -----------------------------------------------------------------------
  // Image CORS bypass
  // -----------------------------------------------------------------------
  async function handleFetchImage(url: string): Promise<{ base64?: string; type?: string; error?: string }> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return { error: `HTTP ${response.status}` };
      }
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let base64 = '';
      const chunk = 8192;
      for (let i = 0; i < uint8Array.length; i += chunk) {
        const slice = uint8Array.subarray(i, i + chunk);
        base64 += String.fromCharCode(...slice);
      }
      return {
        base64: btoa(base64),
        type: blob.type,
      };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  // -----------------------------------------------------------------------
  // Publish orchestration
  // -----------------------------------------------------------------------
  async function handlePublishRequest(payload: {
    markdown: string;
    platforms: PlatformCode[];
    jobId: string;
  }): Promise<{
    results: Array<{
      platformCode: PlatformCode;
      status: string;
      error?: string;
      url?: string;
      validation?: { valid: boolean; issues: unknown[] };
    }>;
  }> {
    await enterPublish();

    const content = createMarkdownContent(payload.markdown, { tags: [] });
    const results: Array<{
      platformCode: PlatformCode;
      status: string;
      error?: string;
      url?: string;
      validation?: { valid: boolean; issues: unknown[] };
    }> = [];

    try {
      for (const platformCode of payload.platforms) {
        console.log(`[Xposter] Publishing to ${platformCode}...`);

        try {
          // Step 1: Adapt content
          const adapter = platformRegistry.getPublisher(platformCode);
          const contentAdapter = adapter.getContentAdapter();
          const adapted = await contentAdapter.adapt(content);

          // Step 2: Validate
          const validation = contentAdapter.validate(adapted);
          if (!validation.valid) {
            results.push({
              platformCode,
              status: 'failed',
              error: 'Content validation failed',
              validation,
            });
            continue;
          }

          // Step 3: Open editor tab
          const editorUrl = PLATFORM_PUBLISH_URLS[platformCode];
          console.log(`[Xposter] Opening editor: ${editorUrl}`);
          const tab = await browser.tabs.create({ url: editorUrl, active: true });

          if (!tab.id) {
            results.push({ platformCode, status: 'failed', error: 'Failed to create tab' });
            continue;
          }

          // Step 6: Wait for tab to fully load
          console.log(`[Xposter] Waiting for tab ${tab.id} to load...`);
          await waitForTabLoad(tab.id);
          console.log(`[Xposter] Tab ${tab.id} loaded`);

          // Step 5: Extra delay for page JS framework to initialize
          // (React/Draft.js editors take time to mount — give them 4s)
          console.log(`[Xposter] Waiting 4s for page JS to initialize...`);
          await delay(4000);

          // Step 6: Send adapted content to the content script
          // Use chrome.tabs.sendMessage directly (not browser polyfill) for reliability
          console.log(`[Xposter] Sending PUBLISH_START to tab ${tab.id}`, {
            title: adapted.title?.substring(0, 50),
            bodyLength: adapted.body?.length,
          });
          const response = await sendMessageToTab(tab.id, {
            type: 'PUBLISH_START',
            payload: {
              jobId: payload.jobId,
              adapted: {
                title: adapted.title,
                body: adapted.body,
                tags: adapted.tags ?? [],
              },
            },
          });

          console.log(`[Xposter] Response from ${platformCode}:`, JSON.stringify(response));

          if (!response) {
            // No response — content script may not be injected or page navigated
            results.push({
              platformCode,
              status: 'failed',
              error: 'No response from content script (may not be injected on this page)',
            });
          } else if (response.type === 'PUBLISH_COMPLETE') {
            results.push({
              platformCode,
              status: 'published',
              url: response.payload?.result?.url,
            });
          } else if (response.type === 'PUBLISH_ERROR') {
            results.push({
              platformCode,
              status: 'failed',
              error: response.payload?.error?.message ?? 'Content script error',
            });
          } else {
            results.push({
              platformCode,
              status: 'failed',
              error: `Unexpected response type: ${response.type}`,
            });
          }
        } catch (err) {
          console.error(`[Xposter] Error publishing to ${platformCode}:`, err);
          results.push({
            platformCode,
            status: 'failed',
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
    } finally {
      await exitPublish();
    }

    console.log('[Xposter] Publish results:', results);
    return { results };
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------
  function waitForTabLoad(tabId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        browser.tabs.onUpdated.removeListener(listener);
        reject(new Error(`Tab ${tabId} load timeout (30s)`));
      }, 30000);

      const listener = (
        updatedTabId: number,
        changeInfo: chrome.tabs.TabChangeInfo,
      ) => {
        if (updatedTabId === tabId && changeInfo.status === 'complete') {
          clearTimeout(timeout);
          browser.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      browser.tabs.onUpdated.addListener(listener);
    });
  }

  function delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  /**
   * Send a message to a tab's content script using native chrome API.
   * Avoids webextension-polyfill wrapping issues with async sendResponse.
   */
  function sendMessageToTab(
    tabId: number,
    message: unknown,
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        const lastError = chrome.runtime.lastError;
        if (lastError) {
          console.error(`[Xposter] tabs.sendMessage error:`, lastError.message);
          reject(new Error(lastError.message));
        } else {
          resolve(response ?? null);
        }
      });
    });
  }

  console.log('[Xposter] Background ready');
});
