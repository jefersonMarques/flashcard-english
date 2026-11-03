import { chunks } from "./chunks.js";
import { topics } from "./topics.js";

export const STORAGE_KEYS = Object.freeze({
  recognition: "english_chunks_progress_v1",
  writing: "english_chunks_written_progress_v1",
  attempts: "english_chunks_written_attempts_v1",
  navigation: "english_chunks_navigation_v1"
});

const allowedIds = new Set(chunks.map((chunk) => chunk.id));
const allowedStatuses = new Set(["mastered", "learning"]);
const allowedModes = new Set(["recognition", "writing"]);
const allowedFilters = new Set(["study", "learning", "mastered", "all"]);
const allowedTenses = new Set(["all", "present", "past", "future"]);
const allowedTopics = new Set(["all", ...topics.map((topic) => topic.id)]);

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function cleanProgress(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([id, status]) => allowedIds.has(id) && allowedStatuses.has(status))
  );
}

export function cleanAttempts(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(([id, attempt]) =>
      allowedIds.has(id)
      && attempt
      && typeof attempt === "object"
      && typeof attempt.correct === "boolean"
      && typeof attempt.answer === "string"
    )
  );
}

export function cleanNavigation(value) {
  const navigation = {
    filter: "study",
    tense: "all",
    mode: "recognition",
    positions: {},
    topics: { recognition: "all", writing: "all" },
    selections: {
      recognition: { filter: "study", tense: "all" },
      writing: { filter: "study", tense: "all" }
    }
  };

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return navigation;
  }

  navigation.filter = allowedFilters.has(value.filter) ? value.filter : "study";
  navigation.tense = allowedTenses.has(value.tense) ? value.tense : "all";
  navigation.mode = allowedModes.has(value.mode) ? value.mode : "recognition";
  for (const mode of allowedModes) {
    navigation.topics[mode] = allowedTopics.has(value.topics?.[mode]) ? value.topics[mode] : "all";
  }

  const oldRecognition = value.selections?.recognition;
  navigation.selections.recognition = {
    filter: allowedFilters.has(oldRecognition?.filter) ? oldRecognition.filter : navigation.filter,
    tense: allowedTenses.has(oldRecognition?.tense) ? oldRecognition.tense : navigation.tense
  };

  const oldWriting = value.selections?.writing;
  navigation.selections.writing = {
    filter: allowedFilters.has(oldWriting?.filter) ? oldWriting.filter : "study",
    tense: allowedTenses.has(oldWriting?.tense) ? oldWriting.tense : "all"
  };

  if (value.positions && typeof value.positions === "object" && !Array.isArray(value.positions)) {
    for (const [key, id] of Object.entries(value.positions)) {
      if (allowedIds.has(id) && /^(topic:[a-z]+:)?(writing:)?(study|learning|mastered|all):(all|present|past|future)$/.test(key)) {
        navigation.positions[key] = id;
      }
    }
  }

  return navigation;
}

export function loadStudyData() {
  return {
    recognition: cleanProgress(readJson(STORAGE_KEYS.recognition)),
    writing: cleanProgress(readJson(STORAGE_KEYS.writing)),
    attempts: cleanAttempts(readJson(STORAGE_KEYS.attempts)),
    navigation: cleanNavigation(readJson(STORAGE_KEYS.navigation))
  };
}

export function saveStudyData(data) {
  return Object.entries(STORAGE_KEYS).every(([name, key]) => writeJson(key, data[name]));
}

export function makeBackup(data) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: "flashcard-english",
    data: {
      recognition: data.recognition,
      writing: data.writing,
      attempts: data.attempts,
      navigation: data.navigation
    }
  };
}

export function parseBackup(raw) {
  const backup = JSON.parse(raw);
  if (backup?.app !== "flashcard-english" || backup?.version !== 1 || !backup.data) {
    throw new Error("Este arquivo não é um backup válido do aplicativo.");
  }

  return {
    recognition: cleanProgress(backup.data.recognition),
    writing: cleanProgress(backup.data.writing),
    attempts: cleanAttempts(backup.data.attempts),
    navigation: cleanNavigation(backup.data.navigation)
  };
}
