/**
 * analytics.js — lightweight Supabase-backed event tracker
 * Records page views and tool sessions with duration.
 */
import { supabase } from './supabaseClient';

/** Returns (or creates) a stable session ID for this browser visit */
export function getSessionId() {
  let sid = sessionStorage.getItem('mm_session_id');
  if (!sid) {
    sid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('mm_session_id', sid);
  }
  return sid;
}

/**
 * Call on page mount. Returns the event row `id` so you can update duration on unmount.
 * @param {string} page  e.g. 'home' | 'resonance' | 'timer' | 'meditation' | 'books'
 * @returns {Promise<string|null>} row id
 */
export async function trackPageStart(page) {
  try {
    const { data, error } = await supabase
      .from('page_events')
      .insert({ page, session_id: getSessionId(), duration_s: 0 })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  } catch {
    return null; // fail silently — never break the user experience
  }
}

/**
 * Call on page unmount with the id from `trackPageStart`.
 * @param {string} id       Row id returned from trackPageStart
 * @param {number} startTs  Timestamp (ms) from when tracking started
 */
export async function trackPageEnd(id, startTs) {
  if (!id) return;
  const duration_s = Math.round((Date.now() - startTs) / 1000);
  try {
    await supabase.from('page_events').update({ duration_s }).eq('id', id);
  } catch { /* silent */ }
}

/**
 * Call when a tool session starts.
 * @param {string} tool  'breathing' | 'focus_timer' | 'meditation' | 'books_text' | 'books_audio'
 * @returns {Promise<{id: string, startTs: number}|null>}
 */
export async function trackToolStart(tool) {
  try {
    const { data, error } = await supabase
      .from('tool_events')
      .insert({ tool, session_id: getSessionId(), duration_s: 0 })
      .select('id')
      .single();
    if (error) throw error;
    return { id: data.id, startTs: Date.now() };
  } catch {
    return null;
  }
}

/**
 * Call when a tool session ends.
 * @param {{ id: string, startTs: number } | null} session
 */
export async function trackToolEnd(session) {
  if (!session?.id) return;
  const duration_s = Math.round((Date.now() - session.startTs) / 1000);
  try {
    await supabase.from('tool_events').update({ duration_s }).eq('id', session.id);
  } catch { /* silent */ }
}
