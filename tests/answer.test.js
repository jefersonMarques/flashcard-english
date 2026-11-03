import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAnswer, normalizeAnswer } from "../src/answer.js";

const cases = [
  ["I'm working on", "I am working on..."],
  ["I'll have to", "I will have to..."],
  ["I  had to !", "I had to..."],
  ["I’m trying to", "I'm trying to..."]
];

for (const [answer, reference] of cases) {
  test(`accepts ${answer}`, () => {
    assert.equal(evaluateAnswer(answer, reference).correct, true);
  });
}

test("rejects a different phrase", () => {
  assert.equal(evaluateAnswer("I want to", "I need to...").correct, false);
});

test("normalizes whitespace and punctuation", () => {
  assert.equal(normalizeAnswer(" I had   to... "), "i had to");
});
