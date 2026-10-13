import React, { useEffect, useRef, useState } from 'react';
import { AudioLines, LayoutDashboard, Radio, FileText, ScanLine, History, Settings as Gear, ShieldCheck, Sparkles, ArrowRight, Play, Upload, KeyRound, CheckCircle2, AlertTriangle, Copy, Trash2, Menu, X, FileUp, Mic, MessageSquare, LoaderCircle, ExternalLink, LockKeyhole, BookOpen, BriefcaseBusiness } from 'lucide-react';
type Page = 'Dashboard' | 'Live Copilot' | 'Interview Prep' | 'Question Analyzer' | 'History' | 'Settings';
type Chat = { q: string; a: string; time: string };
const pages: Page[] = ['Dashboard', 'Live Copilot', 'Interview Prep', 'Question Analyzer', 'History', 'Settings'];
export default function App() {
  const [page, setPage] = useState<Page>('Dashboard'), [menu, setMenu] = useState(false), [status, setStatus] = useState('Not checked'), [serverConfigured, setServerConfigured] = useState(false);
  const [ollamaBase, setOllamaBase] = useState<'http://localhost:11434' | 'http://127.0.0.1:11434'>('http://localhost:11434');
  const [question, setQuestion] = useState(''), [answer, setAnswer] = useState(''), [busy, setBusy] = useState(false), [resume, setResume] = useState(''), [jd, setJd] = useState(''), [prep, setPrep] = useState(''), [fileName, setFileName] = useState(''), [analysis, setAnalysis] = useState(''), [analysisQ, setAnalysisQ] = useState(''), [history, setHistory] = useState<Chat[]>([]), [audioText, setAudioText] = useState(''), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [prefs, setPrefs] = useState({ language: 'English', verbosity: 'Concise' });
  const [voiceStatus, setVoiceStatus] = useState('Voice practice is off');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceListening, setVoiceListening] = useState(false);
  const voiceRecognition = useRef<any>(null);
  const voiceTimer = useRef<number | null>(null);
  const voiceTranscriptRef = useRef('');

  useEffect(() => { try { const x = localStorage.getItem('im-prefs'); if (x) setPrefs(JSON.parse(x)); } catch { /* ignore corrupt preferences */ } }, []);
  useEffect(() => { try { localStorage.setItem('im-prefs', JSON.stringify(prefs)); } catch { /* storage may be blocked */ } }, [prefs]);
  useEffect(() => { try { localStorage.removeItem('im-provider'); } catch { /* storage may be blocked */ } }, []);
  const notify = (s: string) => { setNotice(s); window.setTimeout(() => setNotice(''), 4500); };
  const generateAnswer = async (questionText: string, verbosity = prefs.verbosity) => {
    let response: Response;
    try {
      response = await fetch(ollamaBase + '/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: 'qwen2.5:3b', stream: false, messages: [
        { role: 'system', content: `You are InterviewMate, a truthful interview preparation coach. Use ${prefs.language}. Answer detail: ${verbosity}. Give accurate, structured answers; coding topics should include approach, code and complexity where relevant. Never invent candidate experience or metrics. For STAR prompts, use placeholders for real details. Intended for practice or use where permitted.` },
        { role: 'user', content: questionText.trim() }
      ], options: { temperature: 0.3, num_predict: verbosity === 'Concise' ? 500 : verbosity === 'Detailed' ? 1800 : 1000 } }) });
    } catch { throw new Error('Free local AI is not reachable. Install Ollama, run “ollama pull qwen2.5:3b”, allow this site in OLLAMA_ORIGINS, then restart Ollama.'); }
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(response.status === 404 ? 'Ollama returned 404 for /api/chat. Confirm that this is the official Ollama server, then update/restart Ollama from https://ollama.com/download.' : (data.error || 'Ollama could not generate an answer. Check that Ollama is running and the model is installed.'));
    const answerText = data.message?.content?.trim();
    if (!answerText) throw new Error('Local model returned an empty answer. Try again.');
    return { answer: answerText, provider: 'Ollama', model: data.model || 'qwen2.5:3b' };
  };
  const ask = async (q = question) => { if (!q.trim()) return; setBusy(true); setError(''); setAnswer(''); try { const d = await generateAnswer(q); setAnswer(d.answer); setHistory(h => [{ q, a: d.answer, time: new Date().toLocaleString() }, ...h]); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };
  useEffect(() => {
    // Chrome extension passes text in the URL fragment so it is not sent to the web server.
    const prefix = '#scan=';
    if (!window.location.hash.startsWith(prefix)) return;
    let scanned = '';
    try { scanned = decodeURIComponent(window.location.hash.slice(prefix.length)).slice(0, 12000).trim(); } catch { scanned = ''; }
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    if (!scanned) return;
    setPage('Live Copilot');
    setQuestion(scanned);
    setError('');
    setAnswer('');
    setBusy(true);
    void (async () => {
      try {
        const d = await generateAnswer('You are helping with a consent-based mock interview. Answer briefly and directly. Use headings: Definition, Real-world use case, and Code (only if relevant). If the scanned text contains multiple questions, answer the clearest question first.\n\nPage text / question:\n' + scanned, 'Concise');
        setAnswer(d.answer);
        setHistory(h => [{ q: scanned, a: d.answer, time: new Date().toLocaleString() }, ...h]);
      } catch (e) { setError((e as Error).message); }
      finally { setBusy(false); }
    })();
  // Process only once on mount; the hash is removed before the network request.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const check = async () => {
    setBusy(true); setError('');
    try {
      let base: 'http://localhost:11434' | 'http://127.0.0.1:11434' = 'http://localhost:11434';
      let r: Response | null = null;
      try { r = await fetch(base + '/api/tags', { cache: 'no-store' }); } catch { /* try the alternate loopback address below */ }
      if (!r || !r.ok) {
        try {
          const alternate = await fetch('http://127.0.0.1:11434/api/tags', { cache: 'no-store' });
          if (alternate.ok) {
            base = 'http://127.0.0.1:11434';
            r = alternate;
          } else if (!r) {
            r = alternate;
          }
        } catch { /* report both attempts below */ }
      }
      if (!r) throw new Error('Neither localhost nor 127.0.0.1 could reach the service on port 11434. Start/restart Ollama and try again.');
      if (!r.ok) {
        if (r.status === 404) throw new Error('Ollama API check returned HTTP 404 on port 11434. Try both http://localhost:11434/api/tags and http://127.0.0.1:11434/api/tags. If both return 404, update/reinstall the official Ollama app from https://ollama.com/download and restart it. This is not an API-key or billing issue.');
        throw new Error('Local AI endpoint returned HTTP ' + r.status + '. Restart Ollama and retry.');
      }
      const d = await r.json();
      if (!Array.isArray(d.models)) throw new Error('Port 11434 responded, but did not return Ollama’s expected models list. Another app may be using that port.');
      setOllamaBase(base);
      const installed = d.models.some((m: any) => m.name === 'qwen2.5:3b' || m.name?.startsWith('qwen2.5:3b-'));
      setServerConfigured(installed); setStatus(installed ? 'Free local model ready' : 'Ollama connected · model missing');
      if (installed) {
        notify('Local AI is ready. No API key or usage fee is needed.');
      } else {
        setError('Ollama is reachable, but qwen2.5:3b is not installed. In PowerShell run: ollama pull qwen2.5:3b');
      }
    } catch (e) {
      setStatus('Connection failed');
      const message = e instanceof Error ? e.message : 'Unknown connection error.';
      setError(message);
    } finally { setBusy(false); }
  };
  const uploadText = async (f: File, kind: string) => { setError(''); setFileName(f.name); if (f.size > 8 * 1024 * 1024) { setError('Keep uploads under 8 MB.'); return; } const ext = f.name.toLowerCase().split('.').pop(); try { if (ext === 'txt' || ext === 'md') { const t = await f.text(); if (kind === 'resume') setResume(t); else if (kind === 'analyzer') setAnalysisQ(t); else setQuestion(t); notify('Text file extracted locally.'); return; } if (ext === 'docx') { const mammoth = await import('mammoth'); const x = await mammoth.extractRawText({ arrayBuffer: await f.arrayBuffer() }); if (kind === 'resume') setResume(x.value); else if (kind === 'analyzer') setAnalysisQ(x.value); else setQuestion(x.value); notify('DOCX extracted locally.'); return; } if (ext === 'pdf') { const pdf = await import('pdfjs-dist'); pdf.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs'; const doc = await pdf.getDocument({ data: await f.arrayBuffer() }).promise; let text = ''; for (let i = 1; i <= doc.numPages; i++) { const p = await doc.getPage(i); const c = await p.getTextContent(); text += c.items.map((it: any) => 'str' in it ? it.str : '').join(' ') + '\n'; } if (!text.trim()) throw Error('Scanned PDF needs OCR, which is not connected. Paste the text instead.'); if (kind === 'resume') setResume(text); else if (kind === 'analyzer') setAnalysisQ(text); else setQuestion(text); notify('PDF text extracted locally.'); return; } if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) { notify('Screenshot selected; OCR is not connected yet. Paste its text.'); return; } throw Error('Supported files: TXT, MD, DOCX and selectable-text PDF.'); } catch (e) { setError((e as Error).message); } };
  const makePrep = async () => { setBusy(true); setError(''); try { const d = await generateAnswer('Prepare an interview plan using this resume and job description. List strengths, gaps, six likely questions and STAR themes. Do not invent facts. RESUME:\n' + resume + '\nJOB DESCRIPTION:\n' + jd, 'Detailed'); setPrep(d.answer); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };
  const analyze = async () => { setBusy(true); setError(''); try { const d = await generateAnswer('Analyze this interview question with concept, structured sample answer, code where relevant, trade-offs and follow-ups:\n' + analysisQ); setAnalysis(d.answer); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } };
  const stopVoicePractice = () => {
    if (voiceTimer.current !== null) window.clearTimeout(voiceTimer.current);
    voiceTimer.current = null;
    try { voiceRecognition.current?.stop(); } catch { /* already stopped */ }
    voiceRecognition.current = null;
    setVoiceListening(false);
    setVoiceStatus('Voice practice stopped');
  };
  const startVoicePractice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setVoiceStatus('Speech recognition is not supported in this browser. Try current Chrome.'); return; }
    try { voiceRecognition.current?.stop(); } catch { /* no active session */ }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = prefs.language === 'Hindi' ? 'hi-IN' : 'en-US';
    voiceTranscriptRef.current = '';
    setVoiceTranscript('');
    setVoiceListening(true);
    setVoiceStatus('Listening through your microphone — visible practice mode');
    rec.onresult = (event: any) => {
      let latest = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) latest += event.results[i][0].transcript + ' ';
      }
      if (!latest.trim()) return;
      voiceTranscriptRef.current = (voiceTranscriptRef.current + ' ' + latest).trim().slice(-12000);
      const snapshot = voiceTranscriptRef.current;
      setVoiceTranscript(snapshot);
      setVoiceStatus('Heard speech; waiting for a pause…');
      if (voiceTimer.current !== null) window.clearTimeout(voiceTimer.current);
      voiceTimer.current = window.setTimeout(() => {
        const q = voiceTranscriptRef.current.trim();
        const questionLike = /\?|\b(what|why|how|when|where|who|which|explain|define|describe|compare|difference|can you|could you|tell me|write|implement|solve)\b/i.test(q);
        if (!questionLike) { setVoiceStatus('No clear question detected. Keep listening or stop to review the transcript.'); return; }
        setVoiceStatus('Question detected — generating a concise answer…');
        void ask('Answer this question from a consent-based mock interview. Be direct and concise. Include Definition, Real-world use case, and a short code example only if relevant.\n\nTranscript:\n' + q);
      }, 1500);
    };
    rec.onerror = (event: any) => {
      setVoiceStatus('Microphone/speech error: ' + (event.error || 'unknown error'));
      setVoiceListening(false);
    };
    rec.onend = () => {
      setVoiceListening(false);
      if (voiceRecognition.current === rec) voiceRecognition.current = null;
      setVoiceStatus(current => current.includes('generating') ? current : 'Voice session ended');
    };
    voiceRecognition.current = rec;
    try { rec.start(); } catch (e) { setVoiceListening(false); setVoiceStatus('Could not start microphone recognition. Check browser permission.'); }
  };
  const setFile = (e: React.ChangeEvent<HTMLInputElement>, kind: string) => { const f = e.target.files?.[0]; if (f) void uploadText(f, kind); e.target.value = ''; };
  return <div className={'layout'}><aside className={'sidebar ' + (menu ? 'open' : '')}><div className="brand"><span className="logo"><AudioLines size={22} /></span><span>InterviewMate<small>AI</small></span></div><p className="eyebrow">WORKSPACE</p>{pages.map((n, i) => { const Icon = [LayoutDashboard, Radio, FileText, ScanLine, History, Gear][i]; return <button key={n} className={'nav ' + (page === n ? 'active' : '')} onClick={() => { setPage(n); setMenu(false); }}><Icon size={18} />{n}{n === 'Live Copilot' && <i />}</button>; })}<div className="sidebar-bottom"><ShieldCheck size={16} />Practice with permission</div></aside><main className="main"><header><button className="mobile" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button><span className="crumb">Workspace / <b>{page}</b></span><span className="chip"><i />{status}</span></header><div className="content">{page === 'Dashboard' && <><div className="hero"><p className="eyebrow">YOUR PERSONAL INTERVIEW WORKSPACE</p><h1>Prepare with clarity.<br /><em>Answer with confidence.</em></h1><p>Practice technical questions, review your resume, and organize interview preparation in one workspace.</p><div className="actions"><button className="primary" onClick={() => setPage('Live Copilot')}><Play size={16} />Start mock interview<ArrowRight size={16} /></button><button className="secondary" onClick={() => setPage('Interview Prep')}>Prepare for a role</button></div><p className="footnote">Use AI in mock interviews or wherever assistance is permitted.</p></div><div className="stats"><article><span>Answers generated</span><strong>{history.length.toString().padStart(2, '0')}</strong><small>This browser visit</small></article><article><span>Prep materials</span><strong>{resume && jd ? '02' : resume || jd ? '01' : '00'}</strong><small>Resume & target role</small></article><article><span>AI provider</span><strong>{serverConfigured ? 'Ready' : '—'}</strong><small>{status}</small></article><article><span>Audio source</span><strong>Voice</strong><small>Browser mic practice</small></article></div><div className="section-title"><h2>Continue preparing</h2><span>Choose what helps today</span></div><div className="cards"><button onClick={() => setPage('Live Copilot')}><Radio /><h3>AI answer companion</h3><p>Ask real questions and get generated answers from free local AI.</p><span>Open copilot <ArrowRight size={14} /></span></button><button onClick={() => setPage('Interview Prep')}><BriefcaseBusiness /><h3>Resume & job match</h3><p>Extract documents and build a targeted preparation plan.</p><span>Prepare <ArrowRight size={14} /></span></button><button onClick={() => setPage('Question Analyzer')}><ScanLine /><h3>Question analyzer</h3><p>Analyze typed or extracted questions with AI.</p><span>Analyze <ArrowRight size={14} /></span></button></div></>}{page === 'Settings' && <><div className="page-title"><p className="eyebrow">MAKE IT YOURS</p><h1>Workspace Settings</h1><p>Use free local AI with Ollama on this computer. No paid AI API is used.</p></div><div className="panel"><div className="panel-head"><KeyRound /><div><h2>AI provider</h2><p>Local mode runs on your computer through Ollama; prompts stay local.</p></div><span className={'pill ' + (serverConfigured ? 'ok' : '')}>{status}</span></div><div className="form-grid"><label>Provider<select value="local" disabled><option value="local">Free local AI (Ollama)</option></select></label><label>Answer language<select value={prefs.language} onChange={e => setPrefs(p => ({ ...p, language: e.target.value }))}><option>English</option><option>Hindi</option><option>Hinglish</option></select></label><label>Answer style<select value={prefs.verbosity} onChange={e => setPrefs(p => ({ ...p, verbosity: e.target.value }))}><option>Concise</option><option>Balanced</option><option>Detailed</option></select></label></div><div className="notice"><LockKeyhole size={17} /><div><b>Free local setup</b><p>Install Ollama on this computer, then run <code>ollama pull qwen2.5:3b</code>. Allow this deployed origin in Ollama’s <code>OLLAMA_ORIGINS</code> setting and restart Ollama. Model generation uses your computer and has no API usage fee.</p><a href="https://ollama.com/download" target="_blank" rel="noreferrer">Download Ollama <ExternalLink size={12} /></a></div></div><div className="actions"><button className="primary" disabled={busy} onClick={check}>{busy ? <LoaderCircle className="spin" /> : <KeyRound size={16} />}Check server connection</button><button className="secondary" onClick={() => setPage('Live Copilot')}>Test an answer</button></div></div><div className="panel"><h2>Privacy & permitted use</h2><p>Question prompts are sent to Ollama running on this computer; the app does not call a paid AI API. TXT, DOCX and selectable PDF extraction runs locally. Uploaded audio transcription is disabled in free mode; use browser Voice practice for a free alternative. The app does not covertly capture microphone or system audio.</p></div></>}{page === 'Live Copilot' && <><div className="page-title"><p className="eyebrow">PRACTICE MODE</p><h1>AI Answer Companion</h1><p>Type a question and generate an answer with free local Ollama AI. This app does not secretly capture call audio.</p></div><section className="panel voice-practice"><div className="section-title"><h2><Mic />Voice practice</h2><span className={'pill ' + (voiceListening ? 'ok' : '')}>{voiceListening ? 'MIC ON' : 'MIC OFF'}</span></div><p>For a consent-based mock interview: start listening, let your friend ask a question in the room, then pause. The browser will transcribe speech and answer question-like phrases after about 1.5 seconds of silence.</p><p><b>Limitations:</b> this uses your microphone, does not identify which person is speaking, and may not hear a remote participant when you use headphones. Speech recognition availability and language support depend on Chrome and browser settings.</p><div className="actions">{!voiceListening ? <button className="primary" onClick={startVoicePractice}><Mic size={16} />Start voice practice</button> : <button className="secondary" onClick={stopVoicePractice}><X size={16} />Stop listening</button>}<span className="pill">{voiceStatus}</span></div>{voiceTranscript && <div className="result"><b>Live transcript</b><p>{voiceTranscript}</p></div>}</section><div className="two-col"><section className="panel"><h2><MessageSquare />Ask a question</h2><label className="field-label">Interview question<textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="How does HashMap work internally in Java?" /></label><div className="actions"><button className="primary" disabled={busy || !question.trim()} onClick={() => ask()}>{busy ? <LoaderCircle className="spin" /> : <Sparkles size={16} />}Generate answer</button><button className="secondary" disabled={!question.trim()} onClick={() => setAudioText(question)}>Use as transcript</button></div><label className="field-label spacer">Question file (TXT, DOCX, PDF)</label><div className="upload"><FileUp /><input type="file" accept=".txt,.md,.docx,.pdf" onChange={e => setFile(e, 'question')} /><span>{fileName || 'Choose a question file (8 MB max)'}</span></div><div className="notice spacer"><Mic size={17} /><div><b>Free audio practice</b><p>Use Voice practice above for browser speech recognition. Audio-file transcription is not included in the free app.</p></div></div>{audioText && <div className="result"><h2>Transcript / input</h2><textarea value={audioText} onChange={e => setAudioText(e.target.value)} /><div className="actions"><button className="secondary" onClick={() => setQuestion(audioText)}>Use transcript as question</button><button className="secondary" onClick={() => ask(audioText)}>Generate answer from transcript <ArrowRight size={14} /></button></div></div>}</section><section className="panel"><div className="section-title"><h2><Sparkles />AI-generated answer</h2><span className="pill">{answer ? 'REAL RESPONSE' : 'AWAITING INPUT'}</span></div>{busy ? <div className="empty"><LoaderCircle className="spin" /><p>Generating response…</p></div> : answer ? <><div className="answer">{answer}</div><div className="actions"><button className="secondary" onClick={() => navigator.clipboard.writeText(answer)}><Copy size={15} />Copy answer</button></div></> : <div className="empty"><MessageSquare /><p>Ask a question to generate an answer.</p><small>Demo text is never passed off as a real result.</small></div>}</section></div></>}{page === 'Interview Prep' && <><div className="page-title"><p className="eyebrow">BE READY FOR THE ROLE</p><h1>Interview Prep</h1><p>Extract a resume and match it to the target job description.</p></div><div className="two-col"><section className="panel"><h2><FileText />Your resume</h2><label className="field-label">Upload resume</label><div className="upload"><Upload /><input type="file" accept=".txt,.md,.docx,.pdf" onChange={e => setFile(e, 'resume')} /><span>{fileName || 'TXT, DOCX or selectable-text PDF (8 MB max)'}</span></div><label className="field-label spacer">Resume text</label><textarea value={resume} onChange={e => setResume(e.target.value)} placeholder="Paste experience, skills, projects…" /></section><section className="panel"><h2><BriefcaseBusiness />Target role</h2><label className="field-label">Job description</label><textarea value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the role, responsibilities and required skills…" /><button className="primary full spacer" disabled={busy || !resume.trim() || !jd.trim()} onClick={makePrep}>{busy ? <LoaderCircle className="spin" /> : <Sparkles size={15} />}Generate AI preparation plan</button></section></div>{prep && <div className="panel result"><h2><Sparkles />Your preparation plan</h2><pre>{prep}</pre></div>}</>}{page === 'Question Analyzer' && <><div className="page-title"><p className="eyebrow">BREAK DOWN THE QUESTION</p><h1>Question Analyzer</h1><p>Analyze the question text entered or extracted from a file.</p></div><div className="two-col"><section className="panel"><h2><ScanLine />Question input</h2><textarea value={analysisQ} onChange={e => setAnalysisQ(e.target.value)} placeholder="Paste the question to understand…" /><div className="upload spacer"><FileUp /><input type="file" accept=".txt,.md,.docx,.pdf,.png,.jpg,.jpeg,.webp" onChange={e => setFile(e, 'analyzer')} /><span>{fileName || 'TXT, DOCX, text PDF or screenshot'}</span></div><button className="primary full spacer" disabled={busy || !analysisQ.trim()} onClick={analyze}>{busy ? <LoaderCircle className="spin" /> : <Sparkles size={16} />}Analyze question</button></section><section className="panel"><h2><Sparkles />Analysis</h2>{analysis ? <pre className="result-text">{analysis}</pre> : <div className="empty"><BookOpen /><p>Analysis appears after a successful AI response.</p></div>}</section></div></>}{page === 'History' && <><div className="page-title"><p className="eyebrow">YOUR PRACTICE NOTES</p><h1>AI answer history</h1><p>Results stay in this tab until reload.</p></div>{history.length ? <div className="stack">{history.map((h, i) => <article className="panel" key={i}><div className="section-title"><h2>{h.q}</h2><span className="pill">{h.time}</span></div><pre className="result-text">{h.a}</pre><button className="secondary" onClick={() => navigator.clipboard.writeText(h.a)}><Copy size={15} />Copy answer</button></article>)}<button className="secondary" onClick={() => setHistory([])}><Trash2 size={15} />Clear history</button></div> : <div className="panel empty"><History /><p>No generated answers yet.</p></div>}</>}{error && <div className="error global-error" role="alert"><AlertTriangle size={16} />{error}</div>}{notice && <div className="toast"><CheckCircle2 size={17} />{notice}</div>}</div></main></div>;
}
