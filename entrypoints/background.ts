/**
 * Service Worker entry point
 *
 * Serves as the central orchestrator: handles messages from popup,
 * routes to platform adapters (API or content-script), manages
 * image fetching (CORS bypass), and keeps the worker alive during
 * active publish operations.
 */
import type { PublishJob, PublishResult } from '../domain/models/publish';
import type { PlatformCode } from '../shared/constants';

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
  // Message handler: CORS bypass for images
  // -----------------------------------------------------------------------
  browser.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'FETCH_IMAGE') {
      handleFetchImage(msg.payload.url)
        .then((result) => sendResponse(result))
        .catch((err) => sendResponse({ error: err.message }));
      return true; // keep channel open for async response
    }
    return false;
  });

  async function handleFetchImage(url: string): Promise<{ base64?: string; type?: string; error?: string }> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return { error: `HTTP ${response.status}` };
      }
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      // Manual base64 encode (no btoa on binary)
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

  console.log('[Xposter] Background ready');
});
