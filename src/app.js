import { chunks } from "./chunks.js";
import { evaluateAnswer } from "./answer.js";
import {
  STORAGE_KEYS,
  loadStudyData,
  makeBackup,
  parseBackup,
  saveStudyData,
  writeJson
} from "./storage.js";

const tenseLabels = { present: "Present", past: "Past", future: "Future" };
const statusLabels = { mastered: "Dominado", learning: "Não dominado", new: "Não avaliado" };
const chunkOrder = new Map(chunks.map((chunk, index) => [chunk.id, index]));
const elements = Object.fromEntries(
  [
    "homeScreen", "studyScreen", "libraryScreen", "overallCaption",
    "homeRecognitionPercent", "homeRecognitionBar", "homeRecognitionStats",
    "homeWritingPercent", "homeWritingBar", "homeWritingStats",
    "recognitionResume", "writingResume", "openLibrary", "studyBack",
    "emptyBack", "libraryBack", "studyEmpty", "flashcardContainer",
    "flashcardGrid", "revealButton", "answerPanel", "frontLanguage",
    "frontText", "frontTense", "swipeHintLeft", "swipeHintRight",
    "backHeading", "readingAnswerContent", "translationText", "exampleText",
    "exampleTranslation", "backTense", "writingForm", "writingInput",
    "checkAnswerButton", "writingResult", "retryWritingButton",
    "libraryMode", "libraryStatus", "libraryTense", "librarySearch",
    "libraryCount", "libraryList", "libraryEmpty", "exportProgress",
    "importProgress", "backupFeedback", "swipeTutorial", "dismissSwipeTutorial"
  ].map((id) => [id, document.getElementById(id)])
);

const state = {
  ...loadStudyData(),
  screen: "home",
  mode: "recognition",
  filter: "study",
  tense: "all",
  index: 0,
  revealed: false,
  transitioning: false,
  pointer: null,
  suppressClick: false,
  history: [],
  swipeTutorialSeen: localStorage.getItem("englishChunks:swipeTutorial:v1") === "seen"
};

function activeProgress() {
  return state[state.mode];
}

function statusOf(chunk, mode = state.mode) {
  return state[mode][chunk.id] || "new";
}

function getViewKey() {
  const key = `${state.filter}:${state.tense}`;
  return state.mode === "writing" ? `writing:${key}` : key;
}

function filteredChunks() {
  return chunks.filter((chunk) => {
    if (state.tense !== "all" && state.tense !== chunk.tense) {
      return false;
    }

    const status = statusOf(chunk);
    return state.filter === "all"
      || (state.filter === "study" && status !== "mastered")
      || (state.filter === "learning" && status === "learning")
      || (state.filter === "mastered" && status === "mastered");
  });
}

function currentChunk() {
  return filteredChunks()[state.index] || null;
}

function findResumeIndex(cards, cardId) {
  if (!cards.length) {
    return 0;
  }

  const exactIndex = cards.findIndex((chunk) => chunk.id === cardId);
  if (exactIndex !== -1) {
    return exactIndex;
  }

  const previousOrder = chunkOrder.get(cardId);
  if (previousOrder === undefined) {
    return 0;
  }

  const nextIndex = cards.findIndex((chunk) => chunkOrder.get(chunk.id) > previousOrder);
  return nextIndex === -1 ? 0 : nextIndex;
}

function restorePosition() {
  state.index = findResumeIndex(filteredChunks(), state.navigation.positions[getViewKey()]);
}

function saveNavigation() {
  const current = currentChunk();
  if (current) {
    state.navigation.positions[getViewKey()] = current.id;
  }

  state.navigation.mode = state.mode;
  state.navigation.filter = state.filter;
  state.navigation.tense = state.tense;
  state.navigation.selections[state.mode] = {
    filter: state.filter,
    tense: state.tense
  };

  writeJson(STORAGE_KEYS.navigation, state.navigation);
}

function saveModeProgress() {
  const key = state.mode === "writing" ? STORAGE_KEYS.writing : STORAGE_KEYS.recognition;
  writeJson(key, activeProgress());
}

function getCounts(mode) {
  const progress = state[mode];
  const mastered = Object.values(progress).filter((status) => status === "mastered").length;
  const learning = Object.values(progress).filter((status) => status === "learning").length;
  const fresh = chunks.length - mastered - learning;
  return { mastered, learning, fresh, percent: Math.round(mastered / chunks.length * 100) };
}

