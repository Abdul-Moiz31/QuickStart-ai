import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChatRequestError,
  QuickStartClient,
  resolveWidgetSurface,
  TriggerEngine,
  type ChatMessage,
  type ProactiveTriggersConfig,
  type WidgetTheme,
} from "@quickstart-ai/widget-core";
import { looksLikeHandoffOffer, visitorRequestsHumanHelp } from "@quickstart-ai/shared";
import { useRealtimeVoice } from "./useRealtimeVoice.js";
import { VoiceChatBar } from "./VoiceChatBar.js";
import type { VoiceTranscriptEvent } from "@quickstart-ai/voice-core";
import {
  applyVoiceTranscript,
  finalizeVoiceTranscripts,
  isDuplicateWelcome,
  type VoiceTurnIndexes,
} from "./voice-transcript.js";

export interface ChatBotProps {
  clientId: string;
  apiUrl?: string;
  theme?: WidgetTheme;
  position?: "left" | "right";
  primaryColor?: string;
  /** @deprecated use clientId */
  token?: string;
}

const INK = "#0A0A0A";
const CLAY = "#F7F5F1";

const markdownStyles = `
.qs-widget-fab,
.qs-widget-panel,
.qs-widget-panel * {
  box-sizing: border-box;
}
.qs-md {
  font-size: 13px;
  line-height: 1.55;
  word-break: break-word;
  overflow-wrap: anywhere;
  max-width: 100%;
}
.qs-md p { margin: 0 0 0.5em; }
.qs-md p:last-child { margin-bottom: 0; }
.qs-md ul, .qs-md ol {
  margin: 0.35em 0 0.5em;
  padding-left: 0.35em;
  list-style-position: inside;
}
.qs-md ul {
  list-style-type: disc;
}
.qs-md ol {
  list-style-type: decimal;
}
.qs-md li {
  margin: 0.2em 0;
  display: list-item;
}
.qs-md li > p { margin: 0; }
.qs-md strong { font-weight: 600; }
.qs-md a { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
.qs-md code {
  font-size: 0.86em;
  padding: 0.12em 0.4em;
  border-radius: 5px;
  background: rgba(10,10,10,0.07);
  font-family: "JetBrains Mono", ui-monospace, monospace;
  word-break: break-all;
}
.qs-md pre {
  margin: 0.45em 0 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #0f172a;
  color: #e2e8f0;
  overflow-x: auto;
  max-width: 100%;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
.qs-md pre code {
  background: transparent;
  padding: 0;
  color: inherit;
  font-size: inherit;
  word-break: break-word;
}
.qs-widget-bubble {
  min-width: 0;
  max-width: 88%;
  overflow-x: hidden;
}
.qs-widget-bubble--user {
  border-radius: 18px 18px 4px 18px;
  padding: 10px 14px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
}
.qs-widget-bubble--assistant {
  border-radius: 18px 18px 18px 4px;
  padding: 10px 14px;
  border: 1px solid rgba(10,10,10,0.07);
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(10,10,10,0.04);
}
.qs-widget-bubble--agent {
  border-radius: 18px 18px 18px 4px;
  padding: 10px 14px;
  border: 1px solid rgba(10,10,10,0.12);
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(10,10,10,0.04);
}
.qs-handoff-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-width: 88%;
  min-width: 0;
}
.qs-handoff-btn {
  border: none;
  border-radius: 9999px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  transition: opacity 0.15s ease;
}
.qs-handoff-btn:disabled {
  cursor: default;
  opacity: 0.65;
}
.qs-handoff-status {
  font-size: 12px;
  color: #5C5A56;
  padding: 0 2px;
}
.qs-agent-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  margin-bottom: 4px;
  color: #5C5A56;
}
.qs-human-banner {
  align-self: center;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  background: rgba(10,10,10,0.06);
  color: rgba(10,10,10,0.62);
}
.qs-session-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  align-self: center;
  width: 100%;
  padding: 6px 0;
}
.qs-session-divider::before,
.qs-session-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: rgba(10,10,10,0.12);
}
.qs-session-divider span {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #5C5A56;
  white-space: nowrap;
}
.qs-widget-fab {
  position: fixed;
  bottom: max(16px, env(safe-area-inset-bottom, 0px));
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 28px rgba(10,10,10,0.2);
  z-index: 99999;
  touch-action: manipulation;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.qs-widget-fab:hover {
  transform: scale(1.04);
  box-shadow: 0 10px 32px rgba(10,10,10,0.24);
}
.qs-widget-fab--right {
  right: max(16px, env(safe-area-inset-right, 0px));
}
.qs-widget-fab--left {
  left: max(16px, env(safe-area-inset-left, 0px));
}
.qs-widget-panel {
  position: fixed;
  z-index: 99999;
  display: none;
  flex-direction: column;
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 20px 50px rgba(10,10,10,0.16), 0 0 0 1px rgba(10,10,10,0.06);
  font-family: Outfit, "DM Sans", system-ui, sans-serif;
  width: min(380px, calc(100vw - 32px));
  height: min(
    540px,
    calc(100dvh - 96px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))
  );
  max-height: calc(
    100dvh - 96px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
  );
  bottom: calc(56px + 16px + env(safe-area-inset-bottom, 0px));
}
.qs-widget-panel--open {
  display: flex;
}
.qs-widget-panel--right {
  right: max(16px, env(safe-area-inset-right, 0px));
}
.qs-widget-panel--left {
  left: max(16px, env(safe-area-inset-left, 0px));
}
.qs-widget-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: #ffffff;
  border-bottom: 1px solid rgba(10,10,10,0.06);
  flex-shrink: 0;
}
.qs-widget-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  background: ${CLAY};
}
.qs-widget-input-row {
  display: flex;
  gap: 8px;
  padding: 12px 14px 14px;
  background: #ffffff;
  flex-shrink: 0;
  transition: opacity 0.48s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.48s cubic-bezier(0.4, 0, 0.2, 1),
    max-height 0.48s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.48s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 88px;
  opacity: 1;
  transform: translateY(0);
}
.qs-widget-composer {
  position: relative;
  flex-shrink: 0;
  background: #ffffff;
  border-top: 1px solid rgba(10,10,10,0.06);
  padding-bottom: max(22px, calc(10px + env(safe-area-inset-bottom, 0px)));
}
.qs-widget-composer--voice .qs-widget-input-row {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  transform: translateY(10px);
  overflow: hidden;
  pointer-events: none;
  border-top-color: transparent;
}
.qs-widget-voice-dock {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transform: translateY(16px);
  transition: opacity 0.48s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.48s cubic-bezier(0.4, 0, 0.2, 1),
    max-height 0.48s cubic-bezier(0.4, 0, 0.2, 1),
    padding 0.48s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0 14px;
}
.qs-widget-composer--voice .qs-widget-voice-dock {
  max-height: 56px;
  opacity: 1;
  transform: translateY(0);
  padding: 10px 14px 8px;
}
.qs-widget-composer-banner {
  padding: 0 14px 8px;
}
.qs-widget-composer-banner .qs-voice-error {
  margin: 0;
}
@media (prefers-reduced-motion: reduce) {
  .qs-widget-input-row,
  .qs-widget-voice-dock {
    transition: none;
  }
}
.qs-widget-input-row input {
  min-width: 0;
  flex: 1;
}
.qs-widget-start-form {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  overflow-y: auto;
}
.qs-widget-start-form input,
.qs-widget-input-row input {
  width: 100%;
}
@media (max-width: 480px) {
  .qs-widget-fab {
    width: 52px;
    height: 52px;
    bottom: max(12px, env(safe-area-inset-bottom, 0px));
  }
  .qs-widget-fab--right {
    right: max(12px, env(safe-area-inset-right, 0px));
  }
  .qs-widget-fab--left {
    left: max(12px, env(safe-area-inset-left, 0px));
  }
  .qs-widget-panel,
  .qs-widget-panel--right,
  .qs-widget-panel--left {
    left: max(12px, env(safe-area-inset-left, 0px));
    right: max(12px, env(safe-area-inset-right, 0px));
    width: auto;
    bottom: calc(52px + 12px + env(safe-area-inset-bottom, 0px));
    height: min(
      520px,
      calc(100dvh - 76px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))
    );
    max-height: calc(
      100dvh - 76px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)
    );
    border-radius: 16px;
  }
  .qs-widget-header {
    padding: 14px 16px;
  }
  .qs-widget-messages {
    padding: 12px 14px;
  }
  .qs-widget-input-row {
    padding: 10px 12px 10px;
    gap: 6px;
  }
  .qs-widget-composer {
    padding-bottom: max(18px, calc(8px + env(safe-area-inset-bottom, 0px)));
  }
  .qs-widget-input-row input,
  .qs-widget-start-form input {
    font-size: 16px;
  }
  .qs-widget-start-form {
    padding: 16px;
  }
  .qs-widget-bubble {
    max-width: 92%;
  }
}
@media (max-width: 360px) {
  .qs-widget-send-label {
    display: none;
  }
  .qs-widget-send-btn {
    min-width: 44px;
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
}
@keyframes qs-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
  30% { transform: translateY(-3px); opacity: 1; }
}
@keyframes qs-rec-pulse {
  0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5); }
  70% { box-shadow: 0 0 0 7px rgba(220, 38, 38, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}
@keyframes qs-transcribe-dot {
  0%, 80%, 100% { opacity: 0.28; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
}
.qs-widget-mic-btn--recording {
  animation: qs-rec-pulse 1.4s ease-out infinite;
}
.qs-transcribe-dots {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 18px;
  height: 18px;
}
.qs-transcribe-dots span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  animation: qs-transcribe-dot 0.9s ease-in-out infinite;
}
.qs-transcribe-dots span:nth-child(2) { animation-delay: 0.12s; }
.qs-transcribe-dots span:nth-child(3) { animation-delay: 0.24s; }
@keyframes qs-voice-strip-natural {
  0%, 100% {
    transform: scaleY(calc(var(--bar-min, 0.12) * var(--bar-env, 1)));
    opacity: calc(0.22 + var(--bar-env, 0.5) * 0.25);
  }
  40% {
    transform: scaleY(calc((var(--bar-min, 0.12) + var(--bar-max, 0.75)) * 0.5 * var(--bar-env, 1)));
    opacity: calc(0.35 + var(--bar-env, 0.5) * 0.35);
  }
  65% {
    transform: scaleY(calc(var(--bar-max, 0.75) * var(--bar-env, 1)));
    opacity: calc(0.45 + var(--bar-env, 0.5) * 0.5);
  }
  82% {
    transform: scaleY(calc((var(--bar-min, 0.12) + var(--bar-max, 0.75)) * 0.42 * var(--bar-env, 1)));
    opacity: calc(0.28 + var(--bar-env, 0.5) * 0.3);
  }
}
@keyframes qs-voice-dot-idle {
  0%, 100% { opacity: 0.22; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(1.35); }
}
.qs-voice-wave-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 100%;
  height: 26px;
  min-width: 0;
  flex: 1;
  -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%);
}
.qs-voice-wave-strip__bar {
  flex: 1 1 0;
  min-width: 2px;
  max-width: 3px;
  height: 100%;
  border-radius: 999px;
  background: #0A0A0A;
  transform-origin: center center;
  transform: scaleY(calc(var(--bar-min, 0.12) * var(--bar-env, 1)));
  opacity: calc(0.2 + var(--bar-env, 0.5) * 0.28);
  will-change: transform, opacity;
}
.qs-voice-wave-strip__bar--dot {
  flex: 0 0 3px;
  min-width: 3px;
  max-width: 3px;
  height: 3px;
  align-self: center;
  border-radius: 50%;
  transform: none;
  opacity: 0.28;
}
.qs-voice-wave-strip--active:not(.qs-voice-wave-strip--mic) .qs-voice-wave-strip__bar:not(.qs-voice-wave-strip__bar--dot) {
  animation: qs-voice-strip-natural var(--bar-dur, 1.2s) ease-in-out infinite;
}
.qs-voice-wave-strip--active:not(.qs-voice-wave-strip--mic) .qs-voice-wave-strip__bar--dot {
  animation: qs-voice-dot-idle calc(var(--bar-dur, 1.2s) * 1.4) ease-in-out infinite;
}
.qs-voice-wave-strip--mic .qs-voice-wave-strip__bar:not(.qs-voice-wave-strip__bar--dot) {
  animation: none;
  transition: transform 0.08s ease-out, opacity 0.1s ease-out;
}
.qs-voice-wave-strip--mic .qs-voice-wave-strip__bar--dot {
  animation: none;
  transition: opacity 0.1s ease-out, transform 0.1s ease-out;
}
.qs-voice-wave-strip--speaking:not(.qs-voice-wave-strip--mic) .qs-voice-wave-strip__bar:not(.qs-voice-wave-strip__bar--dot) {
  animation-duration: calc(var(--bar-dur, 1.2s) * 0.68);
}
@media (prefers-reduced-motion: reduce) {
  .qs-voice-wave-strip__bar { animation: none !important; transform: scaleY(0.4); opacity: 0.5; }
}
.qs-voice-wave-status {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
.qs-voice-bar-wrap {
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding-top: 4px;
}
.qs-voice-bar-wrap--inline {
  margin-top: auto;
}
.qs-voice-bar-wrap--dock {
  margin-top: 0;
  padding-top: 0;
  width: 100%;
}
.qs-voice-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.qs-voice-icon-btn:hover:not(:disabled) {
  transform: scale(1.04);
}
.qs-voice-icon-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.qs-voice-start-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: auto;
  max-width: 100%;
  margin: 0;
  padding: 7px 14px 7px 8px;
  border-radius: 999px;
  border: 1px solid rgba(10,10,10,0.1);
  background: #ffffff;
  color: #0A0A0A;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
  box-shadow: 0 1px 2px rgba(10,10,10,0.04);
  white-space: nowrap;
}
.qs-voice-start-btn:hover:not(:disabled) {
  background: #F7F5F1;
  border-color: rgba(10,10,10,0.16);
  box-shadow: 0 2px 6px rgba(10,10,10,0.06);
}
.qs-voice-start-btn:active:not(:disabled) {
  transform: scale(0.98);
}
.qs-voice-start-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.qs-voice-start-btn__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  flex-shrink: 0;
}
.qs-voice-start-btn__text {
  line-height: 1;
  padding-right: 2px;
}
.qs-voice-active-dock {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 7px 7px 7px 14px;
  border-radius: 999px;
  border: 1px solid rgba(10,10,10,0.08);
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(10,10,10,0.04);
}
.qs-voice-active-dock__strip {
  flex: 1;
  min-width: 0;
}
.qs-voice-stop-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(220, 38, 38, 0.28);
  cursor: pointer;
  flex-shrink: 0;
  color: #DC2626;
  background: #FEF2F2;
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}
.qs-voice-stop-btn:hover {
  transform: scale(1.03);
  background: #FEE2E2;
  border-color: rgba(220, 38, 38, 0.45);
  color: #B91C1C;
}
.qs-voice-stop-btn:active {
  transform: scale(0.97);
  background: #FECACA;
}
.qs-widget-bubble--streaming {
  box-shadow: 0 0 0 1px rgba(10,10,10,0.06);
}
.qs-voice-error {
  margin: 0;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(220, 38, 38, 0.2);
  background: #FEF2F2;
  color: #991B1B;
  font-size: 12px;
  line-height: 1.45;
  text-align: center;
}
`;

function MessageCircleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7.9 20A9 9 0 1 0 4 16.1L2 22l5.9-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WidgetIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

function SpeakerOnIcon() {
  return (
    <WidgetIcon>
      <path
        d="M11 5L6 9H3v6h3l5 4V5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 8.5a4.5 4.5 0 0 1 0 7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M18.5 5.5a8.5 8.5 0 0 1 0 13"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </WidgetIcon>
  );
}

function SpeakerOffIcon() {
  return (
    <WidgetIcon>
      <path
        d="M11 5L6 9H3v6h3l5 4V5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 9l5 5M21 9l-5 5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </WidgetIcon>
  );
}

/** Studio mic on stand — matches widget stroke style. */
function MicStandIcon() {
  return (
    <WidgetIcon>
      <rect
        x="9"
        y="2"
        width="6"
        height="11"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <path
        d="M5 11a7 7 0 0 0 14 0"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M12 18v3M8 21h8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </WidgetIcon>
  );
}

function StopRecordingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" fill="currentColor" />
    </svg>
  );
}

function TranscribingIcon() {
  return (
    <span className="qs-transcribe-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function StreamingTail() {
  return (
    <span className="qs-transcribe-dots" aria-hidden="true" style={{ marginLeft: 6 }}>
      <span />
      <span />
      <span />
    </span>
  );
}

function projectInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "QS";
}

