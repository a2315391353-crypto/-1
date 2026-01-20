const target = document.getElementById("target");
const board = document.getElementById("board");
const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const bestEl = document.getElementById("best");
const messageEl = document.getElementById("message");
const startBtn = document.getElementById("start");
const resetBtn = document.getElementById("reset");

const GAME_TIME = 30;
const STORAGE_KEY = "click-ball-best";

let score = 0;
let timeLeft = GAME_TIME;
let timerId = null;
let active = false;

const bestScore = Number(localStorage.getItem(STORAGE_KEY)) || 0;
bestEl.textContent = String(bestScore);

function randomPosition() {
  const padding = 16;
  const size = 72;
  const maxX = board.clientWidth - size - padding;
  const maxY = board.clientHeight - size - padding;
  const x = Math.max(padding, Math.random() * maxX);
  const y = Math.max(padding, Math.random() * maxY);
  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
}

function updateMessage(text) {
  messageEl.textContent = text;
  messageEl.style.opacity = text ? "1" : "0";
}

function updateScore(nextScore) {
  score = nextScore;
  scoreEl.textContent = String(score);
}

function updateTime(nextTime) {
  timeLeft = nextTime;
  timeEl.textContent = String(timeLeft);
}

function startGame() {
  if (active) {
    return;
  }
  active = true;
  updateScore(0);
  updateTime(GAME_TIME);
  updateMessage("");
  target.classList.add("active");
  randomPosition();
  startBtn.textContent = "进行中...";
  startBtn.disabled = true;

  timerId = window.setInterval(() => {
    updateTime(timeLeft - 1);
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  active = false;
  window.clearInterval(timerId);
  target.classList.remove("active");
  const currentBest = Number(localStorage.getItem(STORAGE_KEY)) || 0;
  if (score > currentBest) {
    localStorage.setItem(STORAGE_KEY, String(score));
    bestEl.textContent = String(score);
    updateMessage(`时间到！新纪录：${score} 分`);
  } else {
    updateMessage(`时间到！得分：${score} 分`);
  }
  startBtn.textContent = "再来一次";
  startBtn.disabled = false;
}

function handleHit() {
  if (!active) {
    return;
  }
  updateScore(score + 1);
  randomPosition();
}

function resetBest() {
  localStorage.setItem(STORAGE_KEY, "0");
  bestEl.textContent = "0";
  if (!active) {
    updateMessage("纪录已重置，点击开始按钮开始游戏");
  }
}

startBtn.addEventListener("click", startGame);
target.addEventListener("click", handleHit);
resetBtn.addEventListener("click", resetBest);

window.addEventListener("resize", () => {
  if (active) {
    randomPosition();
  }
});
