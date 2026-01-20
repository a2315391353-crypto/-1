const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const seed = event.seed || 0;
  const difficulty = event.difficulty || 1;
  const boardId = event.boardId || 'B';
  const now = Date.now();
  const challengeData = {
    creatorOpenId: OPENID,
    seed,
    difficulty,
    boardId,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    creatorScore: event.creatorScore || null
  };
  const result = await db.collection('challenges').add({ data: challengeData });
  return {
    challengeId: result._id,
    seed,
    difficulty,
    boardId
  };
};
