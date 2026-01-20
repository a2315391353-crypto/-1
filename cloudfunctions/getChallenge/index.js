const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const challengeId = event.challengeId;
  if (!challengeId) {
    return { error: 'missing challengeId' };
  }
  const result = await db.collection('challenges').doc(challengeId).get();
  return result.data || null;
};
