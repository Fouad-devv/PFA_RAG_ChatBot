import { useKeycloak } from "@react-keycloak/web";
import { useNavigate } from "react-router-dom";

const PERKS = [
  "Historique illimité des conversations",
  "Accès depuis n'importe quel appareil",
  "Données sauvegardées en sécurité",
];

export const PublicSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();

  const handleLogin = () => keycloak.login({ redirectUri: window.location.origin + "/home" });

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed z-50 flex flex-col w-72 h-screen bg-white border-r border-slate-100 shadow-2xl shadow-slate-200/60
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:shadow-none`}
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

          {/* Login CTA */}
          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-100 hover:shadow-emerald-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Se connecter
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 flex flex-col gap-3">

          {/* Not saved badge */}
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs font-bold text-amber-700">Mode public</p>
              <p className="text-xs text-amber-600 mt-0.5">Vos messages ne sont pas sauvegardés</p>
            </div>
          </div>

          {/* Perks */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Avec un compte</p>
            <ul className="space-y-2.5">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Back to home */}
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-medium py-2.5 px-4 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à l'accueil
          </button>
        </div>

        {/* ── Guest profile footer ── */}
        <div className="px-2 py-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
            <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm flex-shrink-0">
              G
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-700 truncate">Invité</p>
              <p className="text-xs text-slate-400 truncate">Mode public · non sauvegardé</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