function renderHome() {
  for (const mode of ["recognition", "writing"]) {
    const counts = getCounts(mode);
    const label = mode === "recognition" ? "Recognition" : "Writing";
    elements[`home${label}Percent`].textContent = `${counts.percent}%`;
    elements[`home${label}Bar`].style.width = `${counts.percent}%`;
    elements[`home${label}Stats`].textContent = `${counts.mastered} dominados · ${counts.learning} em revisão · ${counts.fresh} novos`;

    const savedId = state.navigation.positions[mode === "writing" ? "writing:study:all" : "study:all"];
    const resumeIndex = findResumeIndex(chunks, savedId);
    elements[`${mode}Resume`].textContent = savedId
      ? `Continuar estudo · ${resumeIndex + 1} / ${chunks.length}`
      : "Começar estudo";
  }
  elements.overallCaption.textContent = `${chunks.length} chunks em cada modo`;
}

function setRevealed(visible) {
  state.revealed = visible;
  elements.flashcardContainer.classList.toggle("is-expanded", visible);
  elements.flashcardGrid.classList.toggle("is-revealed", visible);
  elements.answerPanel.classList.toggle("opacity-100", visible);
  elements.answerPanel.classList.toggle("opacity-0", !visible);
  elements.answerPanel.classList.toggle("translate-y-0", visible);
  elements.answerPanel.classList.toggle("translate-y-3", !visible);
  elements.answerPanel.classList.toggle("md:translate-x-0", visible);
  elements.answerPanel.classList.toggle("md:translate-x-3", !visible);
  elements.answerPanel.toggleAttribute("inert", !visible);
  elements.answerPanel.setAttribute("aria-hidden", String(!visible));
  elements.revealButton.setAttribute("aria-expanded", String(visible));
  elements.revealButton.setAttribute("aria-label", visible ? "Ocultar segundo cartão" : "Mostrar segundo cartão");
}

function resetWritingForm() {
  elements.writingInput.value = "";
  elements.writingInput.disabled = false;
  elements.writingResult.hidden = true;
  elements.writingResult.textContent = "";
  elements.checkAnswerButton.hidden = false;
  elements.retryWritingButton.hidden = true;
}

function renderStudy() {
  const chunk = currentChunk();
  elements.studyEmpty.hidden = Boolean(chunk);
  elements.flashcardContainer.hidden = !chunk;
  setRevealed(false);

  if (!chunk) {
    return;
  }

  const isWriting = state.mode === "writing";
  elements.frontLanguage.textContent = isWriting ? "Português · toque para responder" : "English";
  elements.frontText.textContent = isWriting ? chunk.translation : chunk.front;
  elements.frontTense.textContent = tenseLabels[chunk.tense];
  elements.backHeading.textContent = isWriting ? "Sua resposta em inglês" : "Tradução + exemplo";
  elements.readingAnswerContent.hidden = isWriting;
  elements.writingForm.hidden = !isWriting;
  elements.translationText.textContent = chunk.translation;
  elements.exampleText.textContent = chunk.example;
  elements.exampleTranslation.textContent = chunk.exampleTranslation;
  elements.backTense.textContent = tenseLabels[chunk.tense];
  resetWritingForm();
}

function dismissSwipeTutorial() {
  elements.swipeTutorial.hidden = true;
  state.swipeTutorialSeen = true;
  try {
    localStorage.setItem("englishChunks:swipeTutorial:v1", "seen");
  } catch {
    // A persistência da orientação é opcional.
  }
}

function showSwipeTutorial() {
  if (!state.swipeTutorialSeen) {
    elements.swipeTutorial.hidden = false;
    elements.dismissSwipeTutorial.focus();
  }
}

function requestImmersiveMode() {
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
  }
}

