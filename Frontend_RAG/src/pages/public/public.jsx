import { useState, useRef, useEffect } from "react";
import { PublicSidebar } from "./PublicSidebar.jsx";
import { AppLogo, AIAvatar } from "../../components/Logo.jsx";
import TypewriterText from "../../components/TypewriterText.jsx";

const STARTER_QUESTIONS = [
  { icon: "⚖️", text: "Quels sont les droits du salarié en cas de licenciement ?" },
  { icon: "🏖️", text: "Combien de jours de congé annuel a droit un salarié ?" },
  { icon: "💰", text: "Comment est calculée l'indemnité de licenciement ?" },
  { icon: "📋", text: "Quelles sont les obligations de l'employeur envers le salarié ?" },
];

const BASE_URL = "http://localhost:5000";

export const Public = () => {
  const [messages, setMessages]           = useState([]);
  const [newMessage, setNewMessage]       = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [copiedIdx, setCopiedIdx]         = useState(null);
  const messagesEndRef    = useRef(null);
  const chatContainerRef  = useRef(null);
  const textareaRef       = useRef(null);
  const abortControllerRef = useRef(null);
  const userScrolledRef   = useRef(false);

  // Scroll when a new message is added
  useEffect(() => {
    if (messages.length === 0) return;
    userScrolledRef.current = false;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Auto-scroll on any DOM content change (covers server stream + TypewriterText animation)
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const mo = new MutationObserver(() => {
      if (!userScrolledRef.current) container.scrollTop = container.scrollHeight;
    });
    mo.observe(container, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  const sendMessage = async (text) => {
    const msg = text.trim();
    if (!msg || loadingResponse) return;

    setMessages((p) => [
      ...p,
      { role: "user", content: msg },
      { role: "assistant", content: "", streaming: true },
    ]);
    setNewMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "28px";
    setLoadingResponse(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${BASE_URL}/api/public/response-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";
      let fullAnswer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const eventBlocks = buffer.split('\n\n');
        buffer = eventBlocks.pop();
        for (const block of eventBlocks) {
          const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
          if (!dataLine) continue;
          try {
            const data = JSON.parse(dataLine.slice(6));
            if (data.type === 'token') {
              fullAnswer += data.token;
              const snapshot = fullAnswer;
              setMessages((p) => {
                const msgs = [...p];
                const last = msgs[msgs.length - 1];
                if (last?.role === 'assistant' && last.streaming)
                  return [...msgs.slice(0, -1), { ...last, content: snapshot }];
                return msgs;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages((p) => {
          const msgs = [...p];
          const last = msgs[msgs.length - 1];
          if (last?.role === 'assistant' && last.streaming)
            return [...msgs.slice(0, -1), { ...last, content: "Oops ! Une erreur est survenue. Réessayez.", streaming: false }];
          return msgs;
        });
      }
    } finally {
      setMessages((p) => {
        const msgs = [...p];
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant' && last.streaming)
          return [...msgs.slice(0, -1), { ...last, streaming: false }];
        return msgs;
      });
      setLoadingResponse(false);
    }
  };

  const stopGeneration = () => abortControllerRef.current?.abort();

  const copyMsg = async (content, idx) => {
    await navigator.clipboard.writeText(content).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleChange = (e) => {
    setNewMessage(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight, 220)}px`; }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <PublicSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Header */}
        <header className="flex-shrink-0 flex items-center gap-3 px-5 py-2.5 bg-slate-50 border-b border-slate-100 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 text-[15px]">Chat public</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {messages.length > 0
                ? `${messages.length} message${messages.length > 1 ? "s" : ""}`
                : "Sans compte requis"}
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Non sauvegardé
          </div>
        </header>

        {/* Messages */}
        <div
          ref={chatContainerRef}
          onClick={() => setSidebarOpen(false)}
          onScroll={() => {
            const el = chatContainerRef.current;
            if (!el) return;
            userScrolledRef.current = (el.scrollHeight - el.scrollTop - el.clientHeight) > 80;
          }}
          className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 px-4 md:px-10 lg:px-20 xl:px-36 py-8 space-y-5"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-8 animate-fade-in">
              <div className="text-center">
                <div className="flex justify-center mb-5">
                  <AppLogo size="xl" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Comment puis-je vous aider ?</h2>
                <p className="text-slate-400 text-sm">Posez n'importe quelle question — aucun compte requis.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg animate-fade-in delay-100">
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q.text}
                    onClick={() => sendMessage(q.text)}
                    className="group flex items-center gap-3 text-left px-4 py-3.5 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl text-sm text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <span className="text-lg flex-shrink-0">{q.icon}</span>
                    <span className="font-medium">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, idx) => {
                const isUser = m.role === "user";
                const rtl    = /[؀-ۿ]/.test(m.content ?? "");
                return (
                  <div key={idx} className={`flex gap-3 group animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
                      isUser
                        ? "bg-gradient-to-br from-green-700 to-slate-900"
                        : "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-100"
                    }`}>
                      {isUser ? "G" : <AIAvatar className="w-8 h-8" />}
                    </div>

                    {/* Bubble + actions */}
                    <div className={`flex flex-col gap-1.5 min-w-0 ${isUser ? "max-w-[72%] items-end" : "max-w-[90%] sm:max-w-[72%] items-start"}`}>
                      <div className={`w-full px-4 py-3 rounded-2xl text-[15px] leading-relaxed [overflow-wrap:anywhere] ${
                        isUser ? "bubble-user rounded-br-none" : "bubble-ai rounded-bl-none"
                      }`}>
                        {isUser
                          ? m.content
                          : <TypewriterText content={m.content ?? ""} streaming={!!m.streaming} rtl={rtl} />
                        }
                      </div>

                      {/* Copy */}
                      {!m.streaming && (
                        <button
                          onClick={() => copyMsg(m.content, idx)}
                          className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg transition-all ${
                            copiedIdx === idx
                              ? "text-emerald-600 bg-emerald-50"
                              : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100"
                          }`}
                        >
                          {copiedIdx === idx ? (
                            <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Copié</>
                          ) : (
                            <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Copier</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 md:px-10 lg:px-20 xl:px-36 py-4 bg-white">
          <div className="input-card flex items-end gap-3 px-4 py-3">
            <textarea
              ref={textareaRef}
              rows={1}
              disabled={loadingResponse}
              className={`flex-1 resize-none min-h-[28px] max-h-[200px] bg-transparent text-[15px] text-slate-900 placeholder-slate-400 focus:outline-none [overflow-wrap:anywhere] ${
                loadingResponse ? "opacity-50 cursor-not-allowed" : ""
              }`}
              placeholder="Posez votre question… (Entrée pour envoyer)"
              value={newMessage}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(newMessage); }
              }}
            />
            {loadingResponse ? (
              <button
                onClick={stopGeneration}
                className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-red-100 transition-all flex-shrink-0 hover:scale-105 active:scale-95"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => sendMessage(newMessage)}
                disabled={!newMessage.trim()}
                className={`w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-100 transition-all flex-shrink-0 ${
                  !newMessage.trim() ? "opacity-40 cursor-not-allowed" : "hover:scale-105 active:scale-95"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-2">
            Shift+Entrée pour une nouvelle ligne
          </p>
        </div>
      </div>
    </div>
  );
};
