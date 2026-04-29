import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PublicSidebar } from "./PublicSidebar.jsx";
import axios from "../../api/axios.js";

const STARTER_QUESTIONS = [
  "Comment fonctionne le RAG ?",
  "Qu'est-ce que l'intelligence artificielle ?",
  "Explique-moi les embeddings.",
  "Quelle est la différence entre GPT et BERT ?",
];

export const Public = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const msg = text.trim();
    if (!msg || loadingResponse) return;

    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setNewMessage("");
    if (textareaRef.current) textareaRef.current.style.height = "52px";
    setLoadingResponse(true);

    try {
      const res = await axios.post("/api/public/response", { message: msg });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Oops ! Une erreur est survenue. Réessayez." },
      ]);
    } finally {
      setLoadingResponse(false);
    }
  };

  const handleChange = (e) => {
    setNewMessage(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 250)}px`;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">

      <PublicSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Header */}
        <header className="sticky top-0 z-10 px-4 sm:px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-slate-900 leading-none">Chat public</h1>
                <p className="text-xs text-slate-400 mt-0.5">{messages.length} message{messages.length !== 1 ? "s" : ""}</p>
              </div>
            </div>

            <div className="ml-auto">
              <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Non sauvegardé
              </span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div
          onClick={() => setSidebarOpen(false)}
          className="flex-1 overflow-y-auto custom-scrollbar px-4 lg:px-16 xl:px-32 py-6 space-y-6"
        >
          {messages.length === 0 ? (
            /* Empty state */
            <div className="h-full flex flex-col items-center justify-center gap-8 py-12">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 mx-auto mb-5 flex items-center justify-center shadow-lg shadow-emerald-200">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Comment puis-je vous aider ?</h2>
                <p className="text-slate-500 text-sm max-w-sm">
                  Posez n'importe quelle question. Aucun compte requis.
                </p>
              </div>

              {/* Starter questions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {STARTER_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 animate-fade-in ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white
                    ${m.role === "user"
                      ? "bg-gradient-to-br from-slate-700 to-slate-900"
                      : "bg-gradient-to-br from-emerald-500 to-emerald-600"
                    }`}
                  >
                    {m.role === "user" ? "G" : "AI"}
                  </div>

                  {/* Bubble */}
                  <div className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-2xl text-base break-words shadow-sm
                      ${m.role === "user"
                        ? "bg-slate-800 text-white rounded-br-none"
                        : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading dots */}
              {loadingResponse && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-sm font-bold text-white">
                    AI
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl rounded-bl-none border border-slate-100 shadow-sm">
                    <div className="flex gap-1">
                      {[0, 150, 300].map((delay) => (
                        <div key={delay} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="px-4 mx-4 lg:mx-8 mb-4 md:mx-12 lg:mb-6 xl:mx-32 flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            disabled={loadingResponse}
            className={`flex-1 resize-none min-h-[52px] bg-white border border-gray-200 ring-2 ring-gray-100 text-base rounded-[26px] px-4 pt-3 pb-3 text-slate-900 shadow-md placeholder-slate-400 transition-[height] duration-150 ease-in-out overflow-auto focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent ${
              loadingResponse ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder="Posez votre question..."
            value={newMessage}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(newMessage);
              }
            }}
          />
          <button
            onClick={() => sendMessage(newMessage)}
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

      </div>
    </div>
  );
};
