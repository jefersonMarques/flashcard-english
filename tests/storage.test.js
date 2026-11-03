import test from "node:test";
import assert from "node:assert/strict";
import { cleanNavigation, cleanProgress, parseBackup } from "../src/storage.js";

test("keeps valid progress and discards unknown chunk ids", () => {
  assert.deepEqual(cleanProgress({ "present-01": "mastered", "unknown": "learning", "present-02": "bad" }), {
    "present-01": "mastered"
  });
});

test("preserves legacy navigation positions", () => {
  const navigation = cleanNavigation({
    mode: "writing",
    positions: { "study:all": "past-05", "writing:study:all": "future-12" }
  });
  assert.equal(navigation.positions["study:all"], "past-05");
  assert.equal(navigation.positions["writing:study:all"], "future-12");
});

test("rejects backups from another application", () => {
  assert.throws(() => parseBackup(JSON.stringify({ app: "invalid", version: 1, data: {} })));
});
