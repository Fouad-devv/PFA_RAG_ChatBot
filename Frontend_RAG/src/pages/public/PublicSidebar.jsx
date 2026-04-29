import { useKeycloak } from "@react-keycloak/web";
import { useNavigate } from "react-router-dom";

export const PublicSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();

  const handleLogin = () => {
    keycloak.login({ redirectUri: window.location.origin + "/home" });
  };

  return (
    <div
      className={`fixed z-50 flex flex-col w-64 lg:w-72 bg-slate-950 text-white h-screen border-r border-slate-800 transition-transform transform shadow-2xl
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:flex`}
    >
      {/* Header */}
      <div className="px-5 py-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
            </svg>
          </div>
          <span className="font-bold text-white tracking-tight">RAG Assistant</span>
        </div>

        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-4 overflow-y-auto">

        {/* Guest badge */}
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm flex-shrink-0">
            G
          </div>
          <div>
            <p className="text-sm font-medium text-white">Invité</p>
            <p className="text-xs text-slate-400">Mode public</p>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-emerald-950/50 border border-emerald-900 rounded-xl p-4">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">Mode public</p>
          <p className="text-sm text-slate-300 leading-relaxed">
            Les messages ne sont <span className="font-semibold text-white">pas sauvegardés</span>. Connectez-vous pour accéder à l'historique.
          </p>
        </div>

        {/* Features list */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Avec un compte</p>
          <ul className="space-y-2.5">
            {[
              "Historique des conversations",
              "Plusieurs sessions simultanées",
              "Accès sécurisé",
            ].map((feat) => (
              <li key={feat} className="flex items-center gap-2 text-sm text-slate-300">
                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {feat}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <button
          onClick={handleLogin}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Se connecter
        </button>

        {/* Back to home */}
        <button
          onClick={() => navigate("/")}
          className="w-full text-slate-400 hover:text-white text-sm font-medium py-2 px-4 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à l'accueil
        </button>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800 text-center text-slate-600 text-xs">
        Chat public — non persistant
      </div>
    </div>
  );
};
