import assert from "node:assert/strict";
import { isGapExcludedUserMessage, shouldExcludeFromGaps } from "./gap-intent.js";

const excluded = [
  "Hi",
  "Hii",
  "hello",
  "yes please",
  "thanks",
  "Nah I want to talk you",
  "I want to contact support team",
  "please connect me to a human",
];

for (const msg of excluded) {
  assert.equal(isGapExcludedUserMessage(msg), true, `expected excluded: ${msg}`);
}

const included = [
  "what are hidden charges please tell me ?",
  "Do you offer white-label pricing for agencies",
  "please provide instructions how to setup bot ?",
];

for (const msg of included) {
  assert.equal(isGapExcludedUserMessage(msg), false, `expected included: ${msg}`);
}

assert.equal(
  shouldExcludeFromGaps("hidden charges?", { events: ["human.handoff.requested"] }),
  true,
);

console.log("gap-intent tests passed");
