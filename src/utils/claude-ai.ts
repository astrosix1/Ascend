/**
 * Claude AI utility — calls the Anthropic Messages API directly via fetch.
 * The API key is stored at runtime in AsyncStorage (set once in Settings).
 */

import { getData, KEYS } from './storage';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL   = 'claude-haiku-4-5';

async function callClaude(prompt: string): Promise<string> {
  const apiKey = await getData<string>(KEYS.ANTHROPIC_KEY);
  if (!apiKey) {
    throw new Error('NO_KEY');
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 401) throw new Error('INVALID_KEY');
    throw new Error(`API_ERROR_${res.status}: ${body.slice(0, 120)}`);
  }

  const data = await res.json();
  return (data.content?.[0]?.text ?? '').trim();
}

function parseJsonArray(raw: string): string[] {
  // Extract first JSON array from the response text
  const match = raw.match(/\[[\s\S]*?\]/);
  if (!match) return [];
  try {
    const arr = JSON.parse(match[0]);
    return Array.isArray(arr) ? arr.filter((x: any) => typeof x === 'string').slice(0, 6) : [];
  } catch {
    return [];
  }
}

/**
 * Given a goal, suggest up to 6 daily habits that support it.
 */
export async function generateHabitsFromGoal(goal: string): Promise<string[]> {
  const prompt =
    `You are a habit coach. A user has this goal: "${goal}"\n\n` +
    `Suggest 6 specific, actionable daily habits (each under 8 words) that will help achieve it.\n` +
    `Return ONLY a JSON array of strings. Example: ["Walk 10 000 steps daily","Journal for 10 minutes"]\n` +
    `Return nothing but the JSON array.`;

  const text = await callClaude(prompt);
  return parseJsonArray(text);
}

/**
 * Given a habit, suggest up to 6 meaningful long-term goals it supports.
 */
export async function generateGoalsFromHabit(habit: string): Promise<string[]> {
  const prompt =
    `You are a life coach. A user has this daily habit: "${habit}"\n\n` +
    `Suggest 6 meaningful long-term goals (each under 10 words) that this habit supports.\n` +
    `Return ONLY a JSON array of strings. Example: ["Run a 5K race","Lose 15 lbs by summer"]\n` +
    `Return nothing but the JSON array.`;

  const text = await callClaude(prompt);
  return parseJsonArray(text);
}
