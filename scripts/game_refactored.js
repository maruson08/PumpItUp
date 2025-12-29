let score = 0;
let beat = 0;
let hp = 100;
let combo = 0;
let maxCombo = 0;
let perfect = 0;
let great = 0;
let good = 0;
let bad = 0;
let miss = 0;
let lastKeyPressTime = {};

const keyMap = {
  7: "ul",
  1: "dl",
  5: "center",
  9: "ur",
  3: "dr",
};

const arrowMonitors = new Map();

// Judgment rules by difficulty
const judgmentRules = [
  { type: "PERFECT", minDiff: 0, maxDiff: 20, score: 150, hp: 5 },
  { type: "GREAT", minDiff: 20, maxDiff: 40, score: 100, hp: 3 },
  { type: "GOOD", minDiff: 40, maxDiff: 60, score: 50, hp: 0 },
  { type: "BAD", minDiff: 60, maxDiff: 80, score: 0, hp: -5 },
  { type: "MISS", minDiff: 80, maxDiff: Infinity, score: 0, hp: -10 },
];

const judgmentCounts = {
  PERFECT: "perfect",
  GREAT: "great",
  GOOD: "good",
  BAD: "bad",
  MISS: "miss",
};

let currentDifficulty = "medium";

function setDifficulty(difficulty) {
  currentDifficulty = difficulty;
  document.querySelector("#difficulty .info-stat-value").textContent =
    difficulty.toUpperCase();
}

function goToFinish(reason = "CLEAR!") {
  const params = new URLSearchParams({
    score,
    combo: maxCombo,
    perfect,
    great,
    good,
    bad,
    miss,
    reason,
  });
  window.location.href = `finish.html?${params.toString()}`;
}

function showJudgment(type, arrowElement) {
  const judgment = document.createElement("div");
  judgment.className = `judgment ${type.toLowerCase()}`;
  judgment.textContent = type;
  document.body.appendChild(judgment);

  document.querySelectorAll(".judgment").forEach((j) => {
    if (j !== judgment) j.remove();
  });

  setTimeout(() => judgment.remove(), 500);
}

function showComboPopup() {
  if (combo > 1) {
    const comboPopup = document.createElement("div");
    comboPopup.className = "combo-popup";
    comboPopup.textContent = `${combo} COMBO!`;
    document.body.appendChild(comboPopup);
    setTimeout(() => comboPopup.remove(), 300);
  }
}

function updateCombo(success) {
  combo = success ? combo + 1 : 0;
  if (combo > maxCombo) maxCombo = combo;
  document.querySelector("#combo .info-stat-value").textContent = combo;
  if (success) showComboPopup();
}

function handleMissedArrow(arrow) {
  const arrowRect = arrow[0].getBoundingClientRect();
  const markerRect = document
    .querySelector(`#${arrow.data("type")} .marker`)
    .getBoundingClientRect();
  const timingDiff = arrowRect.top - markerRect.top;

  if (timingDiff < -80) {
    showJudgment("MISS", arrow[0]);
    updateCombo(false);
    miss++;
    arrow.remove();
    return true;
  }
  return false;
}

function startArrowMonitoring(arrowId, arrowType) {
  const checkInterval = setInterval(() => {
    const arrow = document.getElementById(arrowId);
    if (arrow) {
      if (handleMissedArrow($(arrow))) {
        clearInterval(checkInterval);
        arrowMonitors.delete(arrowId);
      }
    } else {
      clearInterval(checkInterval);
      arrowMonitors.delete(arrowId);
    }
  }, 16);

  arrowMonitors.set(arrowId, checkInterval);
}

