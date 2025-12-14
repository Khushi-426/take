const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const SYSTEM_PROMPT = `
You are PhysioBot, an intelligent physiotherapy coach.

Rules:
- If recalibration intent → return: ACTION: RECALIBRATE
- If stop intent → return: ACTION: STOP
- If stats intent → return: ACTION: STATS
- Otherwise respond naturally, max 20 words, motivational and exercise-aware.
`;

export const fetchAICommentary = async (context, userQuery, history = []) => {
  if (!API_KEY) return 'AI key missing.';

  const historyText = history
    .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
    .join('\n');

  const prompt = `
${SYSTEM_PROMPT}

CONTEXT:
${JSON.stringify(context)}

CHAT:
${historyText}

USER:
${userQuery}
`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Okay.';
  } catch {
    return 'Network error.';
  }
};
