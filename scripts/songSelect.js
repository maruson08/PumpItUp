class SongSelectManager {
  constructor() {
    this.currentSongIndex = -1;
    this.isSelectingDifficulty = false;
    this.currentDifficultyIndex = 0;
    this.allSongsData = {};
    
    this.loadSongList = this.loadSongList.bind(this);
    
    this.init();
  }

  async init() {
    await this.loadSongList();
  }



  updateSelectedSong(songItems) {
    songItems.forEach((item, index) => {
        if (index === this.currentSongIndex) {
            item.classList.add("selected");
        } else {
            item.classList.remove("selected");
        }
    });
  }

  updateRankingDisplay(title, difficulty = "easy") {
    const rankKey = "pumpItUpRanks";
    const allRanks = JSON.parse(localStorage.getItem(rankKey) || "{}");
    const key = `${title}|${difficulty}`;
    const songRanks = allRanks[key] || [];
    
    const rankList = document.getElementById("main-rank-list");
    if (!rankList) return;

    rankList.innerHTML = "";
    
    const boardTitle = document.querySelector("#ranking-board h3");
    if (boardTitle) boardTitle.innerHTML = `Top 5 <br> ${title} [${difficulty.toUpperCase()}]`;

    if (songRanks.length === 0) {
      rankList.innerHTML = "<li style='text-align:center; color:#888;'>No records yet</li>";
      return;
    }

    songRanks.sort((a, b) => b.score - a.score);
    
    songRanks.slice(0, 5).forEach((rank, index) => { 
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="rank-num">#${index + 1}</span>
        <span class="rank-name">${rank.name}</span>
        <span class="rank-score">${rank.score.toLocaleString()}</span>
      `;
      rankList.appendChild(li);
    });
  }

  updateDifficultySelection() {
    const difficultyButtons = document.querySelectorAll(".difficulty-select button");
    difficultyButtons.forEach((button, index) => {
      if (index === this.currentDifficultyIndex) {
        button.classList.add("selected");
        
        // Update ranking when difficulty changes
        const selectedSong = document.querySelector(".song-item.selected");
        if (selectedSong) {
            const songTitle = selectedSong.querySelector("h3").textContent;
            const difficulty = button.dataset.difficulty;
            this.updateRankingDisplay(songTitle, difficulty);
        }
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
      
      // Select first song initially to show rankings
      const firstSongTitle = Object.keys(this.allSongsData)[0];
      if (firstSongTitle) {
         this.selectSong(firstSongTitle, this.allSongsData[firstSongTitle]);
      }

      this.setupDifficultyButtons();
    } catch (error) {
      console.error("Error loading song list:", error);
    }
  }

  selectSong(title, songData) {
    const titleElem = document.getElementById("selected-song-title");
    if(titleElem) titleElem.textContent = title;

    // Get current difficulty
    const difficultyButtons = document.querySelectorAll(".difficulty-select button");
    const currentDiffBtn = difficultyButtons[this.currentDifficultyIndex];
    const difficulty = currentDiffBtn ? currentDiffBtn.dataset.difficulty : "easy";

    // Update Rankings for this song
    this.updateRankingDisplay(title, difficulty);

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
    
    // Show start button
    const startBtn = document.getElementById("start-game-btn");
    if(startBtn) {
        startBtn.style.display = "block";
        startBtn.onclick = () => this.startGame();
    }

    const songItems = document.querySelectorAll(".song-item");
    this.currentSongIndex = Array.from(songItems).findIndex(
      (item) => item.querySelector("h3").textContent === title
    );
    this.updateSelectedSong(songItems);
  }

  setupDifficultyButtons() {
      document.querySelectorAll(".difficulty-select button").forEach((button, index) => {
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        newButton.addEventListener("click", () => {
          // Update current index for keyboard sync
          this.currentDifficultyIndex = index;
          this.updateDifficultySelection(); // This will trigger rank update
        });
      });
  }

  startGame() {
      const selectedSong = document.querySelector(".song-item.selected");
      if (!selectedSong) {
        alert("Please select a song first!");
        return;
      }
  
      const songTitle = document.getElementById("selected-song-title").textContent;
      
      const difficultyButtons = document.querySelectorAll(".difficulty-select button");
      const currentDiffBtn = difficultyButtons[this.currentDifficultyIndex];
      const difficulty = currentDiffBtn ? currentDiffBtn.dataset.difficulty : "medium";
      
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
  }
}

document.addEventListener("DOMContentLoaded", () => {
    new SongSelectManager();
});
