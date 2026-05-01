import { useEffect, useState, useRef, useCallback } from "react";
import useAxiosPrivate from "../../api/useAxiosPrivate.js";
import { useKeycloak } from "@react-keycloak/web";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import { ToastContainer } from "../../components/Toast.jsx";

export const Home = () => {
  const { keycloak, initialized } = useKeycloak();
  const axiosPrivate = useAxiosPrivate();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openSpaceUser, setOpenSpaceUser] = useState(null);

  const username = keycloak.tokenParsed?.preferred_username || "User";
  const abortControllerRef = useRef(null);


  // ── Fetch conversations list ──────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!keycloak?.authenticated) return;
    setLoadingConversations(true);
    try {
      const res = await axiosPrivate.get("/api/home/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setLoadingConversations(false);
    }
  }, [keycloak, axiosPrivate]);


  // ── Fetch messages for a conversation ─────────────────────────────────────
  const fetchMessages = useCallback(async (conversationId) => {
    setLoadingMessages(true);
    try {
      const res = await axiosPrivate.get(`/api/home/conversations/${conversationId}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error("Failed to load messages", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [axiosPrivate]);


  // ── Select a conversation ─────────────────────────────────────────────────
  const handleSelectConversation = useCallback((conversation) => {
    setActiveConversation(conversation);
    fetchMessages(conversation._id);
  }, [fetchMessages]);


  // ── Create new conversation ───────────────────────────────────────────────
  const handleNewConversation = useCallback(async () => {
    try {
      const res = await axiosPrivate.post("/api/home/newChat", { message: `Bonjour ${username} ! Comment puis-je vous aider ?` });
      const newConv = {
        _id: res.data.conversationId,
        title: res.data.title || "New Conversation",
        lastMessagePreview: res.data.initialMessage || "",
        updatedAt: new Date(),
      };
      setActiveConversation(null);
      setMessages([]);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversation(newConv);
      if (res.data.initialMessage) {
        setMessages([{ role: "assistant", content: res.data.initialMessage, createdAt: new Date() }]);
      }
    } catch (err) {
      console.error("Failed to create new conversation", err);
    }
  }, [username, axiosPrivate]);


  // ── Send message ──────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || !activeConversation || loadingResponse) return;

    const userMsg = { role: "user", content: newMessage, createdAt: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setNewMessage("");
    setLoadingResponse(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await axiosPrivate.post("/api/home/response", {
        message: newMessage,
        conversationId: activeConversation._id,
      }, { signal: controller.signal });

      setMessages((prev) => [...prev, { role: "assistant", content: res.data.answer, createdAt: new Date() }]);
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConversation._id
            ? { ...c, title: res.data.title, lastMessagePreview: res.data.answer, updatedAt: new Date() }
            : c
        )
      );
      setActiveConversation((prev) => ({ ...prev, title: res.data.title || prev.title }));
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        console.error("Failed to send message", err);
      }
    } finally {
      setLoadingResponse(false);
    }
  }, [newMessage, activeConversation, axiosPrivate, loadingResponse]);


  // ── Starter question shortcut ─────────────────────────────────────────────
  const handleStarterQuestion = useCallback(async (question) => {
    if (!activeConversation || loadingResponse) return;
    setMessages((prev) => [...prev, { role: "user", content: question, createdAt: new Date() }]);
    setLoadingResponse(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await axiosPrivate.post("/api/home/response", {
        message: question,
        conversationId: activeConversation._id,
      }, { signal: controller.signal });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.answer, createdAt: new Date() }]);
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConversation._id
            ? { ...c, title: res.data.title, lastMessagePreview: res.data.answer, updatedAt: new Date() }
            : c
        )
      );
      setActiveConversation((prev) => ({ ...prev, title: res.data.title || prev.title }));
    } catch {
    } finally {
      setLoadingResponse(false);
    }
  }, [activeConversation, axiosPrivate, loadingResponse]);


  // ── Rename conversation ───────────────────────────────────────────────────
  const handleRenameConversation = useCallback(async (conversationId, newTitle) => {
    try {
      await axiosPrivate.patch(`/api/home/conversations/${conversationId}`, { title: newTitle });
      setConversations((prev) =>
        prev.map((c) => (c._id === conversationId ? { ...c, title: newTitle } : c))
      );
      if (activeConversation?._id === conversationId) {
        setActiveConversation((prev) => ({ ...prev, title: newTitle }));
      }
    } catch (err) {
      console.error("Rename failed", err);
    }
  }, [axiosPrivate, activeConversation]);


  // ── Regenerate last AI response ───────────────────────────────────────────
  const handleRegenerateResponse = useCallback(async () => {
    if (loadingResponse || !activeConversation) return;

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;

    setMessages((prev) => {
      const lastAiIdx = [...prev.keys()].reverse().find((i) => prev[i].role === "assistant");
      return lastAiIdx !== undefined ? prev.filter((_, i) => i !== lastAiIdx) : prev;
    });

    setLoadingResponse(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await axiosPrivate.post("/api/home/response", {
        message: lastUserMsg.content,
        conversationId: activeConversation._id,
      }, { signal: controller.signal });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.answer, createdAt: new Date() }]);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        setMessages((prev) => [...prev, { role: "assistant", content: "Une erreur est survenue.", createdAt: new Date() }]);
      }
    } finally {
      setLoadingResponse(false);
    }
  }, [messages, activeConversation, axiosPrivate, loadingResponse]);


  // ── Stop generation ───────────────────────────────────────────────────────
  const handleStopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);


  // ── Delete conversation from state ────────────────────────────────────────
  const removeConversationFromState = useCallback(async (conversationId) => {
    const updated = conversations.filter((c) => c._id !== conversationId);
    setConversations(updated);

    if (activeConversation?._id === conversationId) {
      const next = updated[0] || null;
      setActiveConversation(next);
      if (next) fetchMessages(next._id);
      else { setMessages([]); handleNewConversation(); }
    }
  }, [conversations, activeConversation, fetchMessages, handleNewConversation]);


  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (initialized && keycloak?.authenticated) fetchConversations();
  }, [initialized, keycloak, fetchConversations]);

  useEffect(() => {
    if (!initialized || !keycloak?.authenticated || autoOpened || loadingConversations) return;
    if (conversations.length === 0) handleNewConversation();
    else handleSelectConversation(conversations[0]);
    setAutoOpened(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, keycloak, conversations, loadingConversations, autoOpened]);


  // ── Guards ────────────────────────────────────────────────────────────────
  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Chargement…</p>
        </div>
      </div>
    );
  }

  if (!keycloak?.authenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 bg-slate-50">
        <p className="text-slate-600">Vous devez être connecté pour accéder à cette page.</p>
        <button
          onClick={() => keycloak.login()}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
        >
          Se connecter
        </button>
      </div>
    );
  }


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden">
      <ToastContainer />

      <Sidebar
        conversations={conversations}
        activeConversation={activeConversation}
        loadingConversations={loadingConversations}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
        removeConversationFromState={removeConversationFromState}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        setOpenSpaceUser={setOpenSpaceUser}
        openSpaceUser={openSpaceUser}
      />

      <ChatWindow
        loadingResponse={loadingResponse}
        loadingMessages={loadingMessages}
        messages={messages}
        activeConversation={activeConversation}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={handleSendMessage}
        onRegenerateResponse={handleRegenerateResponse}
        onStarterQuestion={handleStarterQuestion}
        onStopGeneration={handleStopGeneration}
        setSidebarOpen={setSidebarOpen}
        setOpenSpaceUser={setOpenSpaceUser}
        openSpaceUser={openSpaceUser}
      />
    </div>
  );
};
