import { useRef, useEffect, useState, useCallback } from "react";
import { useKeycloak } from "@react-keycloak/web";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { showToast } from "../../components/Toast";

dayjs.extend(relativeTime);

const STARTER_QUESTIONS = [
  "Résume le document principal",
  "Quelles sont les informations clés ?",
  "Explique-moi le concept principal",
  "Donne-moi un exemple concret",
];

const MAX_CHARS = 4000;

const ChatWindow = ({
  messages,
  activeConversation,
  newMessage,
  setNewMessage,
  onSendMessage,
  onRegenerateResponse,
  loadingResponse,
  loadingMessages,
  setSidebarOpen,
  setOpenSpaceUser,
  openSpaceUser,
  onStarterQuestion,
}) => {
  const { keycloak } = useKeycloak();
  const username = keycloak.tokenParsed?.preferred_username || "User";
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 150);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (val.length > MAX_CHARS) return;
    setNewMessage(val);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 250)}px`;
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || loadingResponse) return;
    await onSendMessage();
    if (textareaRef.current) textareaRef.current.style.height = "52px";
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

  const lastAiIndex = messages.map((m, i) => (m.role === "assistant" ? i : -1)).filter((i) => i !== -1).at(-1);
  const lastUserIndex = messages.map((m, i) => (m.role === "user" ? i : -1)).filter((i) => i !== -1).at(-1);
  const canRegenerate = !loadingResponse && lastAiIndex !== undefined && lastUserIndex !== undefined;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen relative">

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 px-4 sm:px-6 py-4 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 truncate">
              {activeConversation ? activeConversation.title : "RAG Assistant"}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeConversation
                ? `${messages.length} message${messages.length !== 1 ? "s" : ""}`
                : "Sélectionnez une conversation"}
            </p>
          </div>

          {/* Regenerate button in header (when applicable) */}
          {canRegenerate && (
            <button
              onClick={onRegenerateResponse}
              className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
              title="Régénérer la dernière réponse"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Régénérer
            </button>
          )}
        </div>
      </header>

      {/* ── Messages ── */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        onClick={handleAreaClick}
        className="flex-1 overflow-y-auto custom-scrollbar px-4 lg:px-16 xl:px-28 py-6 space-y-6"
      >
        {!activeConversation ? (
          /* No conversation selected */
          <div className="h-full flex flex-col items-center justify-center gap-6 py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-200">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
              </svg>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800 mb-2">Bonjour, {username} 👋</h2>
              <p className="text-slate-500 text-sm">Sélectionnez une conversation ou démarrez-en une nouvelle.</p>
            </div>
          </div>

        ) : loadingMessages ? (
          /* Loading messages */
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">Chargement des messages…</p>
          </div>

        ) : messages.length === 0 ? (
          /* Empty conversation — starter questions */
          <div className="flex flex-col items-center justify-center gap-8 py-16">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 mx-auto mb-4 flex items-center justify-center shadow-md shadow-emerald-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1.5">Comment puis-je vous aider ?</h2>
              <p className="text-slate-400 text-sm">Posez votre question ou choisissez une suggestion</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => onStarterQuestion(q)}
                  className="text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm hover:shadow-md"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

        ) : (
          /* Messages list */
          <>
            {messages.map((m, idx) => (
              <MessageBubble
                key={idx}
                m={m}
                idx={idx}
                username={username}
                copiedId={copiedId}
                onCopy={copyMessage}
                isLastAi={idx === lastAiIndex}
                canRegenerate={canRegenerate && idx === lastAiIndex}
                onRegenerate={onRegenerateResponse}
                loadingResponse={loadingResponse}
              />
            ))}

            {/* Loading dots */}
            {loadingResponse && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
                  AI
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl rounded-bl-none border border-slate-100 shadow-sm">
                  <div className="flex gap-1">
                    {[0, 150, 300].map((d) => (
                      <div key={d} className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
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
          className="absolute bottom-28 right-8 w-9 h-9 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:shadow-xl transition-all animate-fade-in z-10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* ── Input bar ── */}
      {activeConversation && (
        <div className="px-4 mx-4 md:mx-10 lg:mx-16 xl:mx-28 mb-4 lg:mb-6 flex flex-col gap-1">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              rows={1}
              disabled={loadingResponse}
              className={`flex-1 resize-none min-h-[52px] bg-white border border-slate-200 text-base rounded-[24px] px-4 pt-3 pb-3 text-slate-900 shadow-md placeholder-slate-400 transition-[height] duration-150 ease-in-out overflow-auto focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent ${
                loadingResponse ? "opacity-50 cursor-not-allowed" : ""
              }`}
              placeholder="Posez votre question… (Entrée pour envoyer)"
              value={newMessage}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
            <button
              onClick={handleSend}
              disabled={loadingResponse || !newMessage.trim()}
              className={`w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all flex-shrink-0 ${
                loadingResponse || !newMessage.trim() ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
              </svg>
            </button>
          </div>

          {/* Char counter */}
          {newMessage.length > 0 && (
            <div className="flex justify-end pr-14">
              <span className={`text-xs ${newMessage.length > MAX_CHARS * 0.9 ? "text-red-400" : "text-slate-400"}`}>
                {newMessage.length} / {MAX_CHARS}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── Message bubble component ── */
const MessageBubble = ({ m, idx, username, copiedId, onCopy, canRegenerate, onRegenerate, loadingResponse }) => {
  const isUser = m.role === "user";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`flex gap-3 group animate-fade-in ${isUser ? "flex-row-reverse" : "flex-row"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${
        isUser
          ? "bg-gradient-to-br from-slate-700 to-slate-900"
          : "bg-gradient-to-br from-emerald-400 to-emerald-600"
      }`}>
        {isUser ? username?.charAt(0).toUpperCase() : "AI"}
      </div>

      {/* Content column */}
      <div className={`flex flex-col gap-1.5 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl ${isUser ? "items-end" : "items-start"}`}>
        {/* Bubble */}
        <div className={`px-4 py-3 rounded-2xl break-words text-base leading-relaxed shadow-sm ${
          isUser
            ? "bg-slate-800 text-white rounded-br-none"
            : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
        }`}>
          {m.content}
        </div>

        {/* Meta row: timestamp + actions */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          {m.createdAt && (
            <span className="text-[11px] text-slate-400">
              {dayjs(m.createdAt).format("HH:mm")}
            </span>
          )}

          {/* Copy button */}
          <button
            onClick={() => onCopy(m.content, idx)}
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg transition-all ${
              copiedId === idx
                ? "text-emerald-600 bg-emerald-50"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100"
            }`}
            title="Copier"
          >
            {copiedId === idx ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copié
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copier
              </>
            )}
          </button>

          {/* Regenerate (only on last AI message) */}
          {canRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={loadingResponse}
              className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-all"
              title="Régénérer"
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
