/* Minimal adapter for WeChat minigame canvas 2D */
/* eslint-disable */
const globalObj = (function() {
  if (typeof global !== 'undefined') {
    return global;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  return {};
})();

if (!globalObj.window) {
  globalObj.window = globalObj;
}

if (!globalObj.document) {
  globalObj.document = {
    createElement: function(tagName) {
      if (tagName === 'canvas') {
        return wx.createCanvas();
      }
      return {};
    }
  };
}

if (!globalObj.requestAnimationFrame) {
  globalObj.requestAnimationFrame = function(cb) {
    return setTimeout(function() {
      cb(Date.now());
    }, 16);
  };
}

if (!globalObj.cancelAnimationFrame) {
  globalObj.cancelAnimationFrame = function(id) {
    clearTimeout(id);
  };
}

if (!globalObj.canvas) {
  globalObj.canvas = wx.createCanvas();
}

module.exports = {
  canvas: globalObj.canvas
};