type SessionDividerKind = "team_joined" | "team_left";

type WidgetMessage =
  | ChatMessage
  | { role: "divider"; kind: SessionDividerKind };

function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="qs-md" style={{ color: INK }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function SessionDivider({ kind }: { kind: SessionDividerKind }) {
  const label = kind === "team_joined" ? "Team joined" : "Team left";
  return (
    <div className="qs-session-divider" role="separator" aria-label={label}>
      <span>{label}</span>
    </div>
  );
}

function shouldAppendSessionDivider(messages: WidgetMessage[], kind: SessionDividerKind): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg?.role !== "divider") continue;
    return msg.kind !== kind;
  }
  return kind === "team_joined";
}

function appendSessionDivider(messages: WidgetMessage[], kind: SessionDividerKind): WidgetMessage[] {
  if (!shouldAppendSessionDivider(messages, kind)) return messages;
  return [...messages, { role: "divider", kind }];
}

function TypingIndicator() {
  return (
    <div
      className="qs-widget-bubble qs-widget-bubble--assistant"
      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "12px 16px" }}
      aria-label="Assistant is typing"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#5C5A56",
            animation: "qs-bounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

export function ChatBot({
  clientId,
  apiUrl = "http://localhost:3100",
  theme = "primary",
  position = "right",
  primaryColor: primaryColorProp,
  token,
}: ChatBotProps) {
  const id = clientId || token || "";
  const [resolvedTheme, setResolvedTheme] = useState<WidgetTheme>(theme);
  const [resolvedPrimary, setResolvedPrimary] = useState(primaryColorProp);
  const [resolvedPosition, setResolvedPosition] = useState(position);

  const client = useMemo(
    () =>
      new QuickStartClient({
        clientId: id,
        apiUrl,
        theme: resolvedTheme,
        position: resolvedPosition,
        primaryColor: resolvedPrimary,
      }),
    [id, apiUrl, resolvedTheme, resolvedPosition, resolvedPrimary],
  );
  const surface = useMemo(
    () => resolveWidgetSurface(resolvedTheme, resolvedPrimary),
    [resolvedTheme, resolvedPrimary],
  );

  const [open, setOpen] = useState(false);
  const [allowAnonymous, setAllowAnonymous] = useState(false);
  const [started, setStarted] = useState(false);
  const [projectName, setProjectName] = useState("QuickStart AI");
  const [proactiveTriggers, setProactiveTriggers] = useState<ProactiveTriggersConfig | null>(null);
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);
  const [proactivePhase, setProactivePhase] = useState<"question" | "details" | null>(null);
  const [proactiveEngaged, setProactiveEngaged] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<WidgetMessage[]>([
    { role: "assistant", content: "Hi! How can I help you today?" },
  ]);
  const [humanActive, setHumanActive] = useState(false);
  const [handoffPending, setHandoffPending] = useState(false);
  const [handoffBusy, setHandoffBusy] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const [voiceRealtimeEnabled, setVoiceRealtimeEnabled] = useState(false);
  const [voiceFallbackMode, setVoiceFallbackMode] = useState<"transcribe" | "text_only">("transcribe");
  const endRef = useRef<HTMLDivElement>(null);
  const agentTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingPing = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const sessionIdRef = useRef("");
  const humanActiveRef = useRef(false);
  const loadingRef = useRef(false);
  const voiceTurnRef = useRef<VoiceTurnIndexes>({ userIdx: null, assistantIdx: null });
  const voicePersistedRef = useRef<Set<string>>(new Set());

  const mergeChatMessages = useCallback((prev: WidgetMessage[], chatMessages: ChatMessage[]) => {
    if (!prev.some((m) => m.role === "divider")) return chatMessages;
    const out: WidgetMessage[] = [];
    let chatIdx = 0;
    for (const m of prev) {
      if (m.role === "divider") {
        out.push(m);
      } else if (chatIdx < chatMessages.length) {
        out.push(chatMessages[chatIdx]!);
        chatIdx += 1;
      }
    }
    while (chatIdx < chatMessages.length) {
      out.push(chatMessages[chatIdx]!);
      chatIdx += 1;
    }
    return out;
  }, []);

  const handleVoiceTranscript = useCallback(
    (event: VoiceTranscriptEvent) => {
      setMessages((prev) => {
        const chatOnly = prev.filter((m): m is ChatMessage => m.role !== "divider");
        if (event.role === "assistant" && isDuplicateWelcome(chatOnly, event.text)) {
          return prev;
        }
        const result = applyVoiceTranscript(chatOnly, event, voiceTurnRef.current);
        voiceTurnRef.current = result.turn;
        return mergeChatMessages(prev, result.messages);
      });
    },
    [mergeChatMessages],
  );

  const finalizeVoiceMessages = useCallback(() => {
    setMessages((prev) => {
      const chatOnly = prev.filter((m): m is ChatMessage => m.role !== "divider");
      const finalized = finalizeVoiceTranscripts(chatOnly);
      voiceTurnRef.current = { userIdx: null, assistantIdx: null };
      return mergeChatMessages(prev, finalized);
    });
  }, [mergeChatMessages]);

  const handleVoiceFinalTranscript = useCallback(
    (event: VoiceTranscriptEvent) => {
      const sid = sessionIdRef.current;
      if (!sid || !event.text.trim()) return;
      const key = `${event.role}:${event.text.trim()}`;
      if (voicePersistedRef.current.has(key)) return;
      voicePersistedRef.current.add(key);
      void client
        .appendVoiceTranscript({
          chatSessionId: sid,
          voiceSessionId: voiceSessionIdRef.current ?? undefined,
          role: event.role,
          content: event.text.trim(),
        })
        .catch(() => {
          voicePersistedRef.current.delete(key);
        });
    },
    [client],
  );

  const handleVoiceEscalation = useCallback(() => {
    setHandoffPending(true);
    finalizeVoiceMessages();
  }, [finalizeVoiceMessages]);

  const {
    voiceState,
    voiceActive,
    voiceError,
    voiceSessionIdRef,
    getMicLevels,
    startVoice,
    stopVoice,
  } = useRealtimeVoice(client, {
    onTranscript: handleVoiceTranscript,
    onFinalTranscript: handleVoiceFinalTranscript,
    onEscalation: handleVoiceEscalation,
  });

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    humanActiveRef.current = humanActive;
  }, [humanActive]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const micSupported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";
  const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, proactivePhase, pendingQuestion, voiceActive, voiceState]);

  useEffect(() => {
    if (voiceState !== "live") return;
    setMessages((prev) => {
      let changed = false;
      const chatOnly = prev.filter((m): m is ChatMessage => m.role !== "divider");
      const nextChat = chatOnly.map((m) => {
        if (m.role === "assistant" && m.streaming) {
          changed = true;
          return { ...m, streaming: false };
        }
        return m;
      });
      if (!changed) return prev;
      voiceTurnRef.current.assistantIdx = null;
      return mergeChatMessages(prev, nextChat);
    });
  }, [voiceState, mergeChatMessages]);

  useEffect(() => {
    if (!voiceActive) return;
    if (humanActive || handoffPending) {
      void (async () => {
        await stopVoice();
        finalizeVoiceMessages();
      })();
    }
  }, [humanActive, handoffPending, voiceActive, stopVoice, finalizeVoiceMessages]);

  useEffect(() => {
    if (!id) return;
    client
      .getConfig()
      .then((res) => {
        const cfg = res.config;
        if (cfg?.name) setProjectName(cfg.name);
        if (cfg?.welcomeMessage) {
          setMessages([{ role: "assistant", content: cfg.welcomeMessage }]);
        }
        if (cfg?.primaryColor) setResolvedPrimary(cfg.primaryColor);
        if (cfg?.theme && ["primary", "secondary", "tech", "professional"].includes(cfg.theme)) {
          setResolvedTheme(cfg.theme as WidgetTheme);
        }
        if (cfg?.position === "left" || cfg?.position === "right") {
          setResolvedPosition(cfg.position);
        }
        if (cfg?.proactiveTriggers?.rules?.length) {
          setProactiveTriggers(cfg.proactiveTriggers);
        }
        if (cfg?.allowAnonymousSessions) {
          setAllowAnonymous(true);
        }
        if (cfg?.voice?.enabled) {
          setVoiceRealtimeEnabled(true);
          if (cfg.voice.fallbackMode === "transcribe" || cfg.voice.fallbackMode === "text_only") {
            setVoiceFallbackMode(cfg.voice.fallbackMode);
          }
        }
      })
      .catch(() => {
        // keep defaults
      });
  }, [client, id]);

  // Torn down once the visitor engages (started) — no need to keep watching page
  // signals for someone who is already talking to the bot.
  useEffect(() => {
    if (!proactiveTriggers || started || proactiveEngaged) return;
    const engine = new TriggerEngine(proactiveTriggers, {
      onFire: (rule) => {
        setProactiveMessage(rule.message);
        setProactivePhase("question");
        setOpen(true);
      },
    });
    engine.start();
    return () => engine.stop();
  }, [proactiveTriggers, started, proactiveEngaged]);

  useEffect(() => {
    if (primaryColorProp) setResolvedPrimary(primaryColorProp);
  }, [primaryColorProp]);

  useEffect(() => {
    if (!sessionId) return;

    const reconcile = () => {
      client
        .getSessionMessages(sessionId)
        .then((res) => {
          setHumanActive(res.humanActive);
          setHandoffPending(res.humanPending);
          let next: WidgetMessage[] = res.messages.map((m) => ({
            role: m.role,
            content: m.content,
          }));
          if (res.humanActive) {
            next = appendSessionDivider(next, "team_joined");
          }
          setMessages(next);
        })
        .catch(() => {
          // Keep whatever is on screen; the next event or reconnect tries again.
        });
    };

    const unsubscribe = client.subscribeToSession(
      sessionId,
      (event) => {
        if (event.type === "connected") {
          setHumanActive(event.humanActive);
          if (event.humanActive) {
            setMessages((m) => appendSessionDivider(m, "team_joined"));
          }
          return;
        }
        if (event.type === "human_active") {
          setHumanActive(true);
          setHandoffPending(false);
          setMessages((m) =>
            appendSessionDivider(
              m.filter((msg) => msg.role === "divider" || !msg.streaming),
              "team_joined",
            ),
          );
          setLoading(false);
          return;
        }
        if (event.type === "human_released") {
          setHumanActive(false);
          setAgentTyping(false);
          setMessages((m) => appendSessionDivider(m, "team_left"));
          return;
        }
        if (event.type === "agent_typing") {
          setAgentTyping(true);
          if (agentTypingTimer.current) clearTimeout(agentTypingTimer.current);
          agentTypingTimer.current = setTimeout(() => setAgentTyping(false), 4000);
          return;
        }
        if (event.type === "agent_message") {
          setAgentTyping(false);
          setMessages((m) => [...m, { role: "agent", content: event.content }]);
        }
      },
      reconcile,
    );

    return () => {
      unsubscribe();
      if (agentTypingTimer.current) clearTimeout(agentTypingTimer.current);
    };
  }, [client, sessionId]);

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia("(max-width: 480px)");
    if (!mq.matches) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!id) {
    console.error("QuickStart ChatBot requires clientId");
    return null;
  }

  const chatReady = started || allowAnonymous;

  const beginSession = async (): Promise<string> => {
    if (sessionIdRef.current) return sessionIdRef.current;
    const sid = await client.ensureSession(null);
    sessionIdRef.current = sid;
    setSessionId(sid);
    setStarted(true);
    setProactivePhase(null);
    setPendingQuestion(null);
    return sid;
  };

  /** Forwards a visitor message to the human agent — no bot reply or TTS. */
  const sendToHumanAgent = async (sid: string, text: string) => {
    setLoading(true);
    try {
      await client.sendMessageStream(sid, text, (event) => {
        if (event.type === "meta" && event.humanActive) setHumanActive(true);
      });
    } catch (e) {
      console.error(e);
      const errMsg =
        e instanceof ChatRequestError
          ? e.message
          : "Could not send your message to support. Please try again.";
      setMessages((m) => [...m, { role: "assistant", content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const streamAssistantReply = async (sid: string, text: string) => {
    setLoading(true);
    let finalAnswer = "";
    try {
      await client.sendMessageStream(sid, text, (event) => {
        if (event.type === "token") {
          finalAnswer += event.content;
          setMessages((m) => {
            const copy = [...m];
            const last = copy[copy.length - 1];
            if (last?.role === "assistant") {
              copy[copy.length - 1] = {
                ...last,
                content: last.content + event.content,
                streaming: true,
              };
            }
            return copy;
          });
        }
        if (event.type === "done" && event.handoffPending) {
          setHandoffPending(true);
        }
        if (event.type === "meta" && event.humanActive) {
          setHumanActive(true);
        }
      });
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") {
          copy[copy.length - 1] = { ...last, streaming: false };
        }
        return copy;
      });
      if (speakReplies && speechSupported && finalAnswer.trim()) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(finalAnswer));
      }
    } catch (e) {
      console.error(e);
      const errMsg =
        e instanceof ChatRequestError
          ? e.message
          : e instanceof TypeError && /fetch|network|failed/i.test(e.message)
            ? "Cannot reach the chat server. Check that the API is running and the URL is correct."
            : "Sorry, something went wrong. Please try again.";
      setMessages((m) => {
        const copy = [...m];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant" && last.streaming) {
          copy[copy.length - 1] = { role: "assistant", content: errMsg, streaming: false };
          return copy;
        }
        return [...copy, { role: "assistant", content: errMsg }];
      });
    } finally {
      setLoading(false);
    }
  };

  const submitProactiveQuestion = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setProactiveEngaged(true);

    if (allowAnonymous) {
      setMessages((m) => [
        ...m,
        { role: "user", content: text },
        { role: "assistant", content: "", streaming: true },
      ]);
      setLoading(true);
      try {
        const sid = await beginSession();
        await streamAssistantReply(sid, text);
      } catch (e) {
        console.error(e);
        alert("Could not start chat session");
      }
      return;
    }

    setPendingQuestion(text);
    setProactivePhase("details");
  };

  const start = async () => {
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    try {
      const res = await client.createSession(name.trim(), email.trim());
      const sid = res.session.id;
      const question = pendingQuestion;
      const opener = proactiveMessage;
      sessionIdRef.current = sid;
      setSessionId(sid);
      setStarted(true);
      setProactivePhase(null);
      setPendingQuestion(null);

      if (opener && question) {
        setMessages([
          { role: "assistant", content: opener },
          { role: "user", content: question },
          { role: "assistant", content: "", streaming: true },
        ]);
        await streamAssistantReply(sid, question);
      } else if (opener) {
        setMessages([{ role: "assistant", content: opener }]);
      }
    } catch (e) {
      console.error(e);
      alert("Could not start chat session");
    } finally {
      setLoading(false);
    }
  };

  const notifyTyping = () => {
    if (!humanActive || !sessionId) return;
    const now = Date.now();
    if (now - lastTypingPing.current < 4000) return;
    lastTypingPing.current = now;
    void client.notifyVisitorTyping(sessionId).catch(() => {
      // Presence is cosmetic; never surface a failure to the visitor.
    });
  };

  const confirmHandoff = async () => {
    if (!sessionId || handoffBusy || humanActive) return;
    setHandoffBusy(true);
    try {
      const res = await client.requestHandoff(sessionId);
      setHandoffPending(res.humanPending);
      if (res.humanActive) setHumanActive(true);
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Could not connect to support right now. Please try again.",
        },
      ]);
    } finally {
      setHandoffBusy(false);
    }
  };

  /** Runs one message through chat — typed or voice. Routes to human agent when handoff is active. */
  const sendText = async (text: string) => {
    if (!text.trim() || loadingRef.current) return;

    let sid = sessionIdRef.current;
    if (!sid) {
      setLoading(true);
      try {
        sid = await beginSession();
      } catch (e) {
        console.error(e);
        alert("Could not start chat session");
        setLoading(false);
        return;
      }
    }

    const toHuman = humanActiveRef.current;

    setMessages((m) =>
      toHuman
        ? [...m, { role: "user", content: text }]
        : [
            ...m,
            { role: "user", content: text },
            { role: "assistant", content: "", streaming: true },
          ],
    );

    if (toHuman) {
      await sendToHumanAgent(sid, text);
      return;
    }

    await streamAssistantReply(sid, text);
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    if (proactivePhase === "question") {
      await submitProactiveQuestion();
      return;
    }
    const text = input.trim();
    setInput("");
    await sendText(text);
  };

  const startRecording = async () => {
    if (recording || transcribing || loading) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void transcribeRecordedClip(recorder.mimeType || "audio/webm");
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Couldn't access your microphone. Check your browser permissions and try again." },
      ]);
    }
  };

  const stopRecording = () => {
    if (!recording) return;
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const transcribeRecordedClip = async (mimeType: string) => {
    const blob = new Blob(audioChunksRef.current, { type: mimeType });
    audioChunksRef.current = [];
    if (blob.size === 0) return;

    setTranscribing(true);
    try {
      const audioBase64 = await blobToBase64(blob);
      const sid = sessionIdRef.current || undefined;
      const res = await client.transcribeAudio(sid, audioBase64, mimeType);
      if (res.text?.trim()) await sendText(res.text.trim());
    } catch (e) {
      console.error(e);
      const message =
        e instanceof ChatRequestError ? e.message : "Could not transcribe that recording. Please try again.";
      setMessages((m) => [...m, { role: "assistant", content: message }]);
    } finally {
      setTranscribing(false);
    }
  };

  const startLiveVoice = async () => {
    if (loading || recording || transcribing || voiceActive) return;

    let sid = sessionIdRef.current;
    if (!sid) {
      setLoading(true);
      try {
        sid = await beginSession();
      } catch (e) {
        console.error(e);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Could not start chat session for voice." },
        ]);
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    voiceTurnRef.current = { userIdx: null, assistantIdx: null };
    try {
      await startVoice(sid);
    } catch (e) {
      console.error(e);
      const message =
        e instanceof ChatRequestError
          ? e.message
          : "Could not start live voice. Try the mic button to record a message instead.";
      setMessages((m) => [...m, { role: "assistant", content: message }]);
    }
  };

  const endLiveVoice = async () => {
    await stopVoice();
    finalizeVoiceMessages();
  };

  const showPushToTalkMic =
    micSupported && voiceFallbackMode === "transcribe";
  const hasUserMessages = messages.some((m) => m.role === "user");
  const voiceBarProps = {
    active: voiceActive,
    state: voiceState,
    disabled: loading || recording || transcribing,
    accentBg: surface.accent.bg,
    accentText: surface.accent.text,
    onStart: () => void startLiveVoice(),
    onStop: () => void endLiveVoice(),
    getMicLevels,
  };
  const showVoiceStartInline =
    voiceRealtimeEnabled && chatReady && !voiceActive && !hasUserMessages;
  const showVoiceStartIcon =
    voiceRealtimeEnabled && chatReady && !voiceActive && hasUserMessages;

  const posKey = resolvedPosition === "left" ? "left" : "right";
  const initials = projectInitials(projectName);
  const fabClass = `qs-widget-fab qs-widget-fab--${posKey}`;
  const panelClass = `qs-widget-panel qs-widget-panel--${posKey}${open ? " qs-widget-panel--open" : ""}`;

  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      if (msg?.role === "assistant" && !msg.streaming) return i;
    }
    return -1;
  })();
  const lastUserIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "user") return i;
    }
    return -1;
  })();
  const lastAssistant =
    lastAssistantIdx >= 0 && messages[lastAssistantIdx]?.role === "assistant"
      ? messages[lastAssistantIdx]
      : null;
  const lastUser =
    lastUserIdx >= 0 && messages[lastUserIdx]?.role === "user" ? messages[lastUserIdx] : null;
  const visitorAskedForHuman =
    lastUser?.role === "user" && visitorRequestsHumanHelp(lastUser.content);
  const assistantOfferedHandoff =
    lastAssistant?.role === "assistant" && looksLikeHandoffOffer(lastAssistant.content);
  const showHandoffButton =
    !humanActive &&
    !handoffPending &&
    !loading &&
    (assistantOfferedHandoff || visitorAskedForHuman);

  return (
    <>
      <style>{markdownStyles}</style>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        className={fabClass}
        style={{
          background: surface.accent.bg,
          color: surface.accent.text,
        }}
      >
        {open ? (
          <span style={{ fontSize: 26, lineHeight: 1, marginTop: -2 }}>×</span>
        ) : (
          <MessageCircleIcon />
        )}
      </button>

      <div
        className={panelClass}
        role="dialog"
        aria-modal="true"
        aria-label={`${projectName} chat`}
        style={{
          background: surface.panel.bg,
          border: `1px solid ${surface.panel.border}`,
        }}
      >
        <div className="qs-widget-header">
          <span
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: INK,
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              flexShrink: 0,
              letterSpacing: "0.02em",
            }}
          >
            {initials}
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 600,
                color: INK,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {projectName}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#5C5A56" }}>Typically replies instantly</p>
          </div>
        </div>

        {!chatReady ? (
          proactivePhase === "question" ? (
            <>
              <div className="qs-widget-messages">
                {proactiveMessage && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div
                      className="qs-widget-bubble qs-widget-bubble--assistant"
                      style={{ color: surface.assistant.text }}
                    >
                      {proactiveMessage}
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
              <div className="qs-widget-input-row">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submitProactiveQuestion()}
                  placeholder="Type your question…"
                  style={{ ...inputStyle(surface), margin: 0, borderRadius: 9999 }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={submitProactiveQuestion}
                  disabled={!input.trim()}
                  className="qs-widget-send-btn"
                  style={{
                    ...sendBtnStyle,
                    background: surface.accent.bg,
                    color: surface.accent.text,
                    opacity: !input.trim() ? 0.55 : 1,
                  }}
                >
                  <span className="qs-widget-send-label">Send</span>
                </button>
              </div>
            </>
          ) : proactivePhase === "details" ? (
            <>
              <div className="qs-widget-messages">
                {proactiveMessage && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div
                      className="qs-widget-bubble qs-widget-bubble--assistant"
                      style={{ color: surface.assistant.text }}
                    >
                      {proactiveMessage}
                    </div>
                  </div>
                )}
                {pendingQuestion && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div
                      className="qs-widget-bubble qs-widget-bubble--user"
                      style={{
                        background: surface.user.bg,
                        color: surface.user.text,
                      }}
                    >
                      {pendingQuestion}
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
              <div
                className="qs-widget-start-form"
                style={{
                  background: surface.panel.bg,
                  flex: "0 0 auto",
                  borderTop: "1px solid rgba(10,10,10,0.06)",
                }}
              >
                <p style={{ color: "#5C5A56", margin: 0, fontSize: 14 }}>
                  Tell us who you are so we can reply
                </p>
                <input
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle(surface)}
                />
                <input
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle(surface)}
                />
                <button
                  type="button"
                  onClick={start}
                  disabled={loading || !name.trim() || !email.trim()}
                  style={{
                    ...sendBtnStyle,
                    background: surface.accent.bg,
                    color: surface.accent.text,
                    width: "100%",
                    opacity: loading || !name.trim() || !email.trim() ? 0.55 : 1,
                  }}
                >
                  {loading ? "Starting…" : "Continue"}
                </button>
              </div>
            </>
          ) : (
            <div className="qs-widget-start-form" style={{ background: surface.panel.bg }}>
              <p style={{ color: "#5C5A56", margin: 0, fontSize: 14 }}>Start a conversation</p>
              <input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle(surface)}
              />
              <input
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle(surface)}
              />
              <button
                type="button"
                onClick={start}
                disabled={loading}
                style={{
                  ...sendBtnStyle,
                  background: surface.accent.bg,
                  color: surface.accent.text,
                  width: "100%",
                }}
              >
                {loading ? "Starting…" : "Start chat"}
              </button>
            </div>
          )
        ) : (
          <>
            <div
              className="qs-widget-messages"
            >
              {messages.map((m, i) => {
                if (m.role === "divider") {
                  return <SessionDivider key={`divider-${i}`} kind={m.kind} />;
                }
                const isStreamingEmpty =
                  m.role === "assistant" && m.streaming && !m.content.trim();
                if (isStreamingEmpty) {
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: "flex-start" }}>
                      <TypingIndicator />
                    </div>
                  );
                }
                if (m.role === "assistant" && !m.content) return null;
                const isAgent = m.role === "agent";
                return (
                  <React.Fragment key={i}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                        minWidth: 0,
                      }}
                    >
                      <div
                        className={`qs-widget-bubble qs-widget-bubble--${
                          m.role === "user" ? "user" : isAgent ? "agent" : "assistant"
                        }${m.streaming ? " qs-widget-bubble--streaming" : ""}`}
                        style={
                          m.role === "user"
                            ? {
                                background: surface.user.bg,
                                color: surface.user.text,
                              }
                            : {
                                color: surface.assistant.text,
                              }
                        }
                      >
                        {isAgent && <div className="qs-agent-label">Support team</div>}
                        {m.role === "assistant" || isAgent ? (
                          <>
                            <MarkdownContent content={m.content} />
                            {m.streaming && <StreamingTail />}
                          </>
                        ) : (
                          <>
                            {m.content}
                            {m.streaming && <StreamingTail />}
                          </>
                        )}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
              {handoffPending && !humanActive && (
                <div className="qs-handoff-actions">
                  <p className="qs-handoff-status">
                    Your request has been forwarded to our support team. Please wait — an agent will join shortly.
                  </p>
                </div>
              )}
              {showHandoffButton && (
                <div className="qs-handoff-actions">
                  <p className="qs-handoff-status">
                    {visitorAskedForHuman
                      ? "Tap below to connect with a support agent."
                      : "Need to speak with someone?"}
                  </p>
                  <button
                    type="button"
                    className="qs-handoff-btn"
                    disabled={handoffBusy}
                    onClick={confirmHandoff}
                    style={{
                      background: surface.accent.bg,
                      color: surface.accent.text,
                    }}
                  >
                    {handoffBusy ? "Connecting…" : "Connect to support"}
                  </button>
                </div>
              )}
              {agentTyping && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <TypingIndicator />
                </div>
              )}
              {showVoiceStartInline && <VoiceChatBar variant="inline" {...voiceBarProps} />}
              <div ref={endRef} />
            </div>

            <div className={`qs-widget-composer${voiceActive ? " qs-widget-composer--voice" : ""}`}>
              {voiceError && voiceRealtimeEnabled && !voiceActive && (
                <div className="qs-widget-composer-banner">
                  <div className="qs-voice-error">{voiceError}</div>
                </div>
              )}
              <div className="qs-widget-input-row">
                <input
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    notifyTyping();
                  }}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder={
                    voiceActive ? "Live voice active…" : recording ? "Listening…" : "Type a message…"
                  }
                  disabled={loading || recording || transcribing || voiceActive}
                  style={{ ...inputStyle(surface), margin: 0, borderRadius: 9999 }}
                />
                {speechSupported && !voiceActive && (
                  <button
                    type="button"
                    onClick={() => setSpeakReplies((v) => !v)}
                    title={speakReplies ? "Stop speaking replies aloud" : "Speak replies aloud"}
                    aria-label={speakReplies ? "Disable spoken replies" : "Enable spoken replies"}
                    aria-pressed={speakReplies}
                    className="qs-widget-speak-btn"
                    style={{
                      ...iconBtnStyle,
                      background: speakReplies ? surface.accent.bg : surface.panel.bg,
                      color: speakReplies ? "#ffffff" : surface.input.text,
                      border: `1px solid ${speakReplies ? surface.accent.bg : surface.input.border}`,
                    }}
                  >
                    {speakReplies ? <SpeakerOnIcon /> : <SpeakerOffIcon />}
                  </button>
                )}
                {showVoiceStartIcon && <VoiceChatBar variant="icon" {...voiceBarProps} />}
                {showPushToTalkMic && !voiceActive && (
                  <button
                    type="button"
                    onClick={recording ? stopRecording : startRecording}
                    disabled={transcribing || loading}
                    title={recording ? "Stop recording" : "Record a voice message"}
                    aria-label={recording ? "Stop recording" : "Record a voice message"}
                    className={`qs-widget-mic-btn${recording ? " qs-widget-mic-btn--recording" : ""}`}
                    style={{
                      ...iconBtnStyle,
                      background: recording ? "#DC2626" : surface.panel.bg,
                      color: recording ? "#ffffff" : surface.input.text,
                      border: `1px solid ${recording ? "#DC2626" : surface.input.border}`,
                      opacity: transcribing ? 0.55 : 1,
                    }}
                  >
                    {transcribing ? (
                      <TranscribingIcon />
                    ) : recording ? (
                      <StopRecordingIcon />
                    ) : (
                      <MicStandIcon />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={send}
                  disabled={loading || recording || transcribing || voiceActive || !input.trim()}
                  className="qs-widget-send-btn"
                  style={{
                    ...sendBtnStyle,
                    background: surface.accent.bg,
                    color: surface.accent.text,
                    opacity: loading || !input.trim() ? 0.55 : 1,
                  }}
                >
                  <span className="qs-widget-send-label">Send</span>
                </button>
              </div>
              {voiceRealtimeEnabled && chatReady && (
                <div className="qs-widget-voice-dock">
                  <VoiceChatBar variant="dock" {...voiceBarProps} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function inputStyle(surface: ReturnType<typeof resolveWidgetSurface>): React.CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${surface.input.border}`,
    background: surface.input.bg,
    color: surface.input.text,
    fontSize: 14,
    outline: "none",
    maxWidth: "100%",
  };
}

const sendBtnStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 9999,
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
  flexShrink: 0,
  touchAction: "manipulation",
};

const iconBtnStyle: React.CSSProperties = {
  ...sendBtnStyle,
  width: 40,
  height: 40,
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export default ChatBot;
