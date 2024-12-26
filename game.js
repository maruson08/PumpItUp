// 곡 길이 설정 (초 단위)
const SONG_DURATION = 50; // 45초로 설정

let score = 0;
let beat = 0;
let hp = 100; // Add HP variable
let combo = 0;
let maxCombo = 0; // Add combo counter
let perfect = 0;
let great = 0;
let good = 0;
let bad = 0;
let miss = 0;

// Define song pattern - 시간 간격 수정
// const sheet = {}; // Remove this

// 난이도별 판정 구간 설정
const difficultySettings = {
  easy: {
    perfect: { timing: 30, overlap: 80 },
    great: { timing: 45, overlap: 65 },
    good: { timing: 60, overlap: 50 },
    bad: { timing: 75, overlap: 35 },
    missThreshold: 80,
  },
  medium: {
    perfect: { timing: 20, overlap: 85 }, // 수정
    great: { timing: 35, overlap: 70 }, // 수정
    good: { timing: 50, overlap: 55 }, // 수정
    bad: { timing: 65, overlap: 40 }, // 수정
    missThreshold: 70, // 수정
  },
  hard: {
    perfect: { timing: 10, overlap: 95 },
    great: { timing: 20, overlap: 85 },
    good: { timing: 30, overlap: 70 },
    bad: { timing: 40, overlap: 50 },
    missThreshold: 45,
  },
};

// 현재 난이도 설정 (기본값: medium)
let currentDifficulty = "eazy";

// 난이도 변경 함수
function setDifficulty(difficulty) {
  currentDifficulty = difficulty;
  // DOM에 현재 난이도 표시
  $("#difficulty").text(`Difficulty: ${difficulty.toUpperCase()}`);
}

function calculateOverlap(marker, fallingArrow) {
  const markerRect = marker.getBoundingClientRect();
  const arrowRect = fallingArrow.getBoundingClientRect();

  const xOverlap = Math.max(
    0,
    Math.min(markerRect.right, arrowRect.right) -
      Math.max(markerRect.left, arrowRect.left)
  );

  const yOverlap = Math.max(
    0,
    Math.min(markerRect.bottom, arrowRect.bottom) -
      Math.max(markerRect.top, arrowRect.top)
  );

  const overlapArea = xOverlap * yOverlap;
  const markerArea = markerRect.width * markerRect.height;
  const overlapPercentage = (overlapArea / markerArea) * 100;

  return overlapPercentage;
}

// Game over 함수 수정
function updateHP(change) {
  hp += change;
  hp = Math.max(0, Math.min(100, hp)); // Keep HP between 0 and 100

  // Update HP text and bar
  $("#HP").text(hp);
  $("#hp-bar").css("width", `${hp}%`);

  // Change bar color based on HP level
  if (hp < 30) {
    $("#hp-bar").css("background", "linear-gradient(90deg, #ff0000, #ff3300)");
  } else if (hp < 60) {
    $("#hp-bar").css("background", "linear-gradient(90deg, #ff3300, #ff9900)");
  } else {
    $("#hp-bar").css("background", "linear-gradient(90deg, #ff9900, #ffff00)");
  }

  if (hp <= 0) {
    goToFinish("Game Over!");
  }
}

// 게임 종료 처리 함수
function goToFinish(reason = "CLEAR!") {
  const params = new URLSearchParams({
    score: score,
    combo: maxCombo,
    perfect: perfect,
    great: great,
    good: good,
    bad: bad,
    miss: miss,
    reason: reason,
  });
  window.location.href = `finish.html?${params.toString()}`;
}

// 곡 종료 타이머 설정
setTimeout(() => {
  goToFinish();
}, SONG_DURATION * 1000);

