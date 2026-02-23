// --- Konami Code Easter Egg ---
const konamiSequence = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
let konamiIndex = 0;

document.addEventListener("keydown", (e) => {
  if (e.key === konamiSequence[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiSequence.length) {
      triggerKonami();
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }
});

function triggerKonami() {
  const images = document.querySelectorAll(
    ".card-image, .card-image-placeholder",
  );
  images.forEach((img) => {
    img.style.transition = "transform 0.3s ease";
    img.style.transform = "rotate(360deg)";
    img.style.animation = "spinCard 1s linear infinite";
  });

  setTimeout(() => {
    images.forEach((img) => {
      img.style.animation = "";
      img.style.transform = "";
    });
  }, 5000);
}
