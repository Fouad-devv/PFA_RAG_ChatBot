// Public.jsx
import { useState, useEffect, useRef } from "react";
import { useKeycloak } from "@react-keycloak/web";
import ChatWindow from "../home/ChatWindow.jsx";
import { PublicSidebar } from "./PublicSidebar.jsx";
import axios from "../../api/axios.js";

export const Public = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSpaceUser, setOpenSpaceUser] = useState(null);

  // Auto-scroll effect
  const messagesEndRef = useRef(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  


  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage = { role: "user", content: newMessage };
    setMessages((prev) => [...prev, userMessage]);
    setNewMessage("");
    setLoadingResponse(true);

    try {
      const res = await axios.post("/api/public/response", {
        message: userMessage.content,
      });

      const assistantMessage = {
        role: "assistant",
        content: res.data.answer, 
      };
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (err) {
      console.error("Failed to get response:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Oops! Something went wrong. Try again." },
      ]);
    } finally {
      setLoadingResponse(false);
    }
  };

  const activeConversation = { title: "Public Chat" };

  return (
    <div className="flex h-screen bg-white">
      <PublicSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        openSpaceUser={openSpaceUser}
        setOpenSpaceUser={setOpenSpaceUser}
      />
      <ChatWindow
        messages={messages}
        activeConversation={activeConversation}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={handleSendMessage}
        loadingResponse={loadingResponse}
        setSidebarOpen={setSidebarOpen}
        setOpenSpaceUser={setOpenSpaceUser}
        openSpaceUser={openSpaceUser}
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
};