
import { useState } from "react";
import dayjs from "dayjs";
import "../../index.css";
import { useKeycloak } from "@react-keycloak/web";
import useAxiosPrivate from "../../api/useAxiosPrivate";

const Sidebar = ({
  removeConversationFromState,
  conversations,
  activeConversation,
  loadingConversations,
  onSelectConversation,
  onNewConversation,
  sidebarOpen,
  setSidebarOpen,
  setOpenSpaceUser,
  openSpaceUser,
}) => {

  const { keycloak } = useKeycloak();
  const axiosPrivate = useAxiosPrivate();
  const [openMenuId, setOpenMenuId] = useState(null);
  const username = keycloak.tokenParsed?.preferred_username || "User";
  const email = keycloak.tokenParsed?.email || "No email";

  const handleLogout = () => {
    keycloak.logout({
      redirectUri: window.location.origin,
    });
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      await axiosPrivate.delete(`/api/home/conversations/${conversationId}`);
      setOpenMenuId(null);
      removeConversationFromState(conversationId);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };



  return (
    <>
      <div
        className={`fixed z-50 flex flex-col w-64 lg:w-72 bg-white text-slate-900 h-screen border-r border-slate-200 transition-transform transform shadow-lg
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:flex lg:shadow-none`}
       >
        {/*_________________________________________ Header _______________________________________________*/}
        
        <div className="px-6 py-5 border-b border-white flex justify-between items-center">
          <div className="h-[38px]">
            <h1 className="font-bold text-xl text-slate-900">Chats</h1>
            <p className="text-xs text-slate-500">Manage your conversations</p>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-500 hover:text-slate-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New conversation button */}
        <div className="px-4 py-4 border-b shadow-md border-slate-200">
          <button
            onClick={onNewConversation}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
            </svg>
            New Chat
          </button>
        </div>

        {/*______________________________ Conversation list  __________________________________________*/}

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-3 space-y-2">
          {loadingConversations ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              <div className="flex justify-center mb-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
              </div>
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              <p>No conversations yet.</p>
              <p>Start a new chat!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {conversations.map((c) => (
                <div
                  key={c._id}
                  onClick={() => {
                    onSelectConversation(c);
                    setSidebarOpen(false);
                  }}
                  className={`relative px-3 py-3 border rounded-lg cursor-pointer transition-all group ${
                    activeConversation?._id === c._id
                      ? "bg-emerald-50 border-emerald-200 shadow-sm"
                      : "border-gray-100 hover:bg-slate-100 hover:scale-102"
                  }`}
                >
                  {/* Content */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-md text-slate-900 truncate group-hover:text-emerald-600 transition-colors">{c.title}</h4>
                      <span className="text-xs text-slate-400 mt-1.5 block">
                        {dayjs(c.updatedAt).fromNow()}
                      </span>
                    </div>

                    {/* Three-dot menu */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === c._id ? null : c._id);
                      }}
                      className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-5 h-5 mt-2" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="2"/>
                        <circle cx="12" cy="12" r="2"/>
                        <circle cx="12" cy="19" r="2"/>
                      </svg>
                    </button>
                  </div>

                  {/* Dropdown menu */}
                  {openMenuId === c._id && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="z-10 absolute right-10 top-1 bg-white border border-slate-200 rounded-lg shadow-lg w-32 overflow-hidden"
                     >
                      <button
                        onClick={() => handleDeleteConversation(c._id)}
                        className="w-full text-left px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 border border-gray-200 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 6.4L17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4z"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/*______________________________________________ User Space ____________________________________*/}

        {/* User space hidden expanded */}
        <div
          className={`transform transition-all duration-400 ease-in-out overflow-hidden
            ${openSpaceUser ? "h-auto opacity-100" : "opacity-0 h-2"} 
             border rounded-xl border-gray-400 bg-white mx-2`}
         >
          <div className="rounded-lg bg-gradient-to-r from-green-800 to-emerald-700 p-4 space-y-3 border border-slate-200">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-100 font-bold">Logged in as</p>
              <p className="font-bold text-black truncate mt-1">{username}</p>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs text-slate-200 truncate">{email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-medium py-2.5 px-3 text-sm rounded-lg transition-colors flex items-center justify-center gap-2 mt-3"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* User profile button */}
        <div className="px-2 py-3 border-t shadow-lg border-gray-200 bg-white">
          <button
            onClick={() => setOpenSpaceUser(openSpaceUser === null ? username : null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              openSpaceUser
                ? "bg-emerald-50 border border-emerald-200"
                : "hover:bg-slate-100 border border-transparent"
            }`}
          >
            {/* Avatar circle */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
              {username?.charAt(0).toUpperCase()}
            </div>
            {/* Name */}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-slate-900 truncate">{username}</p>
              <p className="text-xs text-slate-500 truncate">{email}</p>
            </div>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform ${openSpaceUser ? "rotate-180" : ""}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
        </div>

      </div>
    </>
  );
};

export default Sidebar;