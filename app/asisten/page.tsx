'use client';
/**
 * app/asisten/page.tsx — AI Asisten redesigned v2
 * Modern chat interface with suggested prompts and message bubbles.
 */
import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Sparkles, RefreshCw, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface Message { role: 'user' | 'assistant'; content: string; id: string; }

export default function AsistenPage() {
  const t = useTranslations('asisten');

  const SUGGESTIONS = [
    t('sug_1'),
    t('sug_2'),
    t('sug_3'),
    t('sug_4'),
    t('sug_5'),
    t('sug_6'),
  ];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: t('greeting'),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send(text?: string) {
    const content = text ?? input;
    if (!content.trim() || loading) return;
    setInput('');
    setLoading(true);

    const newMsg: Message = { id: Date.now().toString(), role: 'user', content };
    setMessages((prev) => [...prev, newMsg]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, newMsg].map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { id: Date.now().toString() + 'a', role: 'assistant', content: data.reply ?? t('err_cannot_answer') }]);
    } catch {
      setMessages((prev) => [...prev, { id: 'err', role: 'assistant', content: t('err_connection') }]);
    }
    setLoading(false);
  }

  function renderContent(text: string) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 border-b border-gray-200 pb-6">
        <div className="w-12 h-12 border border-primary-200 bg-primary-50 flex items-center justify-center shrink-0">
          <Bot className="w-6 h-6 text-primary-800" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-primary-900">DesaMind Asisten</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> {t('status_online')}
          </p>
        </div>
        <button onClick={() => setMessages([{ id: '0', role: 'assistant', content: t('reset_greeting') }])} className="ml-auto px-4 py-2 text-[9px] font-bold uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition flex items-center gap-2 text-gray-500">
          <RefreshCw className="w-3.5 h-3.5" /> {t('reset')}
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2">
        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex gap-4', msg.role === 'user' ? 'flex-row-reverse' : '')}>
            {/* Avatar */}
            <div className={cn('w-10 h-10 border flex items-center justify-center shrink-0 mt-1', msg.role === 'assistant' ? 'border-primary-200 bg-primary-50' : 'bg-primary-800 border-primary-900')}>
              {msg.role === 'assistant' ? <Bot className="w-5 h-5 text-primary-800" /> : <User className="w-5 h-5 text-white" />}
            </div>
            {/* Bubble */}
            <div className={cn('max-w-[80%] px-5 py-4 text-sm leading-relaxed border', msg.role === 'assistant' ? 'bg-white border-gray-200 text-gray-800' : 'bg-primary-800 text-white border-primary-900')}>
              <div dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 border border-primary-200 bg-primary-50 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-primary-800" />
            </div>
            <div className="bg-white border border-gray-200 px-5 py-4 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-primary-600 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('typing')}</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length <= 2 && !loading && (
        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> {t('faq')}
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 border border-gray-200 bg-white text-gray-500 hover:border-primary-400 hover:text-primary-800 hover:bg-primary-50 transition">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }}}
            placeholder={t('input_placeholder')}
            disabled={loading}
            className="w-full px-5 py-4 border border-gray-200 text-sm focus:outline-none focus:border-primary-600 transition disabled:opacity-60 bg-white"
          />
        </div>
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="px-6 py-4 bg-primary-800 hover:bg-primary-950 text-white transition disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
