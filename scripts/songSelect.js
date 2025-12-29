class SongSelectManager {
  constructor() {
    this.currentSongIndex = -1;
    this.isSelectingDifficulty = false;
    this.currentDifficultyIndex = 0;
    this.allSongsData = {};
    
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.loadSongList = this.loadSongList.bind(this);
    
    this.init();
  }

  async init() {
    await this.loadSongList();
    document.addEventListener("keydown", this.handleKeyPress);
  }

  handleKeyPress(event) {
    if (this.isSelectingDifficulty) {
      this.handleDifficultySelection(event);
    } else {
      this.handleSongSelection(event);
    }
  }

  handleSongSelection(event) {
    const songItems = document.querySelectorAll(".song-item");
    if (songItems.length === 0) return;

    switch (event.key) {
      case "1":
      case "7":
        this.currentSongIndex = Math.max(0, this.currentSongIndex - 1);
        this.updateSelectedSong(songItems);
        break;
      case "5":
        if (this.currentSongIndex >= 0) {
          const selectedSongElement = songItems[this.currentSongIndex];
          const title = selectedSongElement.querySelector("h3").textContent;
          const songData = this.allSongsData[title];
          this.selectSong(title, songData);
          this.isSelectingDifficulty = true;
          this.currentDifficultyIndex = 0;
          this.updateDifficultySelection();
        }
        break;
      case "3":
      case "9":
        this.currentSongIndex = Math.min(songItems.length - 1, this.currentSongIndex + 1);
        this.updateSelectedSong(songItems);
        break;
    }
  }

  handleDifficultySelection(event) {
    const difficultyButtons = document.querySelectorAll(".difficulty-select button");

    switch (event.key) {
      case "1":
      case "7":
        this.isSelectingDifficulty = false;
        difficultyButtons.forEach((btn) => btn.classList.remove("selected"));
        break;
      case "3":
      case "9":
        this.currentDifficultyIndex = (this.currentDifficultyIndex + 1) % difficultyButtons.length;
        this.updateDifficultySelection();
        break;
      case "5":
        const selectedButton = difficultyButtons[this.currentDifficultyIndex];
        if (selectedButton) {
          selectedButton.click();
        }
        break;
    }
  }

  updateSelectedSong(songItems) {
    songItems.forEach((item, index) => {
        if (index === this.currentSongIndex) {
            item.classList.add("selected");
            item.scrollIntoView({ block: "center", behavior: "smooth" });
        } else {
            item.classList.remove("selected");
        }
    });
  }

  updateDifficultySelection() {
    const difficultyButtons = document.querySelectorAll(".difficulty-select button");
    difficultyButtons.forEach((button, index) => {
      if (index === this.currentDifficultyIndex) {
        button.classList.add("selected");
      } else {
        button.classList.remove("selected");
      }
    });
  }

  async loadSongList() {
    try {
      const response = await fetch("/songList.json");
      this.allSongsData = await response.json();
      const songListContainer = document.querySelector(".song-list");
      songListContainer.innerHTML = '';

      Object.entries(this.allSongsData).forEach(([title, data]) => {
        const songElement = document.createElement("div");
        songElement.className = "song-item";
        songElement.innerHTML = `
                  <h3>${title}</h3>
                  <p>Tabbed by: ${data.tabbedBy}</p>
              `;

        songElement.addEventListener("click", () => this.selectSong(title, data));
        songListContainer.appendChild(songElement);
      });

      this.currentSongIndex = 0;
      this.updateSelectedSong(document.querySelectorAll(".song-item"));

      this.setupDifficultyButtons();
    } catch (error) {
      console.error("Error loading song list:", error);
    }
  }

  selectSong(title, songData) {
    const titleElem = document.getElementById("selected-song-title");
    if(titleElem) titleElem.textContent = title;

    const previewContainer = document.querySelector(".song-preview");
    let previewFrame = document.getElementById("song-preview-frame");

    if (!previewFrame) {
      previewFrame = document.createElement("iframe");
      previewFrame.id = "song-preview-frame";
      previewFrame.width = "100%";
      previewFrame.height = "200";
      previewFrame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      previewFrame.allowFullscreen = true;
      previewContainer.insertBefore(previewFrame, document.querySelector(".difficulty-select"));
    }

    if(songData && songData.url) {
        previewFrame.src = `https://www.youtube.com/embed/${songData.url}?autoplay=1&controls=0`;
    }

    document.querySelector(".difficulty-select").style.display = "flex";

    const songItems = document.querySelectorAll(".song-item");
    this.currentSongIndex = Array.from(songItems).findIndex(
      (item) => item.querySelector("h3").textContent === title
    );
    this.updateSelectedSong(songItems);
  }

  setupDifficultyButtons() {
      document.querySelectorAll(".difficulty-select button").forEach((button) => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener("click", () => {
          const selectedSong = document.querySelector(".song-item.selected");
          if (!selectedSong) {
            alert("Please select a song first!");
            return;
          }
      
          const songTitle = document.getElementById("selected-song-title").textContent;
          const difficulty = newButton.dataset.difficulty;
          const previewFrame = document.querySelector("#song-preview-frame");
          let urlId = "";
          
          if(previewFrame && previewFrame.src) {
              try {
                  urlId = previewFrame.src.split("embed/")[1].split("?")[0];
              } catch(e) {
                  console.error("Error parsing URL", e);
              }
          }

          sessionStorage.setItem(
            "selectedSong",
            JSON.stringify({
              title: songTitle,
              url: urlId,
              difficulty: difficulty,
            })
          );
      
          window.location.href = "game.html";
        });
      });
  }
}

document.addEventListener("DOMContentLoaded", () => {
    new SongSelectManager();
});
