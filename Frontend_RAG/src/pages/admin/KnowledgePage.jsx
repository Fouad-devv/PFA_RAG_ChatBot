import { useCallback, useEffect, useState } from "react";
import useAxiosPrivate from "../../api/useAxiosPrivate";
import { showToast } from "../../components/Toast";

const LIMIT = 15;

export default function KnowledgePage() {
  const axios = useAxiosPrivate();

  const [chunks, setChunks]         = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage]             = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const fetchChunks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (debouncedSearch) params.set("search", debouncedSearch);
      const res = await axios.get(`/api/admin/chunks?${params.toString()}`);
      setChunks(res.data.chunks || []);
      setTotal(res.data.total || 0);
    } catch {
      showToast("Erreur lors du chargement", "error");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchChunks(); }, [fetchChunks]);

  const handleDeleteChunk = async (id) => {
    if (!window.confirm("Supprimer définitivement ce chunk ?")) return;
    setDeletingId(id);
    try {
      await axios.delete(`/api/admin/chunks/${id}`);
      showToast("Chunk supprimé");
      fetchChunks();
    } catch {
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);
  const start = (page - 1) * LIMIT + 1;
  const end   = Math.min(page * LIMIT, total);

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Search bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-300 transition"
            placeholder="Rechercher dans les chunks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-sm text-slate-500 whitespace-nowrap flex-shrink-0">
          {total > 0 ? `${start}–${end} sur ${total}` : `${total} chunk(s)`}
        </div>
      </div>

      {/* ── Chunks table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="spinner w-8 h-8" />
            <p className="text-sm text-slate-400">Chargement…</p>
          </div>
        ) : chunks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-600">
              {debouncedSearch ? `Aucun résultat pour « ${debouncedSearch} »` : "Aucun chunk trouvé"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Contenu</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide w-40">Source</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {chunks.map((chunk) => (
                  <tr key={chunk._id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-6 py-4 max-w-2xl">
                      <p className="text-slate-700 text-xs leading-relaxed line-clamp-3">
                        {chunk.text}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block max-w-[140px] truncate text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium" title={chunk.metadata?.source}>
                        {chunk.metadata?.source || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleDeleteChunk(chunk._id)}
                        disabled={deletingId === chunk._id}
                        title="Supprimer ce chunk"
                        className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 disabled:opacity-50 transition-all"
                      >
                        {deletingId === chunk._id
                          ? <span className="spinner w-4 h-4" />
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Précédent
          </button>
          <span className="text-sm text-slate-500 font-medium">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Suivant
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
