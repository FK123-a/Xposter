import { platformRegistry } from './PlatformRegistry';
import { WechatMPAdapter } from './WechatMPAdapter';

/** Call at app startup to register all available platform adapters */
export function registerAllPlatforms(): void {
  platformRegistry.register('wechat-mp', () => new WechatMPAdapter());
  // Future: zhihu, bilibili, xiaohongshu
}

export { platformRegistry };
