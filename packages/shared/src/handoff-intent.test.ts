import { describe, expect, it } from "vitest";
import {
  looksLikeGibberish,
  looksLikeHandoffOffer,
  visitorRequestsHumanHelp,
} from "./handoff-intent.js";

describe("visitorRequestsHumanHelp", () => {
  it("detects explicit human requests", () => {
    expect(visitorRequestsHumanHelp("I want to talk to a human")).toBe(true);
    expect(visitorRequestsHumanHelp("Please connect me with support")).toBe(true);
    expect(visitorRequestsHumanHelp("forward my request to the team")).toBe(true);
  });

  it("ignores normal questions", () => {
    expect(visitorRequestsHumanHelp("What are your business hours?")).toBe(false);
  });
});

describe("looksLikeHandoffOffer", () => {
  it("detects claimed forwards to the team", () => {
    expect(looksLikeHandoffOffer("I've forwarded your request to the team.")).toBe(true);
    expect(looksLikeHandoffOffer("Someone from our support team will join shortly.")).toBe(true);
  });
});

describe("looksLikeGibberish", () => {
  it("flags keyboard mash", () => {
    expect(looksLikeGibberish("asdfghjkl")).toBe(true);
    expect(looksLikeGibberish("aaaaaaa")).toBe(true);
  });

  it("allows real questions", () => {
    expect(looksLikeGibberish("What are your hours?")).toBe(false);
    expect(looksLikeGibberish("I need help with billing")).toBe(false);
  });
});
