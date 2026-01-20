const cloud = require('./api/cloud');
const arena = require('./arena/arena');

const canvas = wx.createCanvas();
const ctx = canvas.getContext('2d');

const systemInfo = wx.getSystemInfoSync();
const screenWidth = systemInfo.windowWidth;
const screenHeight = systemInfo.windowHeight;

const GAME_DURATION = 15000;
const FREEZE_DURATION = 350;

const state = {
  mode: 'loading',
  boards: [],
  activeBoard: null,
  challengeContext: null,
  score: 0,
  combo: 0,
  tapCount: 0,
  startTime: 0,
  elapsed: 0,
  frozenUntil: 0,
  screws: [],
  unlockedGold: false,
  result: null
};

function now() {
  return Date.now();
}

function hashSeed(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function randomFromSeed(seed) {
  let value = seed % 2147483647;
  return function() {
    value = (value * 48271) % 2147483647;
    return value / 2147483647;
  };
}

function generateBoard(seed, difficulty) {
  const random = randomFromSeed(seed + difficulty * 101);
  const screws = [];
  const count = 24 + difficulty * 6;
  for (let i = 0; i < count; i += 1) {
    const typeRoll = random();
    let type = 'normal';
    if (typeRoll > 0.9) {
      type = 'gold';
    } else if (typeRoll > 0.75) {
      type = 'key';
    }
    screws.push({
      id: i,
      x: 60 + random() * (screenWidth - 120),
      y: 160 + random() * (screenHeight - 320),
      r: 22,
      type,
      removed: false
    });
  }
  return screws;
}

function fetchDailyBoards() {
  return cloud.callFunction('getDailyBoards', {}).then(function(result) {
    return result.boards;
  }).catch(function() {
    const dateStr = new Date().toISOString().slice(0, 10);
    return [
      { id: 'A', seed: hashSeed(dateStr + 'A'), difficulty: 0 },
      { id: 'B', seed: hashSeed(dateStr + 'B'), difficulty: 1 },
      { id: 'C', seed: hashSeed(dateStr + 'C'), difficulty: 2 }
    ];
  });
}

function setMode(mode) {
  state.mode = mode;
}

function resetRun() {
  state.score = 0;
  state.combo = 0;
  state.tapCount = 0;
  state.elapsed = 0;
  state.startTime = now();
  state.frozenUntil = 0;
  state.unlockedGold = false;
  state.screws = generateBoard(state.activeBoard.seed, state.activeBoard.difficulty);
  state.result = null;
}

function enterChallengePreview(context) {
  state.challengeContext = context;
  setMode('challenge-preview');
}

function startGame() {
  resetRun();
  setMode('playing');
}

function endGame() {
  const duration = now() - state.startTime;
  const scorePayload = {
    score: state.score,
    durationMs: duration,
    tapCount: state.tapCount,
    boardId: state.activeBoard.id,
    seed: state.activeBoard.seed,
    difficulty: state.activeBoard.difficulty
  };
  const challengeId = state.challengeContext && state.challengeContext.challengeId;
  arena.submitArenaScore(challengeId, scorePayload).then(function(result) {
    state.result = result || { status: 'submitted' };
    setMode('result');
  }).catch(function() {
    state.result = { status: 'submitted' };
    setMode('result');
  });
}

function createArenaChallenge() {
  const payload = {
    seed: state.activeBoard.seed,
    difficulty: state.activeBoard.difficulty,
    boardId: state.activeBoard.id
  };
  return arena.createArenaChallenge(payload).then(function(result) {
    const shareQuery = result.shareQuery || ('challengeId=' + result.challengeId);
    wx.shareAppMessage({
      title: '年货玩具厂·螺丝擂台，敢来挑战吗？',
      query: shareQuery
    });
  });
}

function handleTap(x, y) {
  if (state.mode === 'menu') {
    const boardHeight = 90;
    state.boards.forEach(function(board, index) {
      const top = 240 + index * (boardHeight + 10);
      if (x > 60 && x < screenWidth - 60 && y > top && y < top + boardHeight) {
        state.activeBoard = board;
        setMode('arena-entry');
      }
    });
    return;
  }
  if (state.mode === 'arena-entry') {
    if (x > 60 && x < screenWidth - 60 && y > screenHeight - 220 && y < screenHeight - 140) {
      startGame();
    }
    return;
  }
  if (state.mode === 'challenge-preview') {
    if (x > 60 && x < screenWidth - 60 && y > screenHeight - 220 && y < screenHeight - 140) {
      startGame();
    }
    return;
  }
  if (state.mode === 'result') {
    if (x > 60 && x < screenWidth - 60 && y > screenHeight - 280 && y < screenHeight - 200) {
      createArenaChallenge();
      return;
    }
    if (x > 60 && x < screenWidth - 60 && y > screenHeight - 180 && y < screenHeight - 100) {
      startGame();
    }
    return;
  }
  if (state.mode !== 'playing') {
    return;
  }
  const nowTime = now();
  if (nowTime < state.frozenUntil) {
    return;
  }
  state.tapCount += 1;
  let hit = false;
  state.screws.forEach(function(screw) {
    if (screw.removed) {
      return;
    }
    const dx = x - screw.x;
    const dy = y - screw.y;
    if (dx * dx + dy * dy <= screw.r * screw.r) {
      hit = true;
      if (screw.type === 'gold' && !state.unlockedGold) {
        return;
      }
      screw.removed = true;
      if (screw.type === 'key') {
        state.unlockedGold = true;
      }
      state.combo += 1;
      const baseScore = screw.type === 'gold' ? 25 : screw.type === 'key' ? 15 : 10;
      state.score += baseScore + state.combo * 2;
    }
  });
  if (!hit) {
    state.combo = 0;
    state.frozenUntil = nowTime + FREEZE_DURATION;
  }
}

function update() {
  if (state.mode === 'playing') {
    state.elapsed = now() - state.startTime;
    if (state.elapsed >= GAME_DURATION) {
      endGame();
    }
  }
}

function drawBackground() {
  ctx.fillStyle = '#FDF2D0';
  ctx.fillRect(0, 0, screenWidth, screenHeight);
  ctx.fillStyle = '#C11F1F';
  ctx.fillRect(0, 0, screenWidth, 120);
  ctx.fillStyle = '#FCE8A0';
  ctx.font = '24px sans-serif';
  ctx.fillText('年货玩具厂·螺丝擂台', 20, 70);
}

function drawButton(x, y, w, h, text) {
  ctx.fillStyle = '#D9472B';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#FFF6D6';
  ctx.font = '20px sans-serif';
  ctx.fillText(text, x + 20, y + 36);
}

function drawMenu() {
  ctx.fillStyle = '#8C1E0F';
  ctx.font = '20px sans-serif';
  ctx.fillText('今日擂台三张同题板', 20, 180);
  const boardHeight = 90;
  state.boards.forEach(function(board, index) {
    const top = 240 + index * (boardHeight + 10);
    ctx.fillStyle = '#F8D48A';
    ctx.fillRect(60, top, screenWidth - 120, boardHeight);
    ctx.fillStyle = '#8C1E0F';
    ctx.fillText('擂台 ' + board.id + ' · 难度 ' + (board.difficulty + 1), 80, top + 50);
  });
}

function drawArenaEntry() {
  ctx.fillStyle = '#8C1E0F';
  ctx.font = '20px sans-serif';
  ctx.fillText('擂台入口', 20, 180);
  ctx.fillText('当前板：' + state.activeBoard.id, 20, 220);
  drawButton(60, screenHeight - 220, screenWidth - 120, 80, '开始擂台赛');
}

function drawChallengePreview() {
  ctx.fillStyle = '#8C1E0F';
  ctx.font = '20px sans-serif';
  ctx.fillText('挑战预览', 20, 180);
  if (state.challengeContext && state.challengeContext.opponentInfo) {
    ctx.fillText('对手：' + state.challengeContext.opponentInfo.nickname, 20, 220);
    ctx.fillText('对手成绩：' + state.challengeContext.opponentInfo.score, 20, 250);
  }
  drawButton(60, screenHeight - 220, screenWidth - 120, 80, '接受挑战');
}

function drawPlaying() {
  const remaining = Math.max(0, GAME_DURATION - state.elapsed);
  ctx.fillStyle = '#8C1E0F';
  ctx.font = '20px sans-serif';
  ctx.fillText('分数：' + state.score, 20, 150);
  ctx.fillText('连击：' + state.combo, 160, 150);
  ctx.fillText('剩余：' + Math.ceil(remaining / 1000) + 's', 300, 150);
  state.screws.forEach(function(screw) {
    if (screw.removed) {
      return;
    }
    if (screw.type === 'gold') {
      ctx.fillStyle = state.unlockedGold ? '#D4AF37' : '#7D7D7D';
    } else if (screw.type === 'key') {
      ctx.fillStyle = '#C11F1F';
    } else {
      ctx.fillStyle = '#B77C2A';
    }
    ctx.beginPath();
    ctx.arc(screw.x, screw.y, screw.r, 0, Math.PI * 2);
    ctx.fill();
  });
  if (now() < state.frozenUntil) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, screenWidth, screenHeight);
    ctx.fillStyle = '#FFF';
    ctx.fillText('误点冻结', screenWidth / 2 - 50, screenHeight / 2);
  }
}

