import { useKeycloak } from "@react-keycloak/web";
import { useNavigate } from "react-router-dom";

export const Landing = () => {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();

  const handleLogin = () => {
    keycloak.login({ redirectUri: window.location.origin + "/home" });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">RAG Assistant</span>
        </div>

        <button
          onClick={handleLogin}
          className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-slate-800"
        >
          Se connecter
        </button>
      </nav>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center py-20">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Retrieval-Augmented Generation
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Posez vos questions,
          <br />
          <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            obtenez des réponses intelligentes
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mb-12 leading-relaxed">
          Un assistant IA basé sur la technologie RAG. Explorez sans compte ou connectez-vous pour sauvegarder vos conversations.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm sm:max-w-none sm:w-auto">
          <button
            onClick={() => navigate("/chat")}
            className="flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-emerald-900/40 hover:shadow-emerald-800/50 transition-all text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Essayer sans compte
          </button>

          <button
            onClick={handleLogin}
            className="flex items-center justify-center gap-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-8 py-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-all text-base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Se connecter
          </button>
        </div>

        {/* Hint */}
        <p className="mt-5 text-slate-500 text-sm">
          Sans compte — conversations non sauvegardées
        </p>
      </main>

      {/* ── Features ── */}
      <section className="px-6 sm:px-10 pb-20 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-800 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Basé sur vos documents</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              L'assistant puise dans une base de connaissances dédiée pour des réponses précises et contextuelles.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-800 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Historique sécurisé</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Connectez-vous pour retrouver toutes vos conversations sauvegardées, à tout moment.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-emerald-800 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-white mb-2">Réponses rapides</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Accès immédiat sans inscription. Testez le chatbot directement depuis la page d'accueil.
            </p>
          </div>

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 px-6 py-5 text-center text-slate-500 text-sm">
        RAG Assistant — Projet de Fin d'Année &nbsp;·&nbsp; {new Date().getFullYear()}
      </footer>

    </div>
  );
};
