import { useKeycloak } from "@react-keycloak/web";
import { useNavigate } from "react-router-dom";
import { AppLogo } from "../../components/Logo.jsx";

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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed z-50 flex flex-col w-72 h-screen bg-[#0f172a] border-r border-white/[0.07] shadow-2xl shadow-black/40
        transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:shadow-none`}
      >
        {/* ── Header ── */}
        <div className="px-4 pt-5 pb-4 border-b border-white/[0.07]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <AppLogo size="sm" dark showText />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Login CTA */}
          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-900/50 hover:shadow-emerald-900/70 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-sm"
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
          <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3">
            <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs font-bold text-amber-300">Mode public</p>
              <p className="text-xs text-amber-400/70 mt-0.5">Vos messages ne sont pas sauvegardés</p>
            </div>
          </div>

          {/* Perks */}
          <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Avec un compte</p>
            <ul className="space-y-2.5">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white font-medium py-2.5 px-4 rounded-xl hover:bg-white/[0.06] border border-transparent hover:border-white/[0.07] transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à l'accueil
          </button>
        </div>

        {/* ── Guest profile footer ── */}
        <div className="px-2 py-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.05]">
            <div className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center text-slate-400 font-bold text-sm flex-shrink-0">
              G
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Invité</p>
              <p className="text-xs text-slate-500 truncate">Mode public · non sauvegardé</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
