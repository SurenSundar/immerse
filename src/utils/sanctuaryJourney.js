// Calming moments shown one by one in the "Follow the light" sanctuary on "/",
// plus the small bit of session state that decides when it greets a visitor.

// The order is deliberate: meet a frustrated mind first (short lines, nothing asked),
// then settle the body, quiet the mind, rest, and only then offer strength.
export const CALMING_TEXTS = [
  // 1. Arrive — accept the frustration, ask nothing
  "The mind is restless. Pause for a moment.",
  "It's okay to feel this way.",
  "You don't have to fix anything right now.",
  "Nothing is expected of you here.",
  "Just follow the light. That's all.",
  "You've already slowed down a little.",

  // 2. Settle the body — breath and simple physical cues
  "Breathe in slowly, only as deep as feels comfortable.",
  "Now let the breath out, a little longer.",
  "Let your shoulders drop.",
  "Unclench your jaw. Soften your hands.",
  "Feel the ground beneath you. It is holding you.",
  "Breathe out. Let a little of the day fall away.",
  "Every breath is a small homecoming.",

  // 3. Quiet the mind — thoughts lose their grip
  "Thoughts come and go, like clouds across the sky.",
  "You don't have to follow every thought.",
  "Let the noise settle, like sand sinking in still water.",
  "Notice the quiet between your thoughts. Stay there a while.",
  "Nothing needs fixing in this breath.",
  "Patience. The light is always there, even when it shifts.",
  "This moment is enough, exactly as it is.",

  // 4. Rest — safety and kindness
  "You are safe here. You can rest.",
  "You are allowed to rest without earning it.",
  "Slow is not behind. Slow is simply gentle.",
  "Be kind to your mind. It is only trying to protect you.",
  "Whatever you are carrying, you can set it down for now.",

  // 5. Strength — offered once the mind is calm enough to accept it
  "The storm passes. The sky remains.",
  "You are more than the chatter. You are the calm beneath it.",
  "Gentleness is a kind of courage.",
  "Your worth is not measured by how much you do.",
  "Confidence. Trust your journey through the dark.",
  "Do not give up. Every step brings you closer to clarity.",
  "You have found the light. Welcome to your mind."
];

/** Light grows gently from 1x to ~14x across the journey (same range as the original 5-step version). */
export function lightScale(step) {
  const t = Math.min(1, step / (CALMING_TEXTS.length - 1));
  return 1 + 13 * Math.pow(t, 1.6);
}

/** Sky opacity in the sanctuary: grows by 1/30 per moment, fully visible from moment 31. */
export function skyOpacity(step) {
  return Math.min(1, step / 30);
}

export const PENTATONIC = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];

// ── Session state ──
// "done" is per browser session so the sanctuary greets you once per visit;
// "requested" lets a Revisit button bring it back on demand.
const DONE_KEY = 'monkeymind_game_complete';
const FORCE_KEY = 'monkeymind_sanctuary_requested';

function safe(fn, fallback) {
  try { return fn(); } catch { return fallback; }
}

export function shouldShowSanctuary() {
  return safe(() => sessionStorage.getItem(FORCE_KEY) === 'true' || sessionStorage.getItem(DONE_KEY) !== 'true', false);
}

export function markSanctuaryDone() {
  safe(() => {
    sessionStorage.setItem(DONE_KEY, 'true');
    sessionStorage.removeItem(FORCE_KEY);
  });
}

export function requestSanctuary() {
  safe(() => sessionStorage.setItem(FORCE_KEY, 'true'));
}
