'use strict';

const native = require('../../build/Release/sfml.node');

/**
 * 为外部句柄测试提供宿主；Windows 使用独立系统控件以免重复安装 SFML 回调。
 * @param {import('../..').Window} window 提供尺寸或现成的非 Windows 宿主。
 * @return {{handle: bigint, close: Function}} 宿主句柄及释放操作。
 */
module.exports = function windowHost(window) {
  if (process.platform !== 'win32') {
    return { handle: window.getNativeHandle(), close() {} };
  }
  const size = window.getSize();
  const host = native.createWindowHost(size.x, size.y);
  return {
    handle: host.handle,
    close() { native.closeWindowHost(host.owner); },
  };
};
