import { useCallback, useEffect, useRef, useState } from "react";
import useAxiosPrivate from "../../api/useAxiosPrivate";
import { showToast } from "../../components/Toast";

export default function DocumentsPage() {
  const axios = useAxiosPrivate();
  const fileInputRef = useRef();

  const [stats, setStats]           = useState(null);
  const [documents, setDocuments]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [uploading, setUploading]   = useState(false);
  const [reingesting, setReingesting] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [dragOver, setDragOver]     = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, dRes] = await Promise.all([
        axios.get("/api/admin/stats"),
        axios.get("/api/admin/documents"),
      ]);
      setStats(sRes.data);
      setDocuments(dRes.data.documents || []);
    } catch {
      showToast("Erreur lors du chargement des données", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpload = async (files) => {
    const pdfs = Array.from(files).filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    if (!pdfs.length) { showToast("Sélectionnez des fichiers PDF uniquement", "error"); return; }

    setUploading(true);
    let succeeded = 0;
    for (const file of pdfs) {
      const form = new FormData();
      form.append("file", file);
      try {
        const res = await axios.post("/api/admin/upload", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showToast(`✓ ${file.name} — ${res.data.chunks} chunks ingérés`);
        succeeded++;
      } catch (err) {
        showToast(`Échec pour ${file.name}: ${err.response?.data?.error || "erreur"}`, "error");
      }
    }
    if (succeeded > 0) fetchData();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteDoc = async (source) => {
    if (!window.confirm(`Supprimer tous les chunks du document "${source}" ?\n\nCette action est irréversible.`)) return;
    setDeletingDoc(source);
    try {
      const res = await axios.delete(`/api/admin/documents/${encodeURIComponent(source)}`);
      showToast(`${res.data.deleted_chunks} chunks supprimés`);
      fetchData();
    } catch {
      showToast("Erreur lors de la suppression", "error");
    } finally {
      setDeletingDoc(null);
    }
  };

  const handleReingest = async () => {
    if (!window.confirm("Ré-ingérer tous les PDF du dossier data/ ?\n\nLes données actuelles seront effacées avant la ré-ingestion.")) return;
    setReingesting(true);
    try {
      const res = await axios.post("/api/admin/reingest");
      showToast(`${res.data.reingested} document(s) ré-ingéré(s) · ${res.data.total_chunks} chunks`);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || "Erreur de ré-ingestion", "error");
    } finally {
      setReingesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            label: "Documents ingérés",
            value: stats?.total_documents ?? "—",
            icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            bg: "bg-amber-50", iconBg: "bg-amber-100", iconColor: "text-amber-600",
          },
          {
            label: "Total chunks vectorisés",
            value: stats?.total_chunks ?? "—",
            icon: "M4 6h16M4 10h16M4 14h16M4 18h16",
            bg: "bg-emerald-50", iconBg: "bg-emerald-100", iconColor: "text-emerald-600",
          },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl border border-slate-200 p-5 flex items-center gap-4`}>
            <div className={`w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
              <svg className={`w-6 h-6 ${s.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={s.icon} />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Upload area ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-slate-900">Ajouter un document</h2>
            <p className="text-xs text-slate-400 mt-0.5">Glissez-déposez des PDF ou cliquez pour sélectionner</p>
          </div>
          <button
            onClick={handleReingest}
            disabled={reingesting}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all"
          >
            {reingesting
              ? <span className="spinner w-4 h-4" />
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            }
            Ré-ingérer data/
          </button>
        </div>

        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
          className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? "border-amber-400 bg-amber-50 scale-[1.01]"
              : "border-slate-200 hover:border-amber-300 hover:bg-amber-50/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="spinner w-10 h-10" />
              <p className="text-sm font-medium text-slate-600">Ingestion en cours…</p>
              <p className="text-xs text-slate-400">Extraction du texte, découpage et vectorisation</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                dragOver ? "bg-amber-200" : "bg-amber-100"
              }`}>
                <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-700">
                  {dragOver ? "Relâchez pour uploader" : "Déposez vos PDF ici"}
                </p>
                <p className="text-sm text-slate-400 mt-1">ou <span className="text-amber-600 font-medium">cliquez pour parcourir</span></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Documents table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Documents ingérés</h2>
          <span className="text-xs text-slate-400">{documents.length} document(s)</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="spinner w-8 h-8" />
            <p className="text-sm text-slate-400">Chargement…</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-600">Aucun document ingéré</p>
            <p className="text-xs text-slate-400 mt-1">Uploadez un PDF pour commencer</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Fichier</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">Chunks</th>
                  <th className="px-6 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {documents.map((doc) => (
                  <tr key={doc.source} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />
                          </svg>
                        </div>
                        <span className="font-medium text-slate-800">{doc.source}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        {doc.chunk_count} chunks
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDeleteDoc(doc.source)}
                        disabled={deletingDoc === doc.source}
                        title="Supprimer ce document"
                        className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 disabled:opacity-50 transition-all"
                      >
                        {deletingDoc === doc.source
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
    </div>
  );
}
