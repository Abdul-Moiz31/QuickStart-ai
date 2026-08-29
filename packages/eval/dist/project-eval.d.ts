import { computeEvalReadiness } from "@quickstart-ai/shared";
import { runEval } from "./metrics.js";
export type EvalProgress = {
    current: number;
    total: number;
    message: string;
    phase: "starting" | "evaluating" | "scoring" | "done";
};
export type EvalJobResult = {
    passed: boolean;
    passRate: number;
    reasons: string[];
    productionReady: boolean;
    readiness: ReturnType<typeof computeEvalReadiness>;
    summary: Awaited<ReturnType<typeof runEval>>;
};
export declare function executeProjectEval(runId: string, projectId: string): Promise<EvalJobResult>;
//# sourceMappingURL=project-eval.d.ts.map