import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
];

const VENUES = [
  'MetLife Stadium, NJ', 'AT&T Stadium, TX', 'SoFi Stadium, CA',
  'Estadio Azteca, Mexico City', 'BC Place, Vancouver', "Levi's Stadium, CA",
];

const SUGGESTIONS = {
  en: ['Where is the nearest restroom?', 'How do I get to Gate C?', 'Where can I buy food?'],
  es: ['¿Dónde está el baño más cercano?', '¿Cómo llego a la Puerta C?', '¿Dónde puedo comprar comida?'],
  fr: ['Où sont les toilettes?', 'Comment aller à la Porte C?', 'Où puis-je acheter à manger?'],
  ar: ['أين أقرب دورة مياه؟', 'كيف أصل إلى البوابة C؟', 'أين يمكنني شراء الطعام؟'],
  pt: ['Onde fica o banheiro?', 'Como chego ao Portão C?', 'Onde posso comprar comida?'],
};

function FanChat({ api }) {
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [venue, setVenue] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0 || loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  useEffect(() => {
    const prefill = location.state?.prefillVenue;
    if (prefill && VENUES.includes(prefill)) {
      setVenue(prefill);
    }
  }, [location.state]);

  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setError('');
    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch(`${api}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, language, venue, history: messages.slice(-6) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong.'); setLoading(false); return; }
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setError('Could not connect to server. Please try again.');
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [input, loading, messages, language, venue, api]);

  const currentLang = LANGUAGES.find(l => l.code === language);

  return (
    <main className="flex-grow flex flex-col px-container-margin py-md w-full max-w-[1200px] mx-auto overflow-hidden relative">
      <div className="flex justify-between items-center mb-md z-10 w-full max-w-2xl mx-auto gap-sm">
        <div className="relative flex-1">
          <select
            id="language-select"
            aria-label="Language"
            className="w-full bg-surface-container/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 font-label-sm text-label-sm text-on-surface appearance-none cursor-pointer shadow-lg hover:bg-surface-container/80 transition-colors"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1">
          <select
            id="venue-select"
            aria-label="Your venue"
            className="w-full bg-surface-container/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 font-label-sm text-label-sm text-on-surface appearance-none cursor-pointer shadow-lg hover:bg-surface-container/80 transition-colors"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          >
            <option value="">Select your stadium...</option>
            {VENUES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-grow flex flex-col bg-surface-container-low/40 backdrop-blur-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl relative w-full max-w-2xl mx-auto">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
          <div className="absolute -top-[100px] -right-[100px] w-[300px] h-[300px] bg-secondary-fixed/20 blur-[100px] rounded-full mix-blend-screen" />
          <div className="absolute -bottom-[100px] -left-[100px] w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-full mix-blend-screen" />
        </div>

        <div
          role="log"
          aria-live="polite"
          aria-label="Chat conversation"
          aria-relevant="additions"
          className="flex-grow overflow-y-auto p-md flex flex-col gap-md z-10 relative min-h-[320px]"
        >
          {messages.length === 0 && (
            <div className="flex-grow flex flex-col items-center justify-center text-center gap-sm py-xl">
              <span className="text-[52px]">🏟️</span>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
                Ask me anything about FIFA World Cup 2026 in {currentLang?.name}!
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            m.role === 'user' ? (
              <div key={i} className="flex justify-end mb-2">
                <div className="bg-secondary-fixed text-on-secondary-fixed rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] shadow-[0_4px_20px_rgba(195,244,0,0.2)]">
                  <p className="font-body-md text-body-md font-medium">{m.content}</p>
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-start items-end gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-white/10 shrink-0 text-xl shadow-lg">
                  ⚽
                </div>
                <div className="bg-surface-container-high/80 backdrop-blur-md border border-white/10 text-on-surface rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-lg">
                  <p className="font-body-md text-body-md">{m.content}</p>
                </div>
              </div>
            )
          ))}

          {loading && (
            <div className="flex justify-start items-end gap-3 mb-2 opacity-70">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center border border-white/10 shrink-0 text-xl shadow-lg">
                ⚽
              </div>
              <div className="bg-surface-container-high/80 backdrop-blur-md border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="mx-md mb-2 bg-error-container/20 border border-error/30 rounded-lg p-3 text-error font-body-md text-sm z-10 relative">
            {error}
          </div>
        )}

        {messages.length === 0 && (
          <div
            role="group"
            aria-label="Suggested questions"
            className="px-md pb-xs pt-2 flex overflow-x-auto gap-2 no-scrollbar z-10 bg-gradient-to-t from-surface-container-low/90 to-transparent"
          >
            {(SUGGESTIONS[language] || SUGGESTIONS.en).map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="whitespace-nowrap px-4 py-1.5 rounded-full bg-surface-variant/40 border border-white/10 text-on-surface font-label-sm text-label-sm hover:bg-surface-variant/80 hover:border-secondary-fixed/50 transition-all shadow-sm"
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="p-md pt-xs z-10 bg-surface-container-low/90 backdrop-blur-md">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={`Ask in ${currentLang?.name}...`}
              maxLength={500}
              aria-label={`Type your question in ${currentLang?.name}`}
              className="w-full bg-[#000000] border border-outline/30 text-on-surface rounded-full py-3 pl-4 pr-12 focus:outline-none focus:border-secondary-fixed focus:ring-1 focus:ring-secondary-fixed/50 transition-all font-body-md text-body-md placeholder:text-on-surface-variant/50 shadow-inner"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center hover:bg-secondary-fixed-dim transition-colors shadow-[0_0_10px_rgba(195,244,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

FanChat.propTypes = {
  api: PropTypes.string.isRequired,
};

export default FanChat;