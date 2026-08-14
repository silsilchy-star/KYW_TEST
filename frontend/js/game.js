import { saveScore, getTop } from "./firebase.js";

const screen = document.getElementById("screen");
const message = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const failPanel = document.getElementById("failPanel");
const resultPanel = document.getElementById("resultPanel");
const msValue = document.getElementById("msValue");
const nicknameForm = document.getElementById("nicknameForm");
const nicknameInput = document.getElementById("nicknameInput");
const saveStatus = document.getElementById("saveStatus");
const leaderboardList = document.getElementById("leaderboardList");
const restartFromFailBtn = document.getElementById("restartFromFailBtn");
const restartFromResultBtn = document.getElementById("restartFromResultBtn");

const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 12000;
const LEADERBOARD_SIZE = 5;

let state = "idle";
let timerId = null;
let readyAt = 0;
let lastMs = 0;

function setState(next) {
  state = next;
  screen.dataset.state = next;
}

function randomDelayMs() {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function resetToIdle() {
  clearTimeout(timerId);
  setState("idle");
  message.textContent = "버튼을 눌러 시작하세요";
  message.hidden = false;
  startBtn.hidden = false;
  failPanel.hidden = true;
  resultPanel.hidden = true;
  nicknameForm.hidden = false;
  nicknameInput.value = "";
  saveStatus.textContent = "";
}

function startGame() {
  setState("waiting");
  message.textContent = "빨간색이 되면 클릭하세요";
  startBtn.hidden = true;
  timerId = setTimeout(() => {
    readyAt = performance.now();
    setState("ready");
    message.textContent = "지금 클릭!";
  }, randomDelayMs());
}

function failGame() {
  clearTimeout(timerId);
  setState("fail");
  message.hidden = true;
  failPanel.hidden = false;
}

async function handleReadyClick() {
  lastMs = Math.round(performance.now() - readyAt);
  setState("result");
  message.hidden = true;
  msValue.textContent = `${lastMs} ms`;
  resultPanel.hidden = false;
  await refreshLeaderboard();
}

async function refreshLeaderboard() {
  leaderboardList.innerHTML = "<li>불러오는 중...</li>";
  try {
    const top = await getTop(LEADERBOARD_SIZE);
    if (top.length === 0) {
      leaderboardList.innerHTML = "<li>아직 기록이 없습니다</li>";
      return;
    }
    leaderboardList.innerHTML = top
      .map((entry) => `<li>${escapeHtml(entry.nickname)} - ${entry.ms} ms</li>`)
      .join("");
  } catch (err) {
    console.error(err);
    leaderboardList.innerHTML = "<li>랭킹을 불러오지 못했습니다</li>";
  }
}

screen.addEventListener("click", () => {
  if (state === "waiting") {
    failGame();
  } else if (state === "ready") {
    handleReadyClick();
  }
});

startBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  startGame();
});

restartFromFailBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  resetToIdle();
});

restartFromResultBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  resetToIdle();
});

nicknameForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopPropagation();
  const nickname = nicknameInput.value.trim().slice(0, 20);
  if (!nickname) return;

  saveStatus.textContent = "저장 중...";
  try {
    await saveScore(lastMs, nickname);
    saveStatus.textContent = "저장 완료!";
    nicknameForm.hidden = true;
    await refreshLeaderboard();
  } catch (err) {
    console.error(err);
    saveStatus.textContent = "저장에 실패했습니다. 다시 시도해주세요.";
  }
});

resetToIdle();
