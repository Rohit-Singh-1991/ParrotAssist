import React, { useEffect, useRef, useState } from 'react';
import { AudioLines, Monitor, RefreshCw, Square, LoaderCircle, ShieldCheck, Sparkles } from 'lucide-react';

type DesktopSource = { id: string; name: string; type: string; thumbnail: string; appIcon: string };
type Props = { onQuestion: (spokenQuestion: string, screenText: string) => Promise<void> | void };
type Asr = (audio: { array: Float32Array; sampling_rate: number }, options?: Record<string, unknown>) => Promise<{ text?: string }>;


export default function DesktopMeetingPanel({ onQuestion }: Props) {
  const desktop = Boolean(window.interviewMateDesktop?.isDesktop);
  const [sources, setSources] = useState<DesktopSource[]>([]);
  const [sourceId, setSourceId] = useState('');
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(desktop ? 'Choose the meeting display to begin' : 'Available in the Windows desktop app');
  const [transcript, setTranscript] = useState('');
  const [screenText, setScreenText] = useState('');
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const workerRef = useRef<any>(null);
  const asrRef = useRef<Asr | null>(null);
  const timerRef = useRef<number | null>(null);
  const activeRef = useRef(false);
  const scanningRef = useRef(false);
  const submittedRef = useRef('');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const cycleTimerRef = useRef<number | null>(null);
  const onQuestionRef = useRef(onQuestion);
  onQuestionRef.current = onQuestion;

  const refreshSources = async () => {
    if (!window.interviewMateDesktop) return;
    try {
      const result = await window.interviewMateDesktop.listSources();
      setSources(result);
      if (!sourceId && result.length) setSourceId(result.find(s => s.type === 'screen')?.id || result[0].id);
      setStatus(result.length ? 'Select the meeting screen/window, then start capture' : 'No shareable windows found. Open the meeting first.');
    } catch (error) {
      setStatus('Could not list desktop sources: ' + (error instanceof Error ? error.message : 'unknown error'));
    }
  };

  const transcribeBlob = async (blob: Blob) => {
    if (!asrRef.current || blob.size < 1200 || !activeRef.current) return;
    try {
      const audioContext = new AudioContext();
      try {
        const decoded = await audioContext.decodeAudioData(await blob.arrayBuffer());
        const length = Math.ceil(decoded.duration * 16000);
        if (!length) return;
        const offline = new OfflineAudioContext(1, length, 16000);
        const source = offline.createBufferSource();
        source.buffer = decoded;
        source.connect(offline.destination);
        source.start();
        const resampled = await offline.startRendering();
        const samples = resampled.getChannelData(0);
        const result = await asrRef.current({ array: samples, sampling_rate: 16000 }, { language: 'english', task: 'transcribe' });
        const text = (result.text || '').trim();
        if (!text || !activeRef.current) return;
        setTranscript(current => (current + ' ' + text).trim().slice(-6000));
        setStatus('Local transcription active · checking for a question');
        const looksLikeQuestion = /\?|\b(what|why|how|when|where|who|which|explain|define|describe|compare|difference|can you|could you|tell me|write|implement|solve|walk me through)\b/i.test(text);
        const normalized = text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        if (looksLikeQuestion && normalized.length > 12 && normalized !== submittedRef.current) {
          submittedRef.current = normalized;
          setStatus('Question detected · generating answer from speech + screen');
          void onQuestionRef.current(text, screenTextRef.current);
        }
      } finally {
        await audioContext.close().catch(() => {});
      }
    } catch (error) {
      setStatus('Audio chunk could not be decoded; retrying: ' + (error instanceof Error ? error.message : 'unknown error'));
    }
  };

  const startAudioCycle = () => {
    if (!activeRef.current || !streamRef.current?.getAudioTracks().length) return;
    try {
      const audioStream = new MediaStream(streamRef.current.getAudioTracks());
      const recorder = new MediaRecorder(audioStream);
      recorderRef.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        if (activeRef.current && chunks.length) await transcribeBlob(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
        if (activeRef.current) cycleTimerRef.current = window.setTimeout(startAudioCycle, 100);
      };
      recorder.start();
      cycleTimerRef.current = window.setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 6000);
    } catch (error) {
      setStatus('Could not start desktop audio recording: ' + (error instanceof Error ? error.message : 'unknown error'));
      stopSession();
    }
  };

  const scanScreen = async () => {
    if (scanningRef.current || !videoRef.current || !workerRef.current || !activeRef.current) return;
    scanningRef.current = true;
    const canvas = document.createElement('canvas');
    try {
      const video = videoRef.current;
      if (!video.videoWidth || !video.videoHeight) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const result = await workerRef.current.recognize(canvas);
      const text = (result.data.text || '').trim().slice(0, 10000);
      if (text && text !== screenTextRef.current) {
        screenTextRef.current = text;
        setScreenText(text);
        setStatus('Screen OCR refreshed · local processing');
      }
    } catch {
      setStatus('Screen OCR will retry on the next frame');
    } finally {
      canvas.width = 0;
      canvas.height = 0;
      scanningRef.current = false;
    }
  };

  const startSession = async () => {
    if (!window.interviewMateDesktop || !sourceId) return;
    setBusy(true);
    setStatus('Loading free local speech model (first launch downloads model files)…');
    try {
      if (!asrRef.current) {
        const { pipeline } = await import('@huggingface/transformers');
        asrRef.current = await pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny.en', { device: 'wasm' }) as unknown as Asr;
      }
      setStatus('Requesting the selected display and system audio…');
      const constraints = {
        audio: { mandatory: { chromeMediaSource: 'desktop' } },
        video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: sourceId, maxWidth: 1600, maxHeight: 900, maxFrameRate: 2 } }
      } as unknown as MediaStreamConstraints;
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!stream.getAudioTracks().length) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('This source did not provide system audio. On Windows, select the full screen and ensure the meeting audio is playing.');
      }
      const video = document.createElement('video');
      video.muted = true;
      video.srcObject = stream;
      await video.play();
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      streamRef.current = stream;
      videoRef.current = video;
      workerRef.current = worker;
      activeRef.current = true;
      setActive(true);
      setBusy(false);
      setStatus('Live desktop capture active · system audio + screen OCR');
      stream.getTracks().forEach(track => track.addEventListener('ended', stopSession, { once: true }));
      await scanScreen();
      timerRef.current = window.setInterval(() => { void scanScreen(); }, 5000);
      startAudioCycle();
    } catch (error) {
      setBusy(false);
      setStatus('Could not start live capture: ' + (error instanceof Error ? error.message : 'unknown error'));
      stopSession();
    }
  };

  function stopSession() {
    activeRef.current = false;
    setActive(false);
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    if (cycleTimerRef.current !== null) window.clearTimeout(cycleTimerRef.current);
    timerRef.current = null;
    cycleTimerRef.current = null;
    try { if (recorderRef.current?.state === 'recording') recorderRef.current.stop(); } catch { /* already stopped */ }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.srcObject = null; videoRef.current = null; }
    if (workerRef.current) { void workerRef.current.terminate().catch(() => {}); workerRef.current = null; }
    screenTextRef.current = '';
    setScreenText('');
    setStatus('Capture stopped');
  }

  useEffect(() => {
    if (desktop) void refreshSources();
    return () => {
      activeRef.current = false;
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      if (cycleTimerRef.current !== null) window.clearTimeout(cycleTimerRef.current);
      try { if (recorderRef.current?.state === 'recording') recorderRef.current.stop(); } catch { /* ignore */ }
      streamRef.current?.getTracks().forEach(track => track.stop());
      if (workerRef.current) void workerRef.current.terminate().catch(() => {});
    };
  // Refresh only when this panel mounts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktop]);

  return <section className="panel desktop-session">
    <div className="section-title"><h2><Monitor />Desktop live meeting session</h2><span className={'pill ' + (active ? 'ok' : '')}>{active ? 'CAPTURING' : desktop ? 'DESKTOP' : 'DESKTOP ONLY'}</span></div>
    <p>On Windows, select the full display (not just a single window) to maximize system-audio loopback compatibility, combining system-audio transcription (local Whisper model) with visible screen/code OCR. Both inputs are processed on your computer; detected questions are sent to your configured local Ollama model.</p>
    {!desktop ? <div className="notice"><ShieldCheck size={17}/><div><b>Windows desktop app required</b><p>This capability uses OS-level capture APIs and is intentionally unavailable in the browser build.</p></div></div> : <>
      <div className="actions">
        <select aria-label="Meeting display" value={sourceId} disabled={active || busy} onChange={event => setSourceId(event.target.value)} style={{flex:1,minWidth:180}}>
          <option value="">Choose screen/window…</option>
          {sources.map(source => <option key={source.id} value={source.id}>{source.type === 'screen' ? 'Screen' : 'Window'} — {source.name}</option>)}
        </select>
        <button className="secondary" disabled={active || busy} onClick={() => void refreshSources()}><RefreshCw size={15}/>Refresh</button>
        {!active ? <button className="primary" disabled={busy || !sourceId} onClick={() => void startSession()}>{busy ? <LoaderCircle className="spin" size={15}/> : <AudioLines size={15}/>}Start capture</button> : <button className="secondary" onClick={stopSession}><Square size={15}/>Stop capture</button>}<button className="secondary" disabled={!desktop} onClick={() => void window.interviewMateDesktop?.showAnswerWindow()}><Sparkles size={15}/>Open answer window</button>
      </div>
      <div className="notice spacer"><ShieldCheck size={17}/><div><b>Visible, permission-based capture</b><p>Capture is shown in the desktop app and stops when you press Stop or close the selected source. No hidden recording or participant-concealment mode is provided. The English Whisper model downloads on first use and then runs locally.</p></div></div>
      <div className="two-col spacer">
        <div className="result"><div className="label">Latest local transcript</div><p>{transcript || 'Waiting for speech…'}</p></div>
        <div className="result"><div className="label">Latest screen text (OCR)</div><p>{screenText || 'Waiting for readable screen text…'}</p></div>
      </div>
    </>}
    <p className="muted">{status}</p>
  </section>;
}
