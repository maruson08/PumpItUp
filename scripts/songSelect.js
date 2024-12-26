async function loadSongList() {
  try {
    const response = await fetch("/songList.json");
    const songs = await response.json();
    const songListContainer = document.querySelector(".song-list");

    Object.entries(songs).forEach(([title, data]) => {
      const songElement = document.createElement("div");
      songElement.className = "song-item";
      songElement.innerHTML = `
                <h3>${title}</h3>
                <p>Tabbed by: ${data.tabbedBy}</p>
            `;

      songElement.addEventListener("click", () => selectSong(title, data));
      songListContainer.appendChild(songElement);
    });
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
