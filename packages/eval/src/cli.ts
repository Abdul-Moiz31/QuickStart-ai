#!/usr/bin/env node
import { runEval, SAMPLE_GOLDEN_SET } from "./metrics.js";

async function main() {
  const summary = await runEval(SAMPLE_GOLDEN_SET, async (c) => ({
    answer: c.expected,
    contexts: c.contexts ?? [c.expected],
  }));

  console.log(
    JSON.stringify(
      {
        ok: summary.faithfulness >= 0.3 && summary.answerRelevancy >= 0.2,
        ...summary,
        results: summary.results.map((r) => ({
          id: r.id,
          faithfulness: Number(r.faithfulness.toFixed(3)),
          answerRelevancy: Number(r.answerRelevancy.toFixed(3)),
          contextRelevance: Number(r.contextRelevance.toFixed(3)),
          latencyMs: r.latencyMs,
        })),
      },
      null,
      2,
    ),
  );

  if (summary.faithfulness < 0.3) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