function drawResult() {
  ctx.fillStyle = '#8C1E0F';
  ctx.font = '24px sans-serif';
  ctx.fillText('结算', 20, 180);
  ctx.fillText('得分：' + state.score, 20, 220);
  if (state.result && state.result.outcome) {
    ctx.fillText('结果：' + state.result.outcome, 20, 260);
  }
  drawButton(60, screenHeight - 280, screenWidth - 120, 70, '发起擂台挑战');
  drawButton(60, screenHeight - 180, screenWidth - 120, 70, '反杀再来一局');
}

function render() {
  drawBackground();
  if (state.mode === 'menu') {
    drawMenu();
  } else if (state.mode === 'arena-entry') {
    drawArenaEntry();
  } else if (state.mode === 'challenge-preview') {
    drawChallengePreview();
  } else if (state.mode === 'playing') {
    drawPlaying();
  } else if (state.mode === 'result') {
    drawResult();
  } else {
    ctx.fillStyle = '#8C1E0F';
    ctx.fillText('加载中...', 20, 180);
  }
}

function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

function setupTouch() {
  wx.onTouchStart(function(e) {
    const touch = e.touches[0];
    handleTap(touch.clientX, touch.clientY);
  });
}

function init() {
  cloud.initCloud();
  arena.initArena();
  fetchDailyBoards().then(function(boards) {
    state.boards = boards;
    setMode('menu');
  });

  const options = wx.getLaunchOptionsSync();
  const context = arena.enterFromArenaContext(options.query || {});
  if (context) {
    state.activeBoard = {
      id: context.boardId || 'B',
      seed: Number(context.seed) || 0,
      difficulty: Number(context.difficulty) || 1
    };
    enterChallengePreview(context);
  }

  setupTouch();
  loop();
}

init();
