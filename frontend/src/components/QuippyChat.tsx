import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError, streamText } from '@/lib/api';
import type { QuippyMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';

const STARTER_PROMPTS = [
  'We have a combi oven error. What should we check first?',
  'Help us compare espresso machines for a busy café.',
  'Let us find training for the team on kitchen equipment.',
  'We need an introduction to another hospitality professional.',
] as const;

type QuippyMood = 'neutral' | 'thinking' | 'happy' | 'concerned' | 'excited';

const MOOD_EMOJI: Record<QuippyMood, string> = {
  neutral: '😊',
  thinking: '🤔',
  happy: '😄',
  concerned: '😟',
  excited: '🤩',
};

function inferMood(text: string, busy: boolean): QuippyMood {
  if (busy) return 'thinking';
  if (!text) return 'neutral';
  const lower = text.toLowerCase();
  if (/error|broken|fail|issue|problem|danger|safety/i.test(lower)) return 'concerned';
  if (/great|congrat|well done|earned|completed|nice/i.test(lower)) return 'excited';
  if (/course|training|learn|credential/i.test(lower)) return 'happy';
  return 'neutral';
}

/**
 * QUIPPY kitchen partner chat widget. Rendered once at the app root.
 * Hidden on unauthenticated and admin routes.
 */
const QuippyChat = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<QuippyMessage[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [input, setInput] = useState('');
  const [streamingAssistant, setStreamingAssistant] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamingAssistantRef = useRef('');
  streamingAssistantRef.current = streamingAssistant;

  const lastAssistantText = [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? '';
  const mood = inferMood(streamingAssistant || lastAssistantText, busy);

  const hideOn =
    !user ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/onboarding') ||
    location.pathname === '/login' ||
    location.pathname === '/signup';

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const { messages, configured } = await api<{
          messages: QuippyMessage[];
          configured: boolean;
        }>('/api/quippy/conversation', { auth: true });
        if (cancelled) return;
        setMessages(messages);
        setConfigured(configured);
      } catch (e) {
        if (!cancelled) setErr(e instanceof ApiError ? e.message : 'Could not load chat.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streamingAssistant, open]);

  if (hideOn) return null;

  const send = async () => {
    const content = input.trim();
    if (!content || busy) return;
    setBusy(true);
    setErr(null);
    setInput('');
    const optimistic: QuippyMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setStreamingAssistant('');
    try {
      await streamText('/api/quippy/message', { content }, (delta) => {
        setStreamingAssistant((s) => s + delta);
      });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'QUIPPY could not respond.');
    } finally {
      const finalText = streamingAssistantRef.current;
      if (finalText.trim()) {
        setMessages((m) => [
          ...m,
          {
            id: `srv-${Date.now()}`,
            role: 'assistant',
            content: finalText,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
      setStreamingAssistant('');
      setBusy(false);
    }
  };

  return (
    <>
      {/* ── FAB with mood ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Open QUIPPY kitchen partner"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-secondary text-secondary-foreground shadow-lg hover:opacity-90 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-transform"
        style={{ transform: open ? 'scale(0.9)' : 'scale(1)' }}
      >
        {open ? (
          <X className="w-5 h-5" aria-hidden />
        ) : (
          <span className="text-xl" role="img" aria-label={`QUIPPY is ${mood}`}>
            {MOOD_EMOJI[mood]}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            role="dialog"
            aria-label="QUIPPY kitchen partner"
            className="fixed bottom-24 right-5 z-40 w-[min(400px,calc(100vw-32px))] h-[min(560px,calc(100vh-140px))] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
          >
            {/* ── Header with mood ── */}
            <header className="px-4 py-3 border-b border-border flex items-center justify-between" style={{ background: '#00182E' }}>
              <div className="flex items-center gap-2.5">
                <span className="text-lg" role="img" aria-label={`QUIPPY is ${mood}`}>
                  {MOOD_EMOJI[mood]}
                </span>
                <div>
                  <p className="text-sm font-bold font-display text-white">QUIPPY</p>
                  <p className="text-[10px] text-white/60">Kitchen partner · private</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close QUIPPY"
                className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" aria-hidden />
              </button>
            </header>

            {/* ── Messages ── */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {configured === false && (
                <p className="text-sm text-muted-foreground">
                  QUIPPY is warming up — check back soon.
                </p>
              )}
              {configured !== false && messages.length === 0 && !streamingAssistant && (
                <div className="text-sm text-muted-foreground">
                  <p className="mb-3">
                    I am QUIPPY, your kitchen partner. Start with a real situation — we will sort it together.
                  </p>
                  <div className="flex flex-col gap-2">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => {
                          setInput(prompt);
                          inputRef.current?.focus();
                        }}
                        className="rounded-xl border border-border bg-background px-3 py-2.5 text-left text-xs text-foreground hover:bg-muted hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <Bubble key={m.id} role={m.role} content={m.content} />
              ))}
              {streamingAssistant && <Bubble role="assistant" content={streamingAssistant} pending />}
              {err && (
                <div role="alert" className="text-xs text-destructive">
                  <p>{err}</p>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.focus()}
                    className="mt-1 underline underline-offset-2"
                  >
                    Edit and retry
                  </button>
                </div>
              )}
            </div>

            {/* ── Input ── */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="border-t border-border p-3 flex items-center gap-2"
            >
              <label htmlFor="quippy-input" className="sr-only">
                Ask QUIPPY
              </label>
              <input
                id="quippy-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={busy || configured === false}
                placeholder={configured === false ? 'QUIPPY offline' : 'What are we working on?'}
                className="flex-1 h-10 px-4 rounded-full border-2 border-border bg-background text-sm focus:outline-none focus:border-primary disabled:opacity-60"
              />
              <Button
                type="submit"
                size="sm"
                className="rounded-full"
                disabled={busy || !input.trim() || configured === false}
              >
                <Send className="w-4 h-4" aria-hidden />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

const Bubble = ({
  role,
  content,
  pending,
}: {
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
}) =>
  role === 'user' ? (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2 text-sm whitespace-pre-wrap text-white" style={{ background: '#00182E' }}>
        {content}
      </div>
    </div>
  ) : (
    <div className="flex justify-start">
      <div className="max-w-[85%] bg-muted text-foreground rounded-2xl rounded-bl-md px-4 py-2 text-sm whitespace-pre-wrap">
        {content}
        {pending && <span className="inline-block ml-1 animate-pulse">▍</span>}
      </div>
    </div>
  );

export default QuippyChat;
