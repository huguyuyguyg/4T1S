/* ============================================================
   ANTHROPIC AI HELPER — calls go through our backend
   so the API key never lives in the browser.
   ============================================================ */
async function callClaude(prompt, systemPrompt = '') {
  try {
    const data = await apiPost('/api/claude/message', { prompt, system: systemPrompt });
    return data.text || 'No response.';
  } catch (e) {
    return 'AI unavailable right now.';
  }
}
