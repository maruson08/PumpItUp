let currentSongIndex = -1;
let isSelectingDifficulty = false;
let currentDifficultyIndex = 0;

function handleKeyPress(event) {
  if (isSelectingDifficulty) {
    handleDifficultySelection(event);
  } else {
    handleSongSelection(event);
  }
}

function handleSongSelection(event) {
  const songItems = document.querySelectorAll(".song-item");
  if (songItems.length === 0) return;

  switch (event.key) {
    case "1": // 위로 이동
    case "7":
      currentSongIndex = Math.max(0, currentSongIndex - 1);
      updateSelectedSong(songItems);
      break;
    case "5": // 곡 선택 및 난이도 선택 모드로 전환
      if (currentSongIndex >= 0) {
        const selectedSongElement = songItems[currentSongIndex];
        const title = selectedSongElement.querySelector("h3").textContent;
        const songData = allSongsData[title];
        selectSong(title, songData);
        isSelectingDifficulty = true;
        currentDifficultyIndex = 0;
        updateDifficultySelection();
      }
      break;
    case "3": // 아래로 이동
    case "9":
      currentSongIndex = Math.min(songItems.length - 1, currentSongIndex + 1);
      updateSelectedSong(songItems);
      break;
  }
}

function handleDifficultySelection(event) {
  const difficultyButtons = document.querySelectorAll(
    ".difficulty-select button"
  );

  switch (event.key) {
    case "1": // 난이도 선택 취소
    case "7":
      isSelectingDifficulty = false;
      difficultyButtons.forEach((btn) => btn.classList.remove("selected"));
      break;
    case "3": // 다음 난이도
    case "9":
      currentDifficultyIndex =
        (currentDifficultyIndex + 1) % difficultyButtons.length;
      updateDifficultySelection();
      break;
    case "5": // 난이도 선택 확정
      const selectedButton = document.querySelectorAll(
        ".difficulty-select button"
      )[currentDifficultyIndex];
      if (selectedButton) {
        selectedButton.click();
      }
      break;
  }
}

function updateDifficultySelection() {
  const difficultyButtons = document.querySelectorAll(
    ".difficulty-select button"
  );
  difficultyButtons.forEach((button, index) => {
    if (index === currentDifficultyIndex) {
      button.classList.add("selected");
    } else {
      button.classList.remove("selected");
    }
  });
}

let allSongsData = {};

async function loadSongList() {
  try {
    const response = await fetch("/songList.json");
    allSongsData = await response.json();
    const songListContainer = document.querySelector(".song-list");

    Object.entries(allSongsData).forEach(([title, data]) => {
      const songElement = document.createElement("div");
      songElement.className = "song-item";
      songElement.innerHTML = `
                <h3>${title}</h3>
                <p>Tabbed by: ${data.tabbedBy}</p>
            `;

      songElement.addEventListener("click", () => selectSong(title, data));
      songListContainer.appendChild(songElement);
    });

    // 첫 번째 곡을 기본 선택
    currentSongIndex = 0;
    updateSelectedSong(document.querySelectorAll(".song-item"));

    // 키보드 이벤트 리스너 추가
    document.addEventListener("keydown", handleKeyPress);
  } catch (error) {
    console.error("Error loading song list:", error);
  }
}

function selectSong(title, songData) {
  // Update song preview section
  document.getElementById("selected-song-title").textContent = title;

  // Create/Update YouTube preview
  const previewContainer = document.querySelector(".song-preview");
  let previewFrame = document.getElementById("song-preview-frame");

  if (!previewFrame) {
    previewFrame = document.createElement("iframe");
    previewFrame.id = "song-preview-frame";
    previewFrame.width = "100%";
    previewFrame.height = "200";
    previewFrame.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    previewFrame.allowFullscreen = true;
    previewContainer.insertBefore(
      previewFrame,
      document.querySelector(".difficulty-select")
    );
  }

  previewFrame.src = `https://www.youtube.com/embed/${songData.url}?autoplay=1&controls=0`;

  // Show difficulty buttons
  document.querySelector(".difficulty-select").style.display = "flex";

  // Remove 'selected' class from all songs
  document.querySelectorAll(".song-item").forEach((item) => {
    item.classList.remove("selected");
  });

  // Add 'selected' class to clicked song
  event.currentTarget.classList.add("selected");

  // 현재 선택된 곡의 인덱스 업데이트
  const songItems = document.querySelectorAll(".song-item");
  currentSongIndex = Array.from(songItems).findIndex(
    (item) => item.querySelector("h3").textContent === title
  );
}

// Add difficulty selection handlers
document.querySelectorAll(".difficulty-select button").forEach((button) => {
  button.addEventListener("click", () => {
    const selectedSong = document.querySelector(".song-item.selected");
    if (!selectedSong) {
      alert("Please select a song first!");
      return;
    }

    const songTitle = document.getElementById(
      "selected-song-title"
    ).textContent;
    const difficulty = button.dataset.difficulty;

    // Store selected song data in sessionStorage
    sessionStorage.setItem(
      "selectedSong",
      JSON.stringify({
        title: songTitle,
        url: document
          .querySelector("#song-preview-frame")
          .src.split("embed/")[1]
          .split("?")[0],
        difficulty: difficulty,
      })
    );

    // Navigate to game page
    window.location.href = "game.html";
  });
});

// Initialize song list when DOM is loaded
document.addEventListener("DOMContentLoaded", loadSongList);
