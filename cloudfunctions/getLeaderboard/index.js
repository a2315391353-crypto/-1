const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const boardId = event.boardId || 'B';
  const dateKey = event.dateKey || new Date().toISOString().slice(0, 10);
  const limit = Math.min(event.limit || 10, 50);
  const result = await db.collection('leaderboards_daily')
    .where({ dateKey, boardId })
    .orderBy('score', 'desc')
    .limit(limit)
    .get();
  return { dateKey, boardId, list: result.data };
};
