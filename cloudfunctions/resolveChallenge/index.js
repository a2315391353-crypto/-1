const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const challengeId = event.challengeId;
  if (!challengeId) {
    return { error: 'missing challengeId' };
  }
  const challenge = await db.collection('challenges').doc(challengeId).get();
  const data = challenge.data;
  if (!data || data.creatorScore == null || data.opponentScore == null) {
    return { status: 'pending' };
  }
  let outcome = 'draw';
  if (data.creatorScore > data.opponentScore) {
    outcome = 'creator_win';
  } else if (data.creatorScore < data.opponentScore) {
    outcome = 'opponent_win';
  }
  await db.collection('challenges').doc(challengeId).update({
    data: {
      status: 'resolved',
      outcome,
      updatedAt: Date.now()
    }
  });
  return { status: 'resolved', outcome };
};
