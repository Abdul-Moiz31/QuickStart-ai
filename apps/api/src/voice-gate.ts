import { PLAN_LIMITS, type PlanTier } from "@quickstart-ai/shared";

export type VoiceGateResult =
  | { allowed: true }
  | { allowed: false; code: "PLAN_UPGRADE_REQUIRED" | "PLAN_LIMIT_EXCEEDED"; reason: string };

/** Whether a project on `plan` may transcribe one more voice clip today, given `todayCount` already used. */
export function checkVoiceGate(plan: PlanTier, todayCount: number): VoiceGateResult {
  const dailyLimit = PLAN_LIMITS[plan].voiceTranscriptionsPerDay;
  if (dailyLimit <= 0) {
    return {
      allowed: false,
      code: "PLAN_UPGRADE_REQUIRED",
      reason: "Voice mode isn't available on the free plan. Upgrade to enable it.",
    };
  }
  if (todayCount >= dailyLimit) {
    return {
      allowed: false,
      code: "PLAN_LIMIT_EXCEEDED",
      reason: `Daily limit of ${dailyLimit} voice messages reached for your ${plan} plan. Upgrade or wait until tomorrow.`,
    };
  }
  return { allowed: true };
}