function leaveImmersiveMode() {
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

function showScreen(name) {
  state.screen = name;
  elements.homeScreen.hidden = name !== "home";
  elements.studyScreen.hidden = name !== "study";
  elements.libraryScreen.hidden = name !== "library";
  document.body.classList.toggle("in-study", name === "study");
  if (name !== "study") {
    elements.swipeTutorial.hidden = true;
    leaveImmersiveMode();
  }
  window.scrollTo({ top: 0, behavior: "instant" });

  if (name === "home") {
    renderHome();
  } else if (name === "study") {
    renderStudy();
    showSwipeTutorial();
  } else {
    renderLibrary();
  }
}

function route() {
  const hash = location.hash.replace(/^#/, "");
  if (hash === "study/recognition" || hash === "study/writing") {
    const requestedMode = hash.split("/")[1];
    if (state.screen !== "study" || state.mode !== requestedMode) {
      state.mode = requestedMode;
      if (!state.enteringFromLibrary) {
        state.filter = "study";
        state.tense = "all";
        restorePosition();
      }
    }
    state.enteringFromLibrary = false;
    showScreen("study");
    return;
  }

  state.enteringFromLibrary = false;
  showScreen(hash === "library" ? "library" : "home");
}

function startMode(mode) {
  if (state.transitioning) {
    return;
  }
  requestImmersiveMode();
  state.mode = mode;
  state.filter = "study";
  state.tense = "all";
  restorePosition();
  saveNavigation();
  location.hash = `study/${mode}`;
  route();
}

function nextChunk() {
  const cards = filteredChunks();
  if (!cards.length || state.transitioning) {
    return;
  }

  state.index = (state.index + 1) % cards.length;
  saveNavigation();
  renderStudy();
  animateEntrance();
}

function animateEntrance() {
  const card = elements.flashcardContainer;
  card.classList.remove("is-entering");
  void card.offsetWidth;
  card.classList.add("is-entering");
}

function classify(status) {
  const card = currentChunk();
  if (!card || state.transitioning || state.screen !== "study") {
    return;
  }

  const before = filteredChunks();
  const nextId = before[(state.index + 1) % before.length]?.id;
  const previousStatus = activeProgress()[card.id] || null;
  state.transitioning = true;
  state.history.push({ cardId: card.id, previousStatus, mode: state.mode, filter: state.filter, tense: state.tense });
  const container = elements.flashcardContainer;
  const startTransform = getComputedStyle(container).transform;
  const startOpacity = Number(getComputedStyle(container).opacity);
  const direction = status === "mastered" ? 1 : -1;
  const exitDistance = direction * (window.innerWidth + container.offsetWidth);
  const exitAngle = direction * 16;

  container.classList.remove("is-entering", "is-dragging", "is-settling");
  const animation = container.animate(
    [
      { transform: startTransform === "none" ? "translate3d(0,0,0)" : startTransform, opacity: startOpacity },
      { transform: `translate3d(${exitDistance}px, -18px, 0) rotate(${exitAngle}deg)`, opacity: 0 }
    ],
    { duration: 240, easing: "cubic-bezier(.2,.7,.25,1)", fill: "forwards" }
  );

  animation.finished.then(() => {
    activeProgress()[card.id] = status;
    saveModeProgress();
    state.index = findResumeIndex(filteredChunks(), nextId);
    saveNavigation();
    animation.cancel();
    container.style.transform = "";
    container.style.opacity = "";
    elements.swipeHintLeft.style.opacity = "0";
    elements.swipeHintRight.style.opacity = "0";
    renderStudy();
    if (currentChunk()) {
      animateEntrance();
    }
    state.transitioning = false;
  }).catch(() => {
    state.transitioning = false;
    resetDrag();
  });
}

function undoClassification() {
  if (!state.history.length || state.transitioning) {
    return;
  }

  const previous = state.history.pop();
  state.mode = previous.mode;
  state.filter = previous.filter;
  state.tense = previous.tense;
  if (previous.previousStatus === null) {
    delete activeProgress()[previous.cardId];
  } else {
    activeProgress()[previous.cardId] = previous.previousStatus;
  }
  saveModeProgress();
  state.index = findResumeIndex(filteredChunks(), previous.cardId);
  saveNavigation();
  renderStudy();
}

function resetDrag() {
  const card = elements.flashcardContainer;
  card.classList.remove("is-dragging");
  card.classList.add("is-settling");
  card.style.transform = "";
  card.style.opacity = "";
  elements.swipeHintLeft.style.opacity = "0";
  elements.swipeHintRight.style.opacity = "0";
}

function onPointerDown(event) {
  if (event.button !== 0 || state.screen !== "study" || state.pointer || state.transitioning || !currentChunk()) {
    return;
  }
  if (event.target instanceof Element && event.target.closest("#writingForm")) {
    return;
  }
  state.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false, dx: 0 };
  try {
    elements.flashcardContainer.setPointerCapture(event.pointerId);
  } catch {
    // A captura é opcional conforme o navegador.
  }
}

function onPointerMove(event) {
  const pointer = state.pointer;
  if (!pointer || pointer.id !== event.pointerId || state.transitioning) {
    return;
  }

  const dx = event.clientX - pointer.x;
  const dy = event.clientY - pointer.y;
  if (!pointer.moved && (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.25)) {
    return;
  }

  pointer.moved = true;
  pointer.dx = dx;
  if (event.cancelable) {
    event.preventDefault();
  }
  elements.flashcardContainer.classList.remove("is-settling", "is-entering");
  elements.flashcardContainer.classList.add("is-dragging");
  elements.flashcardContainer.style.transform = `translate3d(${dx}px, 0, 0) rotate(${dx / 28}deg)`;
  elements.flashcardContainer.style.opacity = String(Math.max(0.65, 1 - Math.abs(dx) / 700));
  elements.swipeHintLeft.style.opacity = dx < 0 ? String(Math.min(1, -dx / 80)) : "0";
  elements.swipeHintRight.style.opacity = dx > 0 ? String(Math.min(1, dx / 80)) : "0";
}

function onPointerUp(event) {
  const pointer = state.pointer;
  if (!pointer || pointer.id !== event.pointerId) {
    return;
  }
  state.pointer = null;
  if (elements.flashcardContainer.hasPointerCapture?.(event.pointerId)) {
    elements.flashcardContainer.releasePointerCapture(event.pointerId);
  }
  if (!pointer.moved) {
    return;
  }

  state.suppressClick = true;
  window.setTimeout(() => { state.suppressClick = false; }, 150);
  const threshold = Math.min(110, elements.flashcardContainer.offsetWidth * 0.22);
  const dx = pointer.dx;
  if (event.type === "pointercancel" || Math.abs(dx) < threshold) {
    resetDrag();
    return;
  }
  classify(dx > 0 ? "mastered" : "learning");
}

function submitWriting(event) {
  event.preventDefault();
  if (state.screen !== "study" || state.mode !== "writing" || state.transitioning) {
    return;
  }

  const chunk = currentChunk();
  const answer = elements.writingInput.value.trim();
  if (!chunk || !answer) {
    elements.writingInput.focus();
    return;
  }

  const result = evaluateAnswer(answer, chunk.front);
  state.attempts[chunk.id] = result;
  writeJson(STORAGE_KEYS.attempts, state.attempts);
  elements.writingResult.hidden = false;
  elements.writingResult.className = "w-full rounded-xl border px-4 py-3 text-sm font-semibold " + (result.correct
    ? "border-[#829c75] bg-[#dce7d3] text-[#31552d]"
    : "border-[#c69389] bg-[#f3ddd8] text-[#803e34]");
  elements.writingResult.textContent = result.correct
    ? "Parabéns, você acertou!"
    : "Infelizmente, está errado.";
  elements.writingInput.disabled = true;
  elements.checkAnswerButton.hidden = true;
  elements.retryWritingButton.hidden = result.correct;
}

function retryWriting() {
  resetWritingForm();
  elements.writingInput.focus();
}

function buildLibraryRow(chunk) {
  const status = statusOf(chunk, elements.libraryMode.value);
  const row = document.createElement("article");
  row.className = "library-row";
  const text = document.createElement("div");
  text.className = "library-row-content";
  const title = document.createElement("strong");
  title.textContent = chunk.front;
  const translation = document.createElement("span");
  translation.textContent = chunk.translation;
  const info = document.createElement("small");
  info.textContent = `${tenseLabels[chunk.tense]} · ${statusLabels[status]}`;
  text.append(title, translation, info);

  const actions = document.createElement("div");
  actions.className = "library-actions";
  const openButton = document.createElement("button");
  openButton.textContent = "Estudar";
  openButton.type = "button";
  openButton.setAttribute("aria-label", `Estudar ${chunk.front}`);
  openButton.addEventListener("click", () => openLibraryCard(chunk));

  const statusButton = document.createElement("button");
  statusButton.type = "button";
  statusButton.textContent = status === "mastered" ? "Revisar" : "Domino";
  statusButton.setAttribute("aria-label", status === "mastered" ? `Marcar ${chunk.front} como não dominado` : `Marcar ${chunk.front} como dominado`);
  statusButton.addEventListener("click", () => {
    const mode = elements.libraryMode.value;
    state[mode][chunk.id] = status === "mastered" ? "learning" : "mastered";
    writeJson(mode === "writing" ? STORAGE_KEYS.writing : STORAGE_KEYS.recognition, state[mode]);
    renderLibrary();
  });

  actions.append(openButton, statusButton);
  row.append(text, actions);
  return row;
}

function renderLibrary() {
  const mode = elements.libraryMode.value;
  const filter = elements.libraryStatus.value;
  const tense = elements.libraryTense.value;
  const search = elements.librarySearch.value.trim().toLocaleLowerCase("pt-BR");
  const filtered = chunks.filter((chunk) => {
    const status = statusOf(chunk, mode);
    const matchesStatus = filter === "all" || status === filter;
    const matchesTense = tense === "all" || chunk.tense === tense;
    const matchesSearch = [chunk.front, chunk.translation, chunk.example, chunk.exampleTranslation]
      .some((value) => value.toLocaleLowerCase("pt-BR").includes(search));
    return matchesStatus && matchesTense && matchesSearch;
  });

  elements.libraryCount.textContent = `${filtered.length} de ${chunks.length} chunks`;
  elements.libraryList.replaceChildren(...filtered.map(buildLibraryRow));
  elements.libraryEmpty.hidden = filtered.length > 0;
}

function openLibraryCard(chunk) {
  state.mode = elements.libraryMode.value;
  state.filter = "all";
  state.tense = "all";
  state.index = chunks.findIndex((item) => item.id === chunk.id);
  state.enteringFromLibrary = true;
  saveNavigation();
  location.hash = `study/${state.mode}`;
  route();
}

function exportProgress() {
  const backup = makeBackup(state);
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "english-chunks-backup.json";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  elements.backupFeedback.textContent = "Backup gerado. Guarde o arquivo em local seguro.";
}

async function importProgress(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  event.target.value = "";

  if (file.size > 256_000) {
    elements.backupFeedback.textContent = "O arquivo é maior que o limite permitido (256 KB).";
    return;
  }

  try {
    const data = parseBackup(await file.text());
    const accepted = window.confirm("Substituir o progresso salvo neste navegador pelo conteúdo do backup?");
    if (!accepted) {
      return;
    }

    if (!saveStudyData(data)) {
      elements.backupFeedback.textContent = "Não foi possível salvar o backup no navegador.";
      return;
    }

    Object.assign(state, data);
    renderLibrary();
    elements.backupFeedback.textContent = "Backup importado com sucesso.";
  } catch {
    elements.backupFeedback.textContent = "Não foi possível importar este backup JSON.";
  }
}

function onKeyDown(event) {
  if (state.screen !== "study" || state.transitioning || !elements.swipeTutorial.hidden) {
    return;
  }
  const target = event.target;
  const isTyping = target instanceof HTMLElement
    && (target.matches("input, textarea, select") || target.isContentEditable);
  if (isTyping || event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    classify("learning");
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    classify("mastered");
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    nextChunk();
  } else if (event.key.toLowerCase() === "z") {
    event.preventDefault();
    undoClassification();
  } else if (event.code === "Space" && !(target instanceof HTMLElement && target.closest("button"))) {
    event.preventDefault();
    setRevealed(!state.revealed);
  } else if (event.key === "Escape") {
    location.hash = "home";
  }
}

for (const button of document.querySelectorAll("[data-start]")) {
  button.addEventListener("click", () => startMode(button.dataset.start));
}

elements.openLibrary.addEventListener("click", () => { location.hash = "library"; });
elements.dismissSwipeTutorial.addEventListener("click", dismissSwipeTutorial);
elements.studyBack.addEventListener("click", () => { location.hash = "home"; });
elements.emptyBack.addEventListener("click", () => { location.hash = "home"; });
elements.libraryBack.addEventListener("click", () => { location.hash = "home"; });
elements.revealButton.addEventListener("click", () => {
  if (state.suppressClick) {
    state.suppressClick = false;
    return;
  }
  if (!state.transitioning) {
    setRevealed(!state.revealed);
  }
});
elements.writingForm.addEventListener("submit", submitWriting);
elements.retryWritingButton.addEventListener("click", retryWriting);
elements.flashcardContainer.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
window.addEventListener("pointercancel", onPointerUp);
window.addEventListener("keydown", onKeyDown);
window.addEventListener("hashchange", route);
for (const id of ["libraryMode", "libraryStatus", "libraryTense", "librarySearch"]) {
  elements[id].addEventListener(id === "librarySearch" ? "input" : "change", renderLibrary);
}
elements.exportProgress.addEventListener("click", exportProgress);
elements.importProgress.addEventListener("change", importProgress);
route();
