import { platformRegistry } from './PlatformRegistry';
import { WechatMPAdapter } from './WechatMPAdapter';
import { ZhihuAdapter } from './ZhihuAdapter';
import { BilibiliAdapter } from './BilibiliAdapter';
import { XiaohongshuAdapter } from './XiaohongshuAdapter';

/** Call at app startup to register all available platform adapters */
export function registerAllPlatforms(): void {
  platformRegistry.register('wechat-mp', () => new WechatMPAdapter());
  platformRegistry.register('zhihu', () => new ZhihuAdapter());
  platformRegistry.register('bilibili', () => new BilibiliAdapter());
  platformRegistry.register('xiaohongshu', () => new XiaohongshuAdapter());
}

export { platformRegistry };
