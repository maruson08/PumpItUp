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

function updateHP(amount) {
  if (amount < 0) {
    if (currentDifficulty === "easy") amount *= 0.6;
    else if (currentDifficulty === "hard") amount *= 1.6;
  }
  hp += amount;
  if (hp > 100) hp = 100;
  if (hp <= 0) {
    hp = 0;
    goToFinish("GAME OVER");
  } else {
    document.getElementById("hp-bar").style.width = `${hp}%`;
    document.getElementById("HP").textContent = Math.ceil(hp);
}
}
function goToFinish(reason = "CLEAR!") {
  const selectedSong = JSON.parse(sessionStorage.getItem("selectedSong"));
  const params = new URLSearchParams({
    score,
    combo: maxCombo,
    perfect,
    great,
    good,
    bad,
    miss,
    reason,
    songTitle: selectedSong ? selectedSong.title : "Unknown Song",
    difficulty: currentDifficulty || "medium",
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
    updateHP(judgmentRules.find((r) => r.type === "MISS").hp);
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

  const judgment = judgmentRules.find(
    (r) => minDiff >= r.minDiff && minDiff < r.maxDiff
  );
  if (!judgment) return;

  score += judgment.score;
  updateHP(judgment.hp);
  showJudgment(judgment.type, closestArrow);
  updateCombo(judgment.type !== "MISS" && judgment.type !== "BAD");
  switch (judgment.type) {
    case "PERFECT":
      perfect++;
      break;
    case "GREAT":
      great++;
      break;
    case "GOOD":
      good++;
      break;
    case "BAD":
      bad++;
      break;
    case "MISS":
      miss++;
      break;
  }

  document.querySelector("#score .info-stat-value").textContent = score;

  const arrowId = closestArrow.id;
  if (arrowMonitors.has(arrowId)) {
    clearInterval(arrowMonitors.get(arrowId));
    arrowMonitors.delete(arrowId);
  }
  closestArrow.remove();
}

$(document).keydown(function (event) {
  const arrowType = keyMap[event.key];
  if (!arrowType) return;

  event.preventDefault();

  const marker = document.querySelector(`#${arrowType} .marker`);
  marker?.classList.add("active");

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

window.addEventListener("beforeunload", () => {
  arrowMonitors.forEach((interval) => clearInterval(interval));
});

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

    document.getElementById(
      "myVideo"
    ).src = `https://www.youtube.com/embed/${selectedSong.url}?autoplay=1&controls=0`;

    setDifficulty(selectedSong.difficulty);
    Object.keys(keyMap).forEach((key) => {
      $(`#${keyMap[key]}`).find(".fallingArrows").remove();
    });

    Object.entries(songData.sheet).forEach(([time, arrows]) => {
      const seconds = parseFloat(time);
      if (isNaN(seconds)) return;

      setTimeout(() => {
        arrows.forEach((arrowType) => {
          const id = `arrow_${beat++}`;
          const arrow = $(`<img class="fallingArrows" id="${id}" 
            data-type="${arrowType}" src="Assets/${arrowType.toUpperCase()}.png" 
            width="70%">`);

          arrow.on("animationend", function () {
            removeArrow($(this));
          });

          $(`#${arrowType}`).append(arrow);
          startArrowMonitoring(id, arrowType);
        });
      }, Math.max(0, seconds * 1000 - 300));
    });

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
