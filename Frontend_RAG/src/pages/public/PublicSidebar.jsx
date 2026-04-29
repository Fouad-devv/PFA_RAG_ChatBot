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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed z-50 flex flex-col w-72 h-screen border-r border-white/[0.07] transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:flex`}
        style={{ background: "linear-gradient(160deg, #0d1120 0%, #080d18 60%, #0a0f1e 100%)" }}
      >
        {/* Subtle orb inside sidebar */}
        <div className="absolute top-0 left-0 w-48 h-48 rounded-full bg-emerald-500/10 blur-[60px] pointer-events-none" />
        <div className="absolute bottom-20 right-0 w-36 h-36 rounded-full bg-violet-500/10 blur-[50px] pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight">RAG Assistant</span>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="relative z-10 flex flex-col flex-1 px-4 py-5 gap-4 overflow-y-auto custom-scrollbar">

          {/* Guest pill */}
          <div className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-slate-700/80 border border-slate-600/50 flex items-center justify-center text-slate-300 font-bold text-sm flex-shrink-0">
              G
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Invité</p>
              <p className="text-xs text-slate-500">Mode public · non sauvegardé</p>
            </div>
          </div>

          {/* Info */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wide">Mode public</p>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Vos messages ne sont <span className="text-white font-semibold">pas sauvegardés</span>. Créez un compte pour débloquer l'historique.
            </p>
          </div>

          {/* Perks */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Avec un compte</p>
            <ul className="space-y-2.5">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-all glow-emerald-sm hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Se connecter
          </button>

          {/* Back */}
          <button
            onClick={() => navigate("/")}
            className="w-full text-slate-500 hover:text-slate-300 text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à l'accueil
          </button>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-5 py-4 border-t border-white/[0.05] text-center text-slate-700 text-xs">
          RAG Assistant · {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
};
