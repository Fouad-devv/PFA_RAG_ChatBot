import { useKeycloak } from "@react-keycloak/web";
import { useNavigate } from "react-router-dom";

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Basé sur vos documents",
    desc: "L'assistant puise dans une base de connaissances dédiée pour des réponses précises et contextuelles.",
  },
  {
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Historique sécurisé",
    desc: "Connectez-vous pour retrouver toutes vos conversations sauvegardées, à tout moment.",
  },
  {
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Réponses instantanées",
    desc: "Accès immédiat sans inscription. Testez le chatbot directement, aucun compte requis.",
  },
];

export const Landing = () => {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();

  const handleLogin = () => keycloak.login({ redirectUri: window.location.origin + "/home" });

  return (
    <div className="relative min-h-screen bg-[#070a14] text-white overflow-hidden flex flex-col">

      {/* ── Background orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/3 -left-1/4 w-[750px] h-[750px] rounded-full bg-emerald-500 opacity-[0.08] blur-[130px] animate-orb-1" />
        <div className="absolute -bottom-1/3 -right-1/4 w-[650px] h-[650px] rounded-full bg-violet-600 opacity-[0.09] blur-[110px] animate-orb-2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-teal-500 opacity-[0.05] blur-[90px] animate-orb-3" />
      </div>

      {/* ── Dot grid overlay ── */}
      <div className="fixed inset-0 bg-dot-grid pointer-events-none" />

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-12 lg:px-20 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 glow-emerald-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">RAG Assistant</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/chat")}
            className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5"
          >
            Essayer
          </button>
          <button
            onClick={handleLogin}
            className="text-sm font-semibold bg-white/8 hover:bg-white/12 border border-white/12 hover:border-white/20 text-white px-5 py-2 rounded-xl transition-all backdrop-blur-sm"
          >
            Se connecter
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">

        {/* Badge */}
        <div className="animate-fade-in inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold px-4 py-2 rounded-full mb-10 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Retrieval-Augmented Generation · Projet de Fin d'Année
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in delay-100 text-5xl sm:text-6xl md:text-7xl font-black tracking-tight mb-7 leading-[1.06] max-w-4xl">
          Votre assistant IA
          <br />
          <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-300 bg-clip-text text-transparent">
            intelligent & précis
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in delay-200 text-slate-400 text-lg sm:text-xl max-w-xl mb-11 leading-relaxed">
          Posez vos questions et obtenez des réponses précises grâce à la technologie RAG.
          Sans compte ou avec historique complet.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in delay-300 flex flex-col sm:flex-row gap-4 mb-5">
          <button
            onClick={() => navigate("/chat")}
            className="group relative flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold px-9 py-4 rounded-2xl transition-all text-base glow-emerald hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Essayer sans compte
          </button>

          <button
            onClick={handleLogin}
            className="flex items-center justify-center gap-2.5 glass-dark hover:bg-white/[0.07] text-white font-semibold px-9 py-4 rounded-2xl transition-all text-base hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Se connecter
          </button>
        </div>

        <p className="text-slate-600 text-sm">
          Sans compte · Gratuit · Aucune installation requise
        </p>

        {/* ── Chat preview card ── */}
        <div className="animate-fade-in-up delay-300 mt-16 w-full max-w-2xl mx-auto">
          <div className="glass-dark rounded-3xl p-1 shadow-2xl shadow-black/40">
            {/* Card header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              </div>
              <span className="text-xs text-slate-500 ml-2 font-medium">RAG Assistant — conversation</span>
            </div>

            {/* Mock chat */}
            <div className="p-5 space-y-4">
              <div className="flex gap-3 items-end">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                  AI
                </div>
                <div className="bg-white/[0.07] border border-white/[0.06] rounded-2xl rounded-bl-none px-4 py-3 text-sm text-slate-300 max-w-xs leading-relaxed">
                  Bonjour ! Je suis votre assistant RAG. Comment puis-je vous aider ?
                </div>
              </div>

              <div className="flex gap-3 items-end flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-300 flex-shrink-0">
                  U
                </div>
                <div className="bg-emerald-500/15 border border-emerald-500/20 rounded-2xl rounded-br-none px-4 py-3 text-sm text-emerald-100 max-w-xs leading-relaxed">
                  Explique-moi la technologie RAG en quelques mots.
                </div>
              </div>

              <div className="flex gap-3 items-end">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                  AI
                </div>
                <div className="bg-white/[0.07] border border-white/[0.06] rounded-2xl rounded-bl-none px-4 py-3 text-sm text-slate-300 max-w-sm leading-relaxed">
                  RAG combine la recherche documentaire avec la génération par IA pour des réponses précises et ancrées dans vos données...
                  <span className="inline-block w-1.5 h-4 bg-emerald-400 ml-1 animate-pulse align-middle rounded-sm" />
                </div>
              </div>
            </div>

            {/* Mock input */}
            <div className="px-5 pb-4">
              <div className="flex items-center gap-3 bg-white/[0.05] border border-white/[0.07] rounded-xl px-4 py-3">
                <span className="text-slate-600 text-sm flex-1 text-left">Posez votre question…</span>
                <div className="w-8 h-8 rounded-full bg-emerald-500/25 border border-emerald-500/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m0 0l-6-6m6 6l-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Glow below card */}
          <div className="h-px mt-1 mx-12 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        </div>
      </main>

      {/* ── Features ── */}
      <section className="relative z-10 px-6 sm:px-12 lg:px-20 pb-20 max-w-6xl mx-auto w-full">
        <div className="text-center mb-10">
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-widest mb-2">Fonctionnalités</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Tout ce dont vous avez besoin</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass-dark hover:bg-white/[0.07] hover:border-white/[0.13] rounded-2xl p-6 transition-all group hover:-translate-y-0.5"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:bg-emerald-500/15 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-bold text-white mb-2.5">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.05] px-6 py-5 text-center text-slate-600 text-sm">
        RAG Assistant &nbsp;·&nbsp; Projet de Fin d'Année &nbsp;·&nbsp; {new Date().getFullYear()}
      </footer>

    </div>
  );
};
