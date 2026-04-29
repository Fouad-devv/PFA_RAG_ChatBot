// Home.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import useAxiosPrivate from "../../api/useAxiosPrivate.js";
import { useKeycloak } from "@react-keycloak/web";
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";

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
  const [openSpaceUser, setOpenSpaceUser] = useState(null);

  const messagesEndRef = useRef(null);
  const username = keycloak.tokenParsed?.preferred_username || "User";


  // Fetch conversations
  const fetchConversationsList = useCallback(async () => {
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

  //Fetch messages for a conversation
  const fetchMessagesList = useCallback(async (conversationId) => {
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

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    return fetchConversationsList();
  }, [fetchConversationsList]);

  // Fetch messages  
  const fetchMessages = useCallback(async (conversationId) => {
    return fetchMessagesList(conversationId);
  }, [fetchMessagesList]);



  //_____________________ Select a conversation ________________________
  const handleSelectConversation = useCallback((conversation) => {
    setActiveConversation(conversation);
    fetchMessages(conversation._id);
  }, [fetchMessages]);

  

  //______________________________ Create new conversation _________________________________________-
  const handleNewConversation = useCallback(async () => {
    try {
      const res = await axiosPrivate.post("/api/home/newChat", { message: `Hello ${username} !` });
      const newConv = {
        _id: res.data.conversationId,
        title: res.data.title || "New Conversation",
        lastMessagePreview: res.data.initialMessage || "",
        updatedAt: new Date(),
      };
      // Clear chat
      setActiveConversation(null);
      setMessages([]);
      // Add new conversation
      setConversations((prev) => [newConv, ...prev]);
      // Open it
      setActiveConversation(newConv);
      if (res.data.initialMessage) {
        setMessages([{ role: "assistant", content: res.data.initialMessage }]);
      }
    } catch (err) {
      console.error("Failed to create new conversation", err);
    }
  }, [username, axiosPrivate]);



  //____________________________ Send message ________________________________________
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    const userMessage = { role: "user", content: newMessage };
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");
    setLoadingResponse(true);


    try {
      const res = await axiosPrivate.post("/api/home/response", {
        message: newMessage,
        conversationId: activeConversation._id,
      });

      const assistantMessage = { role: "assistant", content: res.data.answer };
      setMessages((prev) => [...prev, assistantMessage]);

      setConversations((prev) => prev.map((c) =>
          c._id === activeConversation._id
            ? { ...c,
              title: res.data.title,
              lastMessagePreview: res.data.answer, 
              updatedAt: new Date() 
            }
            : c
          )
      );

      // Also update activeConversation so the title updates in the header
      setActiveConversation((prev) => ({
        ...prev,
        lastMessagePreview: res.data.answer,
        title: res.data.title || prev.title,
      }));

    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
    setLoadingResponse(false); 
    }
  };


  //______________________ Delete conversation __________________________________________
  const removeConversationFromState = async (conversationId) => {
  const updated = conversations.filter(c => c._id !== conversationId);

  setConversations(updated);

  if (activeConversation?._id === conversationId) {
    const nextConversation = updated[0] || null;
    setActiveConversation(nextConversation);

    if (nextConversation) {
      fetchMessages(nextConversation._id);
    } else {
      setMessages([]);
      handleNewConversation(); 
    }
  }
};


  // _________________________________ UseEffect ____________________________________
  useEffect(() => {
    if (initialized && keycloak?.authenticated) {
      fetchConversations();
    }
  }, [initialized, keycloak, fetchConversations]);

  // Auto-launch first conversation
  useEffect(() => {
    if (!initialized || !keycloak?.authenticated || autoOpened) return;
    if (loadingConversations) return;

    if (conversations.length === 0) {
      handleNewConversation();
    } else {
      handleSelectConversation(conversations[0]);
    }
    setAutoOpened(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, keycloak, conversations, loadingConversations, autoOpened]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);




 // _________________________________ return _______________________________

  // Loading / Auth
  if (!initialized) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!keycloak?.authenticated)
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p>You must be logged in to access this page.</p>
        <button onClick={() => keycloak.login()}>Login</button>
      </div>
    );


  return (
    <div className="flex h-screen">
      <Sidebar
        conversations={conversations}
        activeConversation={activeConversation}
        loadingConversations={loadingConversations}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        removeConversationFromState={removeConversationFromState}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
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
        messagesEndRef={messagesEndRef}
        setSidebarOpen={setSidebarOpen}
        setOpenSpaceUser={setOpenSpaceUser}
        openSpaceUser={openSpaceUser}
      />
    </div>
  );

};