function showJudgment(type, arrowElement) {
  const judgment = document.createElement("div");
  judgment.className = `judgment ${type.toLowerCase()}`;
  judgment.textContent = type;
  document.body.appendChild(judgment);

  // 기존 판정 텍스트가 있다면 제거
  const existingJudgments = document.querySelectorAll(".judgment");
  existingJudgments.forEach((j) => {
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
  if (success) {
    combo++;
    if (combo > maxCombo) maxCombo = combo;
  } else {
    combo = 0;
  }
  $("#combo").text(`COMBO: ${combo}`);
  if (success) showComboPopup();
}

// 미스 판정 로직도 시간 기반으로 수정
function handleMissedArrow(arrow) {
  const marker = $(`#${arrow.data("type")} .marker`)[0];
  const arrowRect = arrow[0].getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  const timingDiff = arrowRect.top - markerRect.top;

  // 판정 구간을 완전히 지나간 경우에만 미스 처리
  if (timingDiff < -80) {
    updateHP(-20);
    showJudgment("MISS", arrow[0]);
    updateCombo(false);
    miss++;
    arrow.remove();
    return true;
  }
  return false;
}

// 화살표 감시 시스템 추가
const arrowMonitors = new Map(); // 모니터링 인터벌 관리를 위한 Map

function startArrowMonitoring(arrowId, arrowType) {
  const checkInterval = setInterval(() => {
    const arrow = $(`#${arrowId}`);
    if (arrow.length) {
      if (handleMissedArrow(arrow)) {
        clearInterval(checkInterval);
        arrowMonitors.delete(arrowId);
      }
    } else {
      clearInterval(checkInterval);
      arrowMonitors.delete(arrowId);
    }
  }, 16); // 약 60fps로 체크

  arrowMonitors.set(arrowId, checkInterval);
}

// 화살표 그룹 관리를 위한 Map 추가
const arrowGroups = new Map(); // key: timestamp, value: arrow ids

function createArrowGroup(timestamp, arrowIds) {
  arrowGroups.set(timestamp, arrowIds);
}

// judgeArrow function을 이전 버전으로 복원
function judgeArrow(arrowType) {
  const arrows = $(`.fallingArrows[data-type="${arrowType}"]`);
  if (arrows.length === 0) return;

  // 가장 가까운 화살표 찾기
  let closestArrow = null;
  let minDiff = Infinity;

  arrows.each(function () {
    const arrow = $(this);
    const marker = $(`#${arrowType} .marker`)[0];
    const arrowRect = this.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();
    const timingDiff = Math.abs(arrowRect.top - markerRect.top);

    if (timingDiff < minDiff) {
      minDiff = timingDiff;
      closestArrow = arrow;
    }
  });

  if (!closestArrow || minDiff > 100) return; // 너무 멀리 있는 화살표는 무시

  // 판정
  if (minDiff < 20) {
    score += 150;
    updateHP(5);
    showJudgment("PERFECT", closestArrow[0]);
    updateCombo(true);
    perfect++;
    console.log("PERFECT");
  } else if (minDiff < 40) {
    score += 100;
    updateHP(3);
    showJudgment("GREAT", closestArrow[0]);
    updateCombo(true);
    great++;
    console.log("GREAT");
  } else if (minDiff < 60) {
    score += 50;
    showJudgment("GOOD", closestArrow[0]);
    updateCombo(true);
    good++;
    console.log("GOOD");
  } else if (minDiff < 80) {
    updateHP(-5);
    showJudgment("BAD", closestArrow[0]);
    updateCombo(false);
    bad++;
    console.log("BAD");
  } else {
    updateHP(-10);
    showJudgment("MISS", closestArrow[0]);
    updateCombo(false);
    miss++;
    console.log("MISS");
  }

  $("#score").text("Score: " + score);

  // 화살표 제거
  const arrowId = closestArrow.attr("id");
  clearInterval(arrowMonitors.get(arrowId));
  arrowMonitors.delete(arrowId);
  closestArrow.remove();
}

// 키보드 이벤트 리스너에 마커 활성화 기능만 유지
$(document).keydown(function (event) {
  const arrowType = keyMap[event.key];
  if (arrowType) {
    event.preventDefault();
    $(`#${arrowType} .marker`).addClass("active");
    judgeArrow(arrowType);
  }
});

$(document).keyup(function (event) {
  const arrowType = keyMap[event.key];
  if (arrowType) {
    $(`#${arrowType} .marker`).removeClass("active");
  }
});

// 난이도 변경 이벤트 리스너 추가
document.addEventListener("keydown", (event) => {
  if (event.key === "1") setDifficulty("easy");
  if (event.key === "2") setDifficulty("medium");
  if (event.key === "3") setDifficulty("hard");
});

// 페이지 언로드 시 모든 인터벌 정리
window.addEventListener("beforeunload", () => {
  arrowMonitors.forEach((interval) => clearInterval(interval));
});

// Key mapping
const keyMap = {
  ArrowLeft: "ul",
  ArrowDown: "dl",
  " ": "center", // Space key
  ArrowUp: "ur",
  ArrowRight: "dr",
};

// Add keyboard event listener - 이전 버전으로 복원
$(document).keydown(function (event) {
  const arrowType = keyMap[event.key];
  if (arrowType) {
    event.preventDefault();
    judgeArrow(arrowType);
  }
});

// 키 입력 처리 개선
let lastKeyPressTime = {};

$(document).keydown(function (event) {
  const arrowType = keyMap[event.key];
  if (!arrowType) return;

  event.preventDefault();

  // 키 입력 중복 방지 (0.1초)
  const currentTime = Date.now();
  if (currentTime - (lastKeyPressTime[arrowType] || 0) < 100) return;

  lastKeyPressTime[arrowType] = currentTime;
  judgeArrow(arrowType);
});

// 화살표 생성 로직 수정
function createArrow(arrowType) {
  const id = `arrow_${beat++}`;
  const arrow =
    $(`<img class="fallingArrows" id="${id}" data-type="${arrowType}" 
        src="Assets/${arrowType.toUpperCase()}.png" width="70%">`);

  // 애니메이션 종료 시 자동 삭제
  arrow.on("animationend", function () {
    updateHP(-20);
    showJudgment("MISS", this);
    updateCombo(false);
    miss++;
    removeArrow($(this));
  });

  $(`#${arrowType}`).append(arrow);
}

// 화살표 생성
// Object.entries(sheet).forEach(([time, arrows]) => { // Remove this
//   setTimeout(() => {
//     arrows.forEach((arrowType) => createArrow(arrowType));
//   }, parseFloat(time) * 1000);
// });

// 화살표 제거 함수 추가
function removeArrow(arrow) {
  if (!arrow || !arrow.length) return;

  const arrowId = arrow.attr("id");
  if (arrowMonitors.has(arrowId)) {
    clearInterval(arrowMonitors.get(arrowId));
    arrowMonitors.delete(arrowId);
  }

  // DOM에서 완전히 제거
  arrow.remove();
}

function createArrow(arrowType) {
  const id = `arrow_${beat++}`;
  const arrow =
    $(`<img class="fallingArrows" id="${id}" data-type="${arrowType}" 
      src="Assets/${arrowType.toUpperCase()}.png" width="70%">`);

  $(`#${arrowType}`).append(arrow);

  // 화살표 자동 삭제 시간 단축
  setTimeout(() => {
    const existingArrow = $(`#${id}`);
    if (existingArrow.length) {
      updateHP(-20);
      showJudgment("MISS", existingArrow[0]);
      updateCombo(false);
      removeArrow(existingArrow);
    }
  }, 1999);
}

function isArrowInJudgmentZone(arrow, marker) {
  const arrowRect = arrow[0].getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  const timingDiff = arrowRect.top - markerRect.top;

  // 판정 구간: 마커 위치 기준 위아래 80px
  return Math.abs(timingDiff) <= 80;
}

function getClosestArrowInJudgmentZone(arrowType) {
  const arrows = $(`.fallingArrows[data-type="${arrowType}"]`);
  const marker = $(`#${arrowType} .marker`)[0];
  let closestArrow = null;
  let minDiff = Infinity;

  arrows.each(function () {
    const arrow = $(this);
    if (isArrowInJudgmentZone(arrow, marker)) {
      const timingDiff = Math.abs(
        arrow[0].getBoundingClientRect().top -
          marker.getBoundingClientRect().top
      );
      if (timingDiff < minDiff) {
        minDiff = timingDiff;
        closestArrow = arrow;
      }
    }
  });

  return closestArrow ? { arrow: closestArrow, diff: minDiff } : null;
}

document.addEventListener("DOMContentLoaded", async () => {
  // Get selected song data from sessionStorage
  const selectedSong = JSON.parse(sessionStorage.getItem("selectedSong"));

  if (!selectedSong) {
    window.location.href = "index.html";
    return;
  }

  // Fetch full song data including sheet from songList.json
  try {
    const response = await fetch("/songList.json");
    const songList = await response.json();
    const songData = songList[selectedSong.title];

    if (!songData) {
      throw new Error("Song data not found");
    }

    // Set up YouTube iframe
    const videoFrame = document.getElementById("myVideo");
    videoFrame.src = `https://www.youtube.com/embed/${selectedSong.url}?autoplay=1&controls=0`;

    // Set difficulty
    currentDifficulty = selectedSong.difficulty;
    document.getElementById(
      "difficulty"
    ).textContent = `Difficulty: ${selectedSong.difficulty.toUpperCase()}`;

    // Clear existing arrows
    Object.keys(keyMap).forEach((key) => {
      $(`#${keyMap[key]}`).find(".fallingArrows").remove();
    });

    // Create arrows based on sheet data
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
      }, seconds * 1000);
    });
  } catch (error) {
    console.error("Error loading song data:", error);
    alert("Error loading song data. Returning to song selection.");
    window.location.href = "index.html";
  }
});
