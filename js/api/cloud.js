const CLOUD_ENV = 'your-env-id';

let cloudInitialized = false;

function initCloud() {
  if (cloudInitialized) {
    return;
  }
  if (!wx.cloud) {
    wx.showToast({ title: '未开通云开发', icon: 'none' });
    return;
  }
  wx.cloud.init({
    env: CLOUD_ENV,
    traceUser: true
  });
  cloudInitialized = true;
}

function callFunction(name, data) {
  initCloud();
  if (!wx.cloud) {
    return Promise.reject(new Error('cloud unavailable'));
  }
  return wx.cloud.callFunction({
    name,
    data
  }).then(function(res) {
    return res.result;
  }).catch(function(err) {
    wx.showToast({ title: '网络或云函数失败', icon: 'none' });
    throw err;
  });
}

module.exports = {
  callFunction,
  initCloud
};
