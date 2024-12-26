document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.getElementById("intro-animation").classList.add("hidden");
    document.getElementById("game-content").classList.remove("hidden");
  }, 3000); // Show intro for 3 seconds
});
