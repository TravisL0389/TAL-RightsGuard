'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Bot, Loader2, RotateCcw, Send, Sparkles, User } from 'lucide-react';
import Markdown from 'react-markdown';
import { quickPrompts } from '@/lib/rights-data';

type ChatMessage = {
  role: 'user' | 'model';
  text: string;
};

const initialMessage: ChatMessage = {
  role: 'model',
  text: 'Tell me which AI music platform you used, what you wrote or changed yourself, and whether you plan to release, register, or monetize the track. I will separate composition rights, recording rights, and platform license issues for you.',
};

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setError('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const nextMessages = [...messages, { role: 'user' as const, text: userMsg }];
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? 'Unable to reach the analysis service.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const chunk = await reader.read();
        done = chunk.done;
        const text = decoder.decode(chunk.value || new Uint8Array(), { stream: !done });

        if (!text) continue;

        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          updated[lastIndex] = {
            ...updated[lastIndex],
            text: updated[lastIndex].text + text,
          };
          return updated;
        });
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error';
      setError(detail);
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex]?.role === 'model' && updated[lastIndex]?.text === '') {
          updated[lastIndex] = {
            role: 'model',
            text: 'I could not complete that analysis. Check the Gemini server configuration and try again.',
          };
          return updated;
        }
        return [...updated, { role: 'model', text: 'I could not complete that analysis. Check the Gemini server configuration and try again.' }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrompt = (prompt: string) => {
    setInput(prompt);
  };

  const handleReset = () => {
    setMessages([initialMessage]);
    setInput('');
    setError('');
  };

  return (
    <div className="flex h-full flex-col bg-transparent">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-emerald-100">
              <Sparkles className="h-3.5 w-3.5" />
              Rights analysis
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/62">
              Ask about ownership, commercial release rights, registration language, or the latest platform terms for a specific AI music tool.
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 self-start rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm font-medium text-white/72 transition hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Reset chat
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handlePrompt(prompt)}
              className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-left text-xs leading-5 text-white/70 transition hover:border-emerald-300/25 hover:bg-emerald-300/10 hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                msg.role === 'user' ? 'ml-3 bg-white text-slate-950' : 'mr-3 bg-emerald-300/14 text-emerald-100'
              }`}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`rounded-[22px] px-5 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)] ${
                msg.role === 'user' 
                  ? 'rounded-tr-none bg-white text-slate-950' 
                  : 'rounded-tl-none border border-white/10 bg-white/8 text-white backdrop-blur-xl'
              }`}>
                {msg.role === 'user' ? (
                  <p className="text-sm leading-6">{msg.text}</p>
                ) : (
                  <div className="prose prose-sm max-w-none text-white prose-headings:text-white prose-p:leading-7 prose-strong:text-emerald-100 prose-li:text-white/78 prose-a:text-emerald-200">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] flex-row">
              <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-300/14 text-emerald-100">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center space-x-2 rounded-[22px] rounded-tl-none border border-white/10 bg-white/8 px-5 py-4 text-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-200" />
                <span className="text-sm">Reviewing rights, licensing, and release exposure...</span>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-white/10 px-4 py-4">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative mx-auto flex max-w-4xl items-end gap-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Example: I used Udio, rewrote the chorus, recorded vocals, and want to release the song commercially. What rights do I have?"
            rows={1}
            className="min-h-[60px] flex-1 resize-none rounded-[28px] border border-white/12 bg-white/7 px-5 py-4 pr-14 text-sm leading-6 text-white placeholder:text-white/30 focus:border-emerald-300/30 focus:outline-none focus:ring-2 focus:ring-emerald-300/20"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="absolute bottom-3 right-3 rounded-full bg-white p-2 text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-3 text-center">
          <p className="text-[11px] tracking-wide text-white/35">
            RightsGuard AI can make mistakes. Verify important legal information and review current platform terms directly.
          </p>
        </div>
      </div>
    </div>
  );
}
