// ChatWindow.jsx
import { useRef, useEffect } from "react";
import { useKeycloak } from "@react-keycloak/web";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const ChatWindow = ({
  messages,
  activeConversation,
  newMessage,
  setNewMessage,
  onSendMessage,
  loadingResponse,
  loadingMessages,
  setSidebarOpen,
  setOpenSpaceUser,
  openSpaceUser,
}) => {
  const messagesEndRef = useRef(null);
  const { keycloak } = useKeycloak();
  const username = keycloak.tokenParsed?.preferred_username || "User";
  const textareaRef = useRef(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // close the user space
  const handleChatWindowClick = () => {
    setSidebarOpen(false);
    if (openSpaceUser) {
      setOpenSpaceUser(openSpaceUser === null ? username : null);
    }
  };

  // input grow
  const handleChange = (e) => {
    setNewMessage(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 250)}px`;
    }
  };

  const handleSendMessageWrapper = async () => {
    if (!newMessage.trim()) return;
    await onSendMessage();
    if (textareaRef.current) {
      textareaRef.current.style.height = "60px";
    }
  };





  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-slate-50 min-h-screen">
      {/*_______________________________________ Header ______________________________________________________*/}

      <header className="sticky top-0 z-10 px-4 sm:px-6 py-4 bg-white border-b-3 border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger - visible only on small screens */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="font-bold text-lg text-slate-900">
                {activeConversation ? activeConversation.title : "Select a conversation"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {messages.length} message{messages.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/*_____________________________________ Messages Container _____________________________________________________________-*/}

      <div onClick={handleChatWindowClick} className="flex-1 overflow-y-auto custom-scrollbar px-4 lg:px-12 xl:px-25 sm:px-6 py-6 space-y-10">
        {!activeConversation ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">Select a conversation to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="spinner w-10 h-10 border-4 border-slate-300 border-t-emerald-600 rounded-full"></div>
                  <p className="text-slate-500 text-sm font-medium">Loading messages...</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-3 animate-fade-in ${
                  m.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
               >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white ${
                    m.role === "user"
                      ? "bg-gradient-to-br from-green-900 to-emerald-600"
                      : "bg-gradient-to-br from-slate-400 to-slate-500"
                  }`}
                >
                  {m.role === "user"
                    ? username?.charAt(0).toUpperCase()
                    : "AI"}
                </div>

                {/* Message Content */}
                <div className={`flex flex-col gap-1 ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-3 rounded-2xl break-words shadow-sm transition-all hover:shadow-md ${
                      m.role === "user"
                        ? "bg-green-800 text-lg text-white rounded-br-none"
                        : "bg-gray-100 text-slate-700 text-lg border border-slate-100 rounded-bl-none"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading response indicator */}
            {loadingResponse && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white bg-gradient-to-br from-slate-400 to-slate-500">
                  AI
                </div>
                <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-2xl rounded-bl-none border border-slate-200 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
              </>
            )}
          </>
        )}
      </div>

      {/*_____________________________________ Input ______________________________________________________*/}

      {activeConversation && (
        <div className=" px-4 mx-8 lg:mx-5 lg:mb-8 md:mx-15 mb-3 md:px-8 lg:px-16 xl:px-32  flex items-center gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            disabled={loadingResponse }
            className={`flex-1  items-center resize-none min-h-[60px] bg-white border border-gray-300 ring-2 ring-gray-200 text-lg rounded-[30px] px-4 pt-3 text-black shadow-md placeholder-gray-500  transition-[height] duration-200 ease-in-out overflow-auto ${
              loadingResponse ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder="Type your message..."
            value={newMessage}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessageWrapper();
              }
            }}
          />
          <button
            onClick={handleSendMessageWrapper}
            disabled={loadingResponse}
            className={`bg-gradient-to-r from-emerald-500 to-emerald-600 w-12 h-12 mb-[7px] text-white p-3 rounded-full flex items-center justify-center shadow-md hover:shadow-lg ${
              loadingResponse ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14m0 0l-6-6m6 6l-6 6"
              />
            </svg>
          </button>
        </div>
      )}
        
    </div>
  );
};

export default ChatWindow;