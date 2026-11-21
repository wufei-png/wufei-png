const researchFigure = document.querySelector("[data-research-reveal]");
const guide = researchFigure.querySelector(".pose-guide");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
let frame = 0;
let previousProgress = -1;

function drawPoseGuide() {
  const context = guide.getContext("2d");
  if (!context) return;

  // These points belong to the illustration's 1536 × 1024 coordinate space.
  const thumb = [[359, 492], [553, 488], [644, 451], [753, 406], [866, 375]];
  const index = [[359, 492], [596, 309], [734, 240], [841, 205], [944, 289]];
  const middle = [[359, 492], [534, 261], [648, 186], [752, 143], [831, 172]];
  const paths = [thumb, index, middle];

  context.strokeStyle = "#c8eee2";
  context.lineWidth = 3.2;
  context.lineJoin = "round";
  for (const path of paths) {
    const [start, ...rest] = path;
    context.beginPath();
    context.moveTo(...start);
    for (const point of rest) context.lineTo(...point);
    context.stroke();
  }

  context.fillStyle = "#b6eadb";
  context.strokeStyle = "#274840";
  context.lineWidth = 1.8;
  for (const point of [thumb[0], ...thumb.slice(1), ...index.slice(1), ...middle.slice(1)]) {
    context.beginPath();
    context.arc(...point, 7.3, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }

  const coverGuide = document.querySelector(".plate-pose-guide");
  coverGuide.getContext("2d")?.drawImage(guide, 0, 0, coverGuide.width, coverGuide.height);
}

function updateResearch() {
  frame = 0;
  if (motionPreference.matches) return;

  const viewport = document.documentElement.clientHeight;
  const top = researchFigure.getBoundingClientRect().top;
  const progress = Math.max(0, Math.min(1, (viewport * 0.91 - top) / (viewport * 0.57)));
  const rounded = Math.round(progress * 1000) / 1000;

  if (rounded !== previousProgress) {
    researchFigure.style.setProperty("--unfold", rounded);
    previousProgress = rounded;
  }
}

function scheduleResearch() {
  if (!frame && !motionPreference.matches) frame = window.requestAnimationFrame(updateResearch);
}

function updateMotionPreference() {
  if (motionPreference.matches) {
    researchFigure.style.removeProperty("--unfold");
    previousProgress = -1;
  } else {
    scheduleResearch();
  }
}

drawPoseGuide();
motionPreference.addEventListener("change", updateMotionPreference);
window.addEventListener("scroll", scheduleResearch, { passive: true });
window.addEventListener("resize", scheduleResearch);
window.addEventListener("pageshow", scheduleResearch);
updateMotionPreference();

const overview = document.querySelector("#overview");
let chapterTransition;

function isPlainClick(event) {
  return !event.defaultPrevented && event.button === 0 &&
    !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

function enterChapter(event, target, sourceArt, targetArt) {
  if (!isPlainClick(event)) return;
  if (!document.startViewTransition || motionPreference.matches) return;

  event.preventDefault();
  const hash = event.currentTarget.hash;
  if (location.hash !== hash) history.pushState(null, "", hash);

  const arrive = () => {
    if (location.hash !== hash) return;
    target.scrollIntoView({ behavior: "instant" });
    target.focus({ preventScroll: true });
    if (frame) window.cancelAnimationFrame(frame);
    updateResearch();
  };

  if (chapterTransition) {
    chapterTransition.skipTransition();
    arrive();
    return;
  }

  document.documentElement.setAttribute("data-chapter-transition", "");
  sourceArt.style.viewTransitionName = "chapter-art";
  chapterTransition = document.startViewTransition(() => {
    sourceArt.style.removeProperty("view-transition-name");
    arrive();
    targetArt.style.viewTransitionName = "chapter-art";
  });

  const clearTransition = () => {
    sourceArt.style.removeProperty("view-transition-name");
    targetArt.style.removeProperty("view-transition-name");
    document.documentElement.removeAttribute("data-chapter-transition");
    chapterTransition = undefined;
  };
  chapterTransition.ready.catch(() => {});
  chapterTransition.finished.then(clearTransition, clearTransition);
}

for (const entry of overview.querySelectorAll(".index-entry")) {
  const chapter = document.getElementById(entry.hash.slice(1));
  const cover = entry.querySelector(".index-plate");
  const chapterArt = chapter.querySelector("[data-chapter-art]");
  entry.addEventListener("click", event => enterChapter(event, chapter, cover, chapterArt));
  chapter.querySelector(".chapter-back").addEventListener("click", event => enterChapter(event, overview, chapterArt, cover));
}

window.addEventListener("popstate", () => chapterTransition?.skipTransition());
motionPreference.addEventListener("change", () => {
  if (motionPreference.matches) chapterTransition?.skipTransition();
});

const filmPoster = document.querySelector("[data-play-film]");
const filmTemplate = document.querySelector("#xiang-yu-player");
const filmProject = filmPoster.closest(".project");
let filmPlayer = null;

function revealFilmProject() {
  if (location.hash === "#ai-mv") filmProject.open = true;
}

window.addEventListener("hashchange", revealFilmProject);
revealFilmProject();

document.querySelector('.chapter-links a[href="#ai-mv"]').addEventListener("click", event => {
  // Open the accordion before fragment navigation measures its position.
  if (isPlainClick(event)) filmProject.open = true;
});

filmPoster.addEventListener("click", event => {
  if (!isPlainClick(event)) return;

  event.preventDefault();
  filmPlayer = filmTemplate.content.firstElementChild.cloneNode(true);
  filmPoster.replaceWith(filmPlayer);
  filmPlayer.focus({ preventScroll: true });
});

filmProject.addEventListener("toggle", () => {
  if (filmProject.open || !filmPlayer) return;

  filmPlayer.replaceWith(filmPoster);
  filmPlayer = null;
});

const wideProjects = window.matchMedia("(min-width: 53rem)");
for (const project of document.querySelectorAll(".project")) {
  const summary = project.querySelector("summary");
  const select = () => {
    if (wideProjects.matches) project.open = true;
  };

  summary.addEventListener("focus", select);
  summary.addEventListener("pointerenter", event => {
    if (event.pointerType === "mouse" && !filmPlayer) select();
  });
  summary.addEventListener("click", event => {
    if (wideProjects.matches) {
      event.preventDefault();
      select();
    }
  });
}

if ("IntersectionObserver" in window) {
  const observeChange = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observeChange.unobserve(entry.target);
      }
    }
  }, { threshold: 0.32 });

  for (const contribution of document.querySelectorAll("[data-contribution]")) {
    observeChange.observe(contribution);
  }
}
