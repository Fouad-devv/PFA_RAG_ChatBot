// Home.jsx
import { useEffect, useState, useRef } from "react";
import useAxiosPrivate from "../../api/useAxiosPrivate.js";
import { useKeycloak } from "@react-keycloak/web";
import dayjs from "dayjs";

export const Home = () => {
  const { keycloak, initialized } = useKeycloak();
  const axiosPrivate = useAxiosPrivate();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false); // prevent multiple auto-launches

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch all conversations for sidebar
  const fetchConversations = async () => {
    if (!initialized || !keycloak?.authenticated) return;
    setLoadingConversations(true);
    try {
      const res = await axiosPrivate.get("/api/home/conversations");
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [initialized, keycloak]);

  // Auto-launch first conversation or create new one
  useEffect(() => {
    if (!initialized || !keycloak?.authenticated || autoOpened) return;
    if (loadingConversations) return; // wait until conversations are loaded

    if (conversations.length === 0) {
      handleNewConversation();
    } else {
      handleSelectConversation(conversations[0]);
    }

    setAutoOpened(true);
  }, [initialized, keycloak, conversations, loadingConversations, autoOpened]);

  // Fetch messages for a conversation
  const handleSelectConversation = async (conversation) => {
    setActiveConversation(conversation);
    setLoadingMessages(true);
    try {
      const res = await axiosPrivate.get(`/api/home/conversations/${conversation._id}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error("Failed to load messages", err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

 // Create a new conversation
const handleNewConversation = async () => {
  try {
    // Send request to backend to create new conversation
    const res = await axiosPrivate.post("/api/home/newChat", {
      message: "Hello!", // optional initial message
    });

    //  Build conversation object for frontend
    const newConv = {
      _id: res.data.conversationId,
      title: res.data.title || "New Conversation",
      lastMessagePreview: res.data.initialMessage || "",
      updatedAt: new Date(),
    };

    //  Clear current chat window
    setActiveConversation(null);
    setMessages([]);

    //  Add new conversation to sidebar
    setConversations((prev) => [newConv, ...prev]);

    // Open new conversation with initial message (if returned)
    setActiveConversation(newConv);
    if (res.data.initialMessage) {
      setMessages([{ role: "assistant", content: res.data.initialMessage }]);
    }
  } catch (err) {
    console.error("Failed to create new conversation", err);
  }
};

  // Send a message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    const userMessage = { role: "user", content: newMessage };
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");

    try {
      const res = await axiosPrivate.post("/api/home/response", {
        message: newMessage,
        conversationId: activeConversation._id,
      });

      const assistantMessage = { role: "assistant", content: res.data.answer };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update lastMessagePreview and updatedAt in sidebar
      setConversations((prev) =>
        prev.map((c) =>
          c._id === activeConversation._id
            ? { ...c, lastMessagePreview: res.data.answer, updatedAt: new Date() }
            : c
        )
      );
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // Loading / Auth handling
  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!keycloak?.authenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-gray-700 text-lg">You must be logged in to access this page.</p>
        <button
          onClick={() => keycloak.login()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-72 bg-gray-900 text-white flex-shrink-0 overflow-y-auto">
        <div className="p-4 font-bold text-lg border-b border-gray-700 flex justify-between items-center">
          Conversations
          <button
            onClick={handleNewConversation}
            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-sm"
          >
            New
          </button>
        </div>

        {loadingConversations ? (
          <div className="p-4 text-gray-400">Loading conversations...</div>
        ) : (
          <div className="flex flex-col">
            {conversations.map((c) => (
              <div
                key={c._id}
                onClick={() => handleSelectConversation(c)}
                className={`p-4 cursor-pointer border-b border-gray-800 hover:bg-gray-800 ${
                  activeConversation?._id === c._id ? "bg-gray-800" : ""
                }`}
              >
                <h4 className="font-semibold truncate">{c.title}</h4>
                <p className="text-sm text-gray-400 truncate">
                  {c.lastMessagePreview?.substring(0, 50)}
                </p>
                <span className="text-xs text-gray-500">
                  {dayjs(c.updatedAt).format("DD/MM/YYYY HH:mm")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-white font-semibold text-gray-800">
          {activeConversation ? activeConversation.title : "Select a conversation"}
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`max-w-xs px-4 py-2 rounded-lg ${
                m.role === "user"
                  ? "bg-blue-500 text-white self-end"
                  : "bg-gray-200 text-gray-900 self-start"
              }`}
            >
              {m.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {activeConversation && (
          <div className="p-4 bg-white border-t flex gap-2">
            <input
              type="text"
              className="flex-1 border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
};