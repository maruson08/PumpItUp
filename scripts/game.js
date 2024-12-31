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
const keyMap = {
  7: "ul",
  1: "dl",
  5: "center",
  9: "ur",
  3: "dr",
};

// Judgement Zone by difficulty
const difficultySettings = {
  easy: {
    perfect: { timing: 30, overlap: 80 },
    great: { timing: 45, overlap: 65 },
    good: { timing: 60, overlap: 50 },
    bad: { timing: 75, overlap: 35 },
    missThreshold: 80,
  },
  medium: {
    perfect: { timing: 20, overlap: 85 },
    great: { timing: 35, overlap: 70 },
    good: { timing: 50, overlap: 55 },
    bad: { timing: 65, overlap: 40 },
    missThreshold: 70,
  },
  hard: {
    perfect: { timing: 10, overlap: 95 },
    great: { timing: 20, overlap: 85 },
    good: { timing: 30, overlap: 70 },
    bad: { timing: 40, overlap: 50 },
    missThreshold: 45,
  },
};

let currentDifficulty = "eazy";

function setDifficulty(difficulty) {
  currentDifficulty = difficulty;
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

function updateHP(change) {
  return;
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

function showJudgment(type, arrowElement) {
  const judgment = document.createElement("div");
  judgment.className = `judgment ${type.toLowerCase()}`;
  judgment.textContent = type;
  document.body.appendChild(judgment);

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

// Time-based arrow judgment system
function handleMissedArrow(arrow) {
  const marker = $(`#${arrow.data("type")} .marker`)[0];
  const arrowRect = arrow[0].getBoundingClientRect();
  const markerRect = marker.getBoundingClientRect();
  const timingDiff = arrowRect.top - markerRect.top;

  // Judgmen Zone : 80px updown from maker position
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

const arrowMonitors = new Map(); // Map for arrow monitoring intervals

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
  }, 16); // Check every 16ms

  arrowMonitors.set(arrowId, checkInterval);
}

// Map for arrow groups
const arrowGroups = new Map(); // key: timestamp, value: arrow ids

function createArrowGroup(timestamp, arrowIds) {
  arrowGroups.set(timestamp, arrowIds);
}

function judgeArrow(arrowType) {
  const arrows = $(`.fallingArrows[data-type="${arrowType}"]`);
  if (arrows.length === 0) return;

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

  if (!closestArrow || minDiff > 100) return;

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
    3;
    updateHP(-10);
    showJudgment("MISS", closestArrow[0]);
    updateCombo(false);
    miss++;
    console.log("MISS");
  }

  $("#score").text("Score: " + score);

  // remove arrow
  const arrowId = closestArrow.attr("id");
  clearInterval(arrowMonitors.get(arrowId));
  arrowMonitors.delete(arrowId);
  closestArrow.remove();
}
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

// Add keyboard event listener for difficulty setting
document.addEventListener("keydown", (event) => {
  if (event.key === "1") setDifficulty("easy");
  if (event.key === "2") setDifficulty("medium");
  if (event.key === "3") setDifficulty("hard");
});

// Clear all arrow monitoring intervals when leaving the page
window.addEventListener("beforeunload", () => {
  arrowMonitors.forEach((interval) => clearInterval(interval));
});

// Add keyboard event listener
$(document).keydown(function (event) {
  const arrowType = keyMap[event.key];
  if (arrowType) {
    event.preventDefault();
    judgeArrow(arrowType);
  }
});

// Add keyboard event listener
let lastKeyPressTime = {};

$(document).keydown(function (event) {
  const arrowType = keyMap[event.key];
  if (!arrowType) return;

  event.preventDefault();

  // Prevent multiple keypresses within 100ms
  const currentTime = Date.now();
  if (currentTime - (lastKeyPressTime[arrowType] || 0) < 100) return;

  lastKeyPressTime[arrowType] = currentTime;
  judgeArrow(arrowType);
});

// Add arrow creation function
function createArrow(arrowType) {
  const id = `arrow_${beat++}`;
  const arrow =
    $(`<img class="fallingArrows" id="${id}" data-type="${arrowType}" 
        src="Assets/${arrowType.toUpperCase()}.png" width="70%">`);

  // Event listener for arrow animation end
  arrow.on("animationend", function () {
    updateHP(-20);
    showJudgment("MISS", this);
    updateCombo(false);
    miss++;
    removeArrow($(this));
  });

  $(`#${arrowType}`).append(arrow);
}

function removeArrow(arrow) {
  if (!arrow || !arrow.length) return;

  const arrowId = arrow.attr("id");
  if (arrowMonitors.has(arrowId)) {
    clearInterval(arrowMonitors.get(arrowId));
    arrowMonitors.delete(arrowId);
  }

  arrow.remove();
}

function createArrow(arrowType) {
  const id = `arrow_${beat++}`;
  const arrow =
    $(`<img class="fallingArrows" id="${id}" data-type="${arrowType}" 
      src="Assets/${arrowType.toUpperCase()}.png" width="70%">`);

  $(`#${arrowType}`).append(arrow);

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

  // Judgmen Zone : 80px updown from maker position
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

    // Set end song timer to songData.duration + 5 seconds
    setTimeout(() => {
      goToFinish();
    }, songData.duration * 1000 + 5000);
  } catch (error) {
    console.error("Error loading song data:", error);
    alert("Error loading song data. Returning to song selection.");
    window.location.href = "index.html";
  }
});
