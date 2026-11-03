const contractions = [
  [/\bi['’]m\b/g, "i am"],
  [/\bi['’]ll\b/g, "i will"],
  [/\bi['’]d\b/g, "i would"],
  [/\bi['’]ve\b/g, "i have"],
  [/\byou['’]re\b/g, "you are"],
  [/\bwe['’]re\b/g, "we are"],
  [/\bthey['’]re\b/g, "they are"],
  [/\bit['’]s\b/g, "it is"],
  [/\bwon['’]t\b/g, "will not"],
  [/\bcan['’]t\b/g, "cannot"],
  [/\bdon['’]t\b/g, "do not"],
  [/\bdidn['’]t\b/g, "did not"],
  [/\bcouldn['’]t\b/g, "could not"],
  [/\bwouldn['’]t\b/g, "would not"],
  [/\bshouldn['’]t\b/g, "should not"],
  [/\bgonna\b/g, "going to"]
];

export function normalizeAnswer(value) {
  let normalized = value.normalize("NFKC").toLowerCase().replace(/[‘’`]/g, "'");

  for (const [pattern, expansion] of contractions) {
    normalized = normalized.replace(pattern, expansion);
  }

  return normalized.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function evaluateAnswer(answer, expected) {
  return {
    answer,
    correct: normalizeAnswer(answer) === normalizeAnswer(expected)
  };
}
