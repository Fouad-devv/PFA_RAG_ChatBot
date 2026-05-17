import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useKeycloak } from "@react-keycloak/web";
import DocumentsPage from "./DocumentsPage";
import KnowledgePage from "./KnowledgePage";

const TABS = [
  {
    id: "documents",
    label: "Documents",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    id: "knowledge",
    label: "Base de connaissances",
    icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4",
  },
];

export function Admin() {
  const [activeTab, setActiveTab] = useState("documents");
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();

  const username = keycloak.tokenParsed?.preferred_username || "Admin";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* ── Top navbar ── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-200">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 tracking-tight">Admin Panel</span>
          <span className="hidden sm:block text-slate-300 mx-1">·</span>
          <span className="hidden sm:block text-sm text-slate-400">Code du Travail Marocain</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-600 font-medium">{username}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
              admin
            </span>
          </div>
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="hidden sm:inline">Retour au chat</span>
          </button>
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 flex-shrink-0">
        <div className="flex gap-0.5 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-6">
          {activeTab === "documents" ? <DocumentsPage /> : <KnowledgePage />}
        </div>
      </main>
    </div>
  );
}
