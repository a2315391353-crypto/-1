const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

function hashSeed(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

exports.main = async () => {
  const dateStr = new Date().toISOString().slice(0, 10);
  const ruleVersion = 'v1';
  const boards = [
    { id: 'A', seed: hashSeed(dateStr + 'A' + ruleVersion), difficulty: 0 },
    { id: 'B', seed: hashSeed(dateStr + 'B' + ruleVersion), difficulty: 1 },
    { id: 'C', seed: hashSeed(dateStr + 'C' + ruleVersion), difficulty: 2 }
  ];
  return { dateStr, boards };
};
