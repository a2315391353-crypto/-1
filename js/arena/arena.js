const cloud = require('../api/cloud');

function getArenaComponent() {
  // TODO: 按官方擂台赛组件开发指南替换/对齐组件获取方式
  // 例如：const arena = wx.getArenaComponent && wx.getArenaComponent();
  return null;
}

function isArenaAvailable() {
  const arena = getArenaComponent();
  return !!arena;
}

function initArena() {
  const arena = getArenaComponent();
  if (!arena) {
    return { available: false, message: '未开通擂台组件' };
  }
  // TODO: 按官方擂台赛组件开发指南调用初始化方法
  // arena.init({});
  return { available: true };
}

function createArenaChallenge(payload) {
  return cloud.callFunction('createChallenge', payload).then(function(result) {
    const arena = getArenaComponent();
    if (arena) {
      // TODO: 按官方擂台赛组件开发指南创建擂台挑战
      // const arenaResult = arena.createChallenge({ challengeId: result.challengeId, ...payload });
      // return { challengeId: result.challengeId, shareQuery: arenaResult.shareQuery };
    }
    return {
      challengeId: result.challengeId,
      shareQuery: 'challengeId=' + result.challengeId
    };
  });
}

function enterFromArenaContext(query) {
  const arena = getArenaComponent();
  if (arena) {
    // TODO: 按官方擂台赛组件开发指南解析回流上下文
    // const context = arena.getEnterContext(query);
    // return context;
  }
  if (!query || !query.challengeId) {
    return null;
  }
  return {
    challengeId: query.challengeId,
    opponentInfo: query.opponent ? JSON.parse(query.opponent) : null,
    seed: query.seed,
    difficulty: query.difficulty
  };
}

function submitArenaScore(challengeId, scorePayload) {
  const arena = getArenaComponent();
  if (arena) {
    // TODO: 按官方擂台赛组件开发指南提交成绩
    // return arena.submitScore({ challengeId, score: scorePayload.score, ...scorePayload });
  }
  return cloud.callFunction('submitRun', {
    challengeId,
    scorePayload
  });
}

module.exports = {
  initArena,
  createArenaChallenge,
  enterFromArenaContext,
  submitArenaScore,
  isArenaAvailable
};