function judgeArrow(arrowType) {
  const arrows = document.querySelectorAll(
    `.fallingArrows[data-type="${arrowType}"]`
  );
  if (arrows.length === 0) return;

  const marker = document.querySelector(`#${arrowType} .marker`);
  let closestArrow = null;
  let minDiff = Infinity;

  arrows.forEach((arrow) => {
    const arrowRect = arrow.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();
    const timingDiff = Math.abs(arrowRect.top - markerRect.top);

    if (timingDiff < minDiff) {
      minDiff = timingDiff;
      closestArrow = arrow;
    }
  });

  if (!closestArrow || minDiff > 100) return;

  // Find matching judgment rule
  const judgment = judgmentRules.find(
    (r) => minDiff >= r.minDiff && minDiff < r.maxDiff
  );
  if (!judgment) return;

  score += judgment.score;
  showJudgment(judgment.type, closestArrow);
  updateCombo(judgment.type !== "MISS" && judgment.type !== "BAD");
  window[judgmentCounts[judgment.type]]++;

  document.querySelector("#score .info-stat-value").textContent = score;

  const arrowId = closestArrow.id;
  if (arrowMonitors.has(arrowId)) {
    clearInterval(arrowMonitors.get(arrowId));
    arrowMonitors.delete(arrowId);
  }
  closestArrow.remove();
}

// Keyboard event listeners
$(document).keydown(function (event) {
  const arrowType = keyMap[event.key];
  if (!arrowType) return;

  event.preventDefault();

  // Handle arrow marker active state
  const marker = document.querySelector(`#${arrowType} .marker`);
  marker?.classList.add("active");

  // Prevent multiple keypresses within 100ms
  const currentTime = Date.now();
  if (currentTime - (lastKeyPressTime[arrowType] || 0) >= 100) {
    lastKeyPressTime[arrowType] = currentTime;
    judgeArrow(arrowType);
  }
});

$(document).keyup(function (event) {
  const arrowType = keyMap[event.key];
  if (arrowType) {
    document.querySelector(`#${arrowType} .marker`)?.classList.remove("active");
  }
});

// Difficulty setting with keyboard (1, 2, 3)
document.addEventListener("keydown", (event) => {
  const difficultyMap = { 1: "easy", 2: "medium", 3: "hard" };
  if (difficultyMap[event.key]) {
    setDifficulty(difficultyMap[event.key]);
  }
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  arrowMonitors.forEach((interval) => clearInterval(interval));
});

// Main game initialization
document.addEventListener("DOMContentLoaded", async () => {
  const selectedSong = JSON.parse(sessionStorage.getItem("selectedSong"));

  if (!selectedSong) {
    window.location.href = "index.html";
    return;
  }

  try {
    const response = await fetch("/songList.json");
    const songList = await response.json();
    const songData = songList[selectedSong.title];

    if (!songData) {
      throw new Error("Song data not found");
    }

    // Set up YouTube iframe
    document.getElementById(
      "myVideo"
    ).src = `https://www.youtube.com/embed/${selectedSong.url}?autoplay=1&controls=0`;

    // Set difficulty
    setDifficulty(selectedSong.difficulty);

    // Create arrows based on sheet data
    Object.entries(songData.sheet).forEach(([time, arrows]) => {
      const seconds = parseFloat(time);
      if (isNaN(seconds)) return;

      setTimeout(() => {
        arrows.forEach((arrowType) => {
          const id = `arrow_${beat++}`;
          const arrow = document.createElement("img");
          arrow.id = id;
          arrow.className = "fallingArrows";
          arrow.dataset.type = arrowType;
          arrow.src = `Assets/${arrowType.toUpperCase()}.png`;
          arrow.width = "70%";

          arrow.addEventListener("animationend", function () {
            showJudgment("MISS", this);
            updateCombo(false);
            miss++;
            removeArrow($(this));
          });

          document.getElementById(arrowType).appendChild(arrow);
          startArrowMonitoring(id, arrowType);
        });
      }, seconds * 1000);
    });

    // End song timer
    setTimeout(() => {
      goToFinish();
    }, songData.duration * 1000 + 5000);
  } catch (error) {
    console.error("Error loading song data:", error);
    alert("Error loading song data. Returning to song selection.");
    window.location.href = "index.html";
  }
});

function removeArrow(arrow) {
  if (!arrow?.length) return;

  const arrowId = arrow.attr("id");
  if (arrowMonitors.has(arrowId)) {
    clearInterval(arrowMonitors.get(arrowId));
    arrowMonitors.delete(arrowId);
  }

  arrow.remove();
}
