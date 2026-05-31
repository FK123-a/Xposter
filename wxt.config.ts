import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  manifestVersion: 3,
  modules: ['@wxt-dev/module-react'],

  manifest: () => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'zh_CN',
    permissions: [
      'storage',
      'tabs',
      'scripting',
      'alarms',
    ],
    host_permissions: [
      'https://mp.weixin.qq.com/*',
      'https://api.weixin.qq.com/*',
      'https://zhuanlan.zhihu.com/*',
      'https://www.zhihu.com/*',
      'https://member.bilibili.com/*',
      'https://api.bilibili.com/*',
      'https://creator.xiaohongshu.com/*',
      'https://edith.xiaohongshu.com/*',
    ],
    web_accessible_resources: [{
      resources: ['content-scripts/*.js'],
      matches: [
        'https://mp.weixin.qq.com/*',
        'https://zhuanlan.zhihu.com/*',
        'https://member.bilibili.com/*',
        'https://creator.xiaohongshu.com/*',
      ],
    }],
  }),
});
