const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

function assessRisk(payload) {
  const duration = payload.durationMs || 0;
  const tapCount = payload.tapCount || 0;
  const score = payload.score || 0;
  const difficulty = payload.difficulty || 1;
  let riskLevel = 0;
  if (duration < 8000 || duration > 25000) {
    riskLevel = Math.max(riskLevel, 2);
  }
  if (tapCount > 200) {
    riskLevel = Math.max(riskLevel, 2);
  }
  if (tapCount > 0) {
    const avgInterval = duration / tapCount;
    if (avgInterval < 50) {
      riskLevel = Math.max(riskLevel, 2);
    } else if (avgInterval < 80) {
      riskLevel = Math.max(riskLevel, 1);
    }
  }
  const maxScrews = 24 + difficulty * 6;
  const maxScore = 25 * maxScrews + 2 * (maxScrews * (maxScrews + 1)) / 2;
  if (score > maxScore * 1.2) {
    riskLevel = Math.max(riskLevel, 2);
  }
  return riskLevel;
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const scorePayload = event.scorePayload || {};
  const riskLevel = assessRisk(scorePayload);
  const now = Date.now();
  const runData = {
    openId: OPENID,
    score: scorePayload.score || 0,
    durationMs: scorePayload.durationMs || 0,
    tapCount: scorePayload.tapCount || 0,
    seed: scorePayload.seed || 0,
    difficulty: scorePayload.difficulty || 1,
    boardId: scorePayload.boardId || 'B',
    riskLevel,
    createdAt: now
  };
  const runResult = await db.collection('runs').add({ data: runData });

  const dateKey = new Date(now).toISOString().slice(0, 10);
  await db.collection('leaderboards_daily').add({
    data: {
      dateKey,
      boardId: runData.boardId,
      score: runData.score,
      openId: OPENID,
      runId: runResult._id,
      createdAt: now
    }
  });

  if (event.challengeId) {
    await db.collection('challenges').doc(event.challengeId).update({
      data: {
        opponentOpenId: OPENID,
        opponentScore: runData.score,
        updatedAt: now
      }
    });
  }

  return {
    runId: runResult._id,
    riskLevel
  };
};
