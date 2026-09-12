"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/client-session";
import { Button } from "@/components/ui/button";

type SetupRequest = { id: string; name: string; email: string; websiteUrl: string; integrationType: string; issueType: string; comment: string | null; status: "PENDING" | "CONTACTED" | "CLOSED"; createdAt: string };

async function fetchRequests(): Promise<SetupRequest[]> {
  const response = await authFetch("/api/admin/setup-requests");
  if (!response.ok) throw new Error("Could not load requests");
  return (await response.json()).data.requests;
}

export function SetupRequests() {
  const [requests, setRequests] = useState<SetupRequest[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  async function load() {
    try {
      setRequests(await fetchRequests());
      setError(false);
    } catch { setError(true); } finally { setLoading(false); }
  }
  useEffect(() => {
    let cancelled = false;
    void fetchRequests().then(items => {
      if (!cancelled) setRequests(items);
    }).catch(() => {
      if (!cancelled) setError(true);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);
  async function update(id: string, status: SetupRequest["status"]) {
    setBusy(id); setError(false);
    try {
      const response = await authFetch("/api/admin/setup-requests", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      if (!response.ok) throw new Error();
      await load();
    } catch { setError(true); } finally { setBusy(null); }
  }
  return <section className="saas-card my-6 space-y-4">
    <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Integration setup requests</h2><Button variant="outline" onClick={() => void load()}>Refresh</Button></div>
    <p className="text-sm text-slate-600">Up to 100 open requests, oldest first. Changing status does not send a message.</p>
    {error && <p role="alert" className="text-sm text-red-700">Could not load or update requests. Retry.</p>}
    {loading ? <p>Loading…</p> : !error && !requests.length ? <p className="text-sm text-slate-500">No open requests.</p> : null}
    {requests.map(item => <article key={item.id} className="rounded-lg border border-slate-200 p-4 text-sm space-y-2">
      <p className="font-semibold">{item.integrationType} · {item.status} · #{item.id.slice(0, 8)}</p>
      <p>{item.name} · {item.email}</p><p className="break-all">{item.websiteUrl}</p>
      <p>{new Date(item.createdAt).toLocaleString()} · {item.issueType}</p>
      {item.comment && <p className="whitespace-pre-wrap break-words text-slate-600">{item.comment}</p>}
      <div className="flex flex-wrap gap-2"><Button disabled={busy !== null || item.status === "CONTACTED"} variant="outline" onClick={() => void update(item.id, "CONTACTED")}>Mark contacted</Button><Button disabled={busy !== null} variant="outline" onClick={() => void update(item.id, "CLOSED")}>Close request</Button></div>
    </article>)}
  </section>;
}
