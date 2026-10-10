import OpenAI from 'openai';
export const config = { api: { bodyParser: { sizeLimit: '64kb' } } };
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Method not allowed' }); }
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'OpenAI is not configured. Add OPENAI_API_KEY in Vercel → Project Settings → Environment Variables, then redeploy.' });
  const { question, language = 'English', verbosity = 'Balanced' } = req.body || {};
  if (typeof question !== 'string' || !question.trim()) return res.status(400).json({ error: 'Enter a question first.' });
  if (question.length > 30000) return res.status(413).json({ error: 'Question is too long; maximum 30,000 characters.' });
  const lang = ['English', 'Hindi', 'Hinglish'].includes(language) ? language : 'English';
  const style = ['Concise', 'Balanced', 'Detailed'].includes(verbosity) ? verbosity : 'Balanced';
  try {
    const ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 45000, maxRetries: 1 });
    const result = await ai.chat.completions.create({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [
      { role: 'system', content: `You are InterviewMate AI, a truthful interview preparation coach. Use ${lang}. Answer detail: ${style}. Provide technically accurate, structured answers; coding topics should include approach, code and complexity where relevant. Never invent the candidate’s experience or metrics. For STAR prompts give placeholders for real personal details. Intended for practice or use where permitted.` },
      { role: 'user', content: question.trim() }
    ], temperature: 0.3, max_tokens: style === 'Concise' ? 500 : style === 'Detailed' ? 1800 : 1000 });
    const answer = result.choices[0]?.message?.content?.trim();
    if (!answer) return res.status(502).json({ error: 'OpenAI returned an empty answer.' });
    return res.status(200).json({ answer, provider: 'OpenAI', model: result.model });
  } catch (e) {
    const status = e.status === 401 ? 401 : e.status === 429 ? 429 : e.status === 503 ? 503 : 502;
    return res.status(status).json({ error: status === 401 ? 'OpenAI rejected the server key. Replace OPENAI_API_KEY in Vercel.' : status === 429 ? 'OpenAI rate limit or usage quota reached. Check API billing.' : 'OpenAI request failed. Check Vercel runtime logs.' });
  }
}
