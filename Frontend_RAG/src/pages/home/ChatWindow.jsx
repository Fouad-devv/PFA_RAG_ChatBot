import { useRef, useEffect, useState, useCallback } from "react";
import { useKeycloak } from "@react-keycloak/web";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { showToast } from "../../components/Toast";
import { AppLogo, AIAvatar } from "../../components/Logo.jsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

dayjs.extend(relativeTime);

const STARTER_QUESTIONS = [
  { icon: "⚖️", text: "Quels sont les droits du salarié en cas de licenciement ?" },
  { icon: "📄", text: "Quelle est la durée légale du travail au Maroc ?" },
  { icon: "🏖️", text: "Combien de jours de congé annuel a droit un salarié ?" },
  { icon: "💰", text: "Comment est calculée l'indemnité de licenciement ?" },
];

const MAX_CHARS = 4000;

const ChatWindow = ({
  messages,
  activeConversation,
  newMessage,
  setNewMessage,
  onSendMessage,
  onRegenerateResponse,
  onStopGeneration,
  loadingResponse,
  loadingMessages,
  setSidebarOpen,
  setOpenSpaceUser,
  openSpaceUser,
  onStarterQuestion,
}) => {
  const { keycloak } = useKeycloak();
  const username = keycloak.tokenParsed?.preferred_username || "User";
  const textareaRef     = useRef(null);
  const chatContainerRef = useRef(null);
  const messagesEndRef  = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [copiedId, setCopiedId]           = useState(null);

  // Scroll to bottom instantly when a conversation finishes loading
  useEffect(() => {
    if (!loadingMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loadingMessages]);

  // Scroll to bottom smoothly when a new message arrives
  useEffect(() => {
    if (messages.length === 0) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 160);
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length > MAX_CHARS) return;
    setNewMessage(val);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight, 220)}px`; }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || loadingResponse) return;
    await onSendMessage();
    if (textareaRef.current) textareaRef.current.style.height = "28px";
  };

  const handleAreaClick = () => {
    setSidebarOpen(false);
    if (openSpaceUser) setOpenSpaceUser(null);
  };

  const copyMessage = async (content, idx) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(idx);
      showToast("Message copié !");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast("Échec de la copie", "error");
    }
  };

  const lastAiIndex   = messages.map((m, i) => m.role === "assistant" ? i : -1).filter(i => i !== -1).at(-1);
  const lastUserIndex = messages.map((m, i) => m.role === "user" ? i : -1).filter(i => i !== -1).at(-1);
  const canRegenerate = !loadingResponse && lastAiIndex !== undefined && lastUserIndex !== undefined;

  return (
    <div className="flex-1 flex flex-col bg-white min-h-screen relative overflow-hidden">

      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-2.5 bg-slate-50 border-b border-black/10 z-10">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-slate-900 truncate text-[15px]">
            {activeConversation ? activeConversation.title : "RAG Assistant"}
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {activeConversation
              ? `${messages.length} message${messages.length !== 1 ? "s" : ""}`
              : "Sélectionnez une conversation"}
          </p>
        </div>

        {canRegenerate && (
          <button
            onClick={onRegenerateResponse}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition-all border border-transparent hover:border-emerald-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Régénérer
          </button>
        )}
      </header>

      {/* ── Messages ── */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        onClick={handleAreaClick}
        className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 px-4 md:px-10 lg:px-20 xl:px-36 py-8 space-y-5"
      >
        {!activeConversation ? (
          /* Welcome screen */
          <div className="h-full flex flex-col items-center justify-center gap-6 py-20 animate-fade-in">
            <AppLogo size="xl" />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Bonjour, {username} 👋
              </h2>
              <p className="text-slate-400 text-sm">Sélectionnez une conversation ou démarrez-en une nouvelle.</p>
            </div>
          </div>

        ) : loadingMessages ? (
          /* Loading */
          <div className="flex flex-col items-center justify-center py-24 gap-4 animate-fade-in">
            <div className="spinner w-9 h-9" />
            <p className="text-slate-400 text-sm">Chargement des messages…</p>
          </div>

        ) : messages.length === 0 ? (
          /* Empty — starter questions */
          <div className="flex flex-col items-center justify-center gap-8 py-16 animate-fade-in">
            <div className="text-center">
              <AppLogo size="lg" className="mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-1.5">Comment puis-je vous aider ?</h2>
              <p className="text-slate-400 text-sm">Posez votre question ou choisissez une suggestion</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q.text}
                  onClick={() => onStarterQuestion(q.text)}
                  className="group flex items-center gap-3 text-left px-4 py-3.5 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl text-sm text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                >
                  <span className="text-lg">{q.icon}</span>
                  <span className="font-medium">{q.text}</span>
                </button>
              ))}
            </div>
          </div>

        ) : (
          /* Messages */
          <>
            {messages.map((m, idx) => (
              <Bubble
                key={idx}
                m={m}
                idx={idx}
                username={username}
                copiedId={copiedId}
                onCopy={copyMessage}
                canRegenerate={canRegenerate && idx === lastAiIndex}
                onRegenerate={onRegenerateResponse}
                loadingResponse={loadingResponse}
              />
            ))}

            {loadingResponse && (
              <div className="flex gap-3 animate-fade-in">
                <AIAvatar className="w-8 h-8" />
                <div className="bubble-ai px-5 py-4 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                  {[0, 160, 320].map((d) => (
                    <div key={d} className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ── Scroll to bottom FAB ── */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-28 right-6 w-9 h-9 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:shadow-xl transition-all animate-scale-in z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* ── Input ── */}
      {activeConversation && (
        <div className="flex-shrink-0 px-4 md:px-10 lg:px-20 xl:px-36 py-4 bg-slate-50">
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
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
            {loadingResponse ? (
              <button
                onClick={onStopGeneration}
                className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-red-100 transition-all flex-shrink-0 hover:scale-105 active:scale-95"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSend}
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

          {newMessage.length > 0 && (
            <div className="flex justify-end pr-2 mt-1">
              <span className={`text-[11px] ${newMessage.length > MAX_CHARS * 0.9 ? "text-red-400" : "text-slate-400"}`}>
                {newMessage.length} / {MAX_CHARS}
              </span>
            </div>
          )}
          <p className="text-center text-[11px] text-slate-400 mt-1">
            Shift+Entrée pour une nouvelle ligne
          </p>
        </div>
      )}
    </div>
  );
};

/* ── Single message bubble ── */
const Bubble = ({ m, idx, username, copiedId, onCopy, canRegenerate, onRegenerate, loadingResponse }) => {
  const isUser = m.role === "user";
  const rtl = /[؀-ۿ]/.test(m.content ?? "");

  return (
    <div className={`flex gap-3 group animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {isUser ? (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-600 to-slate-900 flex items-center justify-center text-xs font-bold text-white shadow-sm">
          {username?.charAt(0).toUpperCase()}
        </div>
      ) : (
        <AIAvatar className="w-8 h-8" />
      )}

      {/* Content */}
      <div className={`flex flex-col gap-1.5 min-w-0 ${isUser ? "max-w-[72%] items-end" : "max-w-[90%] sm:max-w-[72%] items-start"}`}>
        <div className={`w-full px-4 py-3 rounded-2xl text-[15px] leading-relaxed [overflow-wrap:anywhere] ${
          isUser ? "bubble-user rounded-br-none" : "bubble-ai rounded-bl-none"
        }`}>
          {isUser ? m.content : (
            <div dir={rtl ? "rtl" : "ltr"}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-emerald-700">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                  li: ({ children }) => <li className={rtl ? "mr-2" : "ml-2"}>{children}</li>,
                }}
              >
                {m.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Meta: timestamp + actions */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          {m.createdAt && (
            <span className="text-[11px] text-slate-400">{dayjs(m.createdAt).format("HH:mm")}</span>
          )}

          <button
            onClick={() => onCopy(m.content, idx)}
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg transition-all ${
              copiedId === idx
                ? "text-emerald-600 bg-emerald-50"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100"
            }`}
          >
            {copiedId === idx ? (
              <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>Copié</>
            ) : (
              <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>Copier</>
            )}
          </button>

          {canRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={loadingResponse}
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-all"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Régénérer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
