import { PLAN_LIMITS, type PlanTier } from "@quickstart-ai/shared";

export type VoiceGateCode =
  | "PLAN_UPGRADE_REQUIRED"
  | "PLAN_LIMIT_EXCEEDED"
  | "VOICE_DISABLED"
  | "CONCURRENT_LIMIT";

export type VoiceGateResult =
  | { allowed: true }
  | { allowed: false; code: VoiceGateCode; reason: string };

/** Whether a project on `plan` may transcribe one more voice clip today. */
export function checkVoiceTranscribeGate(plan: PlanTier, todayCount: number): VoiceGateResult {
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

/** @deprecated Use checkVoiceTranscribeGate */
export const checkVoiceGate = checkVoiceTranscribeGate;

function startOfUtcMonth(): Date {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Sum voice_realtime_minute usage events since the start of the UTC month. */
export function voiceMinutesUsedThisMonth(events: { units: number }[]): number {
  return events.reduce((sum, e) => sum + e.units, 0);
}

export function getVoiceMonthStart(): Date {
  return startOfUtcMonth();
}

/** Whether a project may start another realtime voice session this month. */
export function checkVoiceRealtimeGate(
  plan: PlanTier,
  monthMinutesUsed: number,
  activeSessions: number,
  voiceEnabled: boolean,
): VoiceGateResult {
  if (!voiceEnabled) {
    return {
      allowed: false,
      code: "VOICE_DISABLED",
      reason: "Voice chat is disabled for this project. Enable it in the dashboard.",
    };
  }

  const monthlyLimit = PLAN_LIMITS[plan].voiceMinutesPerMonth;
  if (monthlyLimit <= 0) {
    return {
      allowed: false,
      code: "PLAN_UPGRADE_REQUIRED",
      reason: "Realtime voice isn't available on the free plan. Upgrade to enable it.",
    };
  }

  if (monthMinutesUsed >= monthlyLimit) {
    return {
      allowed: false,
      code: "PLAN_LIMIT_EXCEEDED",
      reason: `Monthly voice limit of ${monthlyLimit} minutes reached for your ${plan} plan.`,
    };
  }

  const concurrentLimit = PLAN_LIMITS[plan].maxConcurrentVoiceSessions;
  if (activeSessions >= concurrentLimit) {
    return {
      allowed: false,
      code: "CONCURRENT_LIMIT",
      reason: "Too many active voice sessions. Please try again in a moment.",
    };
  }

  return { allowed: true };
}
