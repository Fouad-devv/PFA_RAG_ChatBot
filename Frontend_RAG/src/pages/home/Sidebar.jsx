import { useState, useMemo, useRef, useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useKeycloak } from "@react-keycloak/web";
import useAxiosPrivate from "../../api/useAxiosPrivate";
import { showToast } from "../../components/Toast";

dayjs.extend(relativeTime);

const getDateGroup = (date) => {
  const d = dayjs(date);
  const today = dayjs().startOf("day");
  if (d.isAfter(today))                          return "Aujourd'hui";
  if (d.isAfter(today.subtract(1, "day")))       return "Hier";
  if (d.isAfter(today.subtract(7, "day")))       return "Cette semaine";
  return "Plus ancien";
};
const GROUP_ORDER = ["Aujourd'hui", "Hier", "Cette semaine", "Plus ancien"];

const Sidebar = ({
  removeConversationFromState,
  conversations,
  activeConversation,
  loadingConversations,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  setOpenSpaceUser,
  openSpaceUser,
}) => {
  const { keycloak } = useKeycloak();
  const axiosPrivate = useAxiosPrivate();
  const [openMenuId, setOpenMenuId]   = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [renamingId, setRenamingId]   = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef(null);

  const username = keycloak.tokenParsed?.preferred_username || "User";
  const email    = keycloak.tokenParsed?.email || "";

  const handleLogout = () => keycloak.logout({ redirectUri: window.location.origin });

  const handleDelete = async (id) => {
    try {
      await axiosPrivate.delete(`/api/home/conversations/${id}`);
      setOpenMenuId(null);
      removeConversationFromState(id);
      showToast("Conversation supprimée");
    } catch {
      showToast("Échec de la suppression", "error");
    }
  };

  const startRename = (c) => {
    setRenamingId(c._id);
    setRenameValue(c.title);
    setOpenMenuId(null);
    setTimeout(() => renameInputRef.current?.focus(), 60);
  };

  const commitRename = async () => {
    if (!renameValue.trim() || !renamingId) { setRenamingId(null); return; }
    await onRenameConversation(renamingId, renameValue.trim());
    setRenamingId(null);
  };

  useEffect(() => {
    const close = () => setOpenMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const filtered = useMemo(() =>
    searchQuery.trim()
      ? conversations.filter((c) => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : conversations,
    [conversations, searchQuery]
  );

  const groups = useMemo(() => {
    const g = {};
    filtered.forEach((c) => { const k = getDateGroup(c.updatedAt); (g[k] ??= []).push(c); });
    return g;
  }, [filtered]);

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Desktop collapse toggle button ── */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title={sidebarCollapsed ? "Afficher le menu" : "Masquer le menu"}
        className={`hidden lg:flex fixed top-1/2 -translate-y-1/2 z-[60]
          items-center justify-center
          w-5 h-10 bg-white border border-slate-200 border-l-0
          rounded-r-xl shadow-md
          hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-lg
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? "left-0" : "left-72"}`}
      >
        <svg
          className="w-3 h-3 text-slate-400 group-hover:text-emerald-600"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
            d={sidebarCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
          />
        </svg>
      </button>

      <aside className={`fixed z-50 flex flex-col w-72 h-screen bg-white border-r border-slate-100 shadow-2xl shadow-slate-200/60
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:shadow-none
        ${sidebarCollapsed ? "lg:w-0 lg:overflow-hidden lg:border-r-0" : "lg:w-72"}
        lg:transition-[width] lg:duration-300`}
      >
        {/* ── Header ── */}
        <div className="px-4 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-200">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
                </svg>
              </div>
              <span className="font-bold text-slate-900 tracking-tight">RAG Assistant</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* New chat */}
          <button
            onClick={onNewConversation}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-100 hover:shadow-emerald-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nouvelle conversation
          </button>
        </div>

        {/* ── Search ── */}
        <div className="px-3 py-3 border-b border-slate-100">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="w-full pl-8 pr-7 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300 transition"
              placeholder="Rechercher…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Conversation list ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
          {loadingConversations ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="spinner w-7 h-7" />
              <p className="text-sm text-slate-400">Chargement…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-3">
              {searchQuery ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Aucun résultat</p>
                  <p className="text-xs text-slate-400 mt-1">pour « {searchQuery} »</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-slate-600">Aucune conversation</p>
                  <p className="text-xs text-slate-400 mt-1">Démarrez un nouveau chat !</p>
                </>
              )}
            </div>
          ) : (
            GROUP_ORDER.filter((g) => groups[g]?.length > 0).map((groupName) => (
              <div key={groupName} className="mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-1.5">
                  {groupName}
                </p>
                <div className="flex flex-col gap-0.5">
                  {groups[groupName].map((c) => (
                    <ConvItem
                      key={c._id}
                      c={c}
                      isActive={activeConversation?._id === c._id}
                      isRenaming={renamingId === c._id}
                      renameValue={renameValue}
                      renameInputRef={renameInputRef}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      setRenameValue={setRenameValue}
                      onSelect={() => { onSelectConversation(c); setSidebarOpen(false); }}
                      onStartRename={() => startRename(c)}
                      onCommitRename={commitRename}
                      onCancelRename={() => setRenamingId(null)}
                      onDelete={() => handleDelete(c._id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── User panel (expandable) ── */}
        {openSpaceUser && (
          <div className="mx-2 mb-2 rounded-2xl overflow-hidden border border-slate-200 animate-scale-in shadow-lg">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-900/50">
                  {username?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{username}</p>
                  <p className="text-xs text-slate-400 truncate">{email || "Connecté"}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 text-sm font-semibold py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        )}

        {/* ── User profile button ── */}
        <div className="px-2 py-3 border-t border-slate-100">
          <button
            onClick={() => setOpenSpaceUser(openSpaceUser ? null : username)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
              openSpaceUser ? "bg-slate-100" : "hover:bg-slate-50"
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md shadow-emerald-100">
              {username?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-slate-900 truncate">{username}</p>
              <p className="text-xs text-slate-400 truncate">{email || "Connecté"}</p>
            </div>
            <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${openSpaceUser ? "rotate-180" : ""}`}
              fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  );
};

/* ── Conversation item ── */
const ConvItem = ({
  c, isActive, isRenaming, renameValue, renameInputRef, openMenuId, setOpenMenuId,
  setRenameValue, onSelect, onStartRename, onCommitRename, onCancelRename, onDelete,
}) => (
  <div
    onClick={() => { if (!isRenaming) onSelect(); }}
    className={`relative px-3 py-2.5 rounded-xl cursor-pointer transition-all group ${
      isActive
        ? "conv-item-active shadow-sm"
        : "hover:bg-slate-50 border border-transparent hover:border-slate-100"
    }`}
  >
    <div className="flex items-center gap-2.5 pr-6 min-w-0">
      <svg
        className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${isActive ? "text-emerald-500" : "text-slate-300 group-hover:text-slate-400"}`}
        fill="currentColor" viewBox="0 0 24 24"
      >
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
      </svg>

      {isRenaming ? (
        <input
          ref={renameInputRef}
          className="flex-1 text-sm bg-white border border-emerald-400 rounded-lg px-2 py-0.5 text-slate-900 focus:outline-none ring-1 ring-emerald-300 min-w-0"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onCommitRename(); if (e.key === "Escape") onCancelRename(); }}
          onBlur={onCommitRename}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="min-w-0 flex-1">
          <p className={`text-sm truncate font-medium transition-colors ${isActive ? "text-emerald-800" : "text-slate-700 group-hover:text-slate-900"}`}>
            {c.title}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{dayjs(c.updatedAt).fromNow()}</p>
        </div>
      )}
    </div>

    {/* Three-dot */}
    {!isRenaming && (
      <button
        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === c._id ? null : c._id); }}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 opacity-0 group-hover:opacity-100 transition-all"
      >
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
    )}

    {/* Dropdown */}
    {openMenuId === c._id && (
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute right-2 top-9 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl w-36 overflow-hidden py-1.5"
      >
        <button onClick={onStartRename} className="w-full text-left px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5">
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Renommer
        </button>
        <div className="h-px bg-slate-100 mx-2 my-0.5" />
        <button onClick={onDelete} className="w-full text-left px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Supprimer
        </button>
      </div>
    )}
  </div>
);

export default Sidebar;
