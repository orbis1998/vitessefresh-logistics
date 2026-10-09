import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const AdminSupport = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [wa, setWa] = useState<any[]>([]);

  const load = async () => {
    const [{ data: t }, { data: w }] = await Promise.all([
      supabase.from("support_threads").select("*").order("updated_at", { ascending: false }),
      supabase.from("whatsapp_messages").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    setThreads(t ?? []);
    setWa(w ?? []);
    if (!active && t?.[0]) setActive(t[0].id);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!active) return;
    supabase.from("support_messages").select("*").eq("thread_id", active).order("created_at").then(({ data }) => setMessages(data ?? []));
  }, [active]);

  const send = async () => {
    if (!active || !body.trim() || !user) return;
    await supabase.from("support_messages").insert({ thread_id: active, sender_id: user.id, body: body.trim() });
    setBody("");
    const { data } = await supabase.from("support_messages").select("*").eq("thread_id", active).order("created_at");
    setMessages(data ?? []);
  };

  return (
    <DashboardLayout title="Support" subtitle="Tickets et file WhatsApp">
      <div className="grid lg:grid-cols-5 gap-4">
        <ul className="lg:col-span-2 space-y-2">
          {threads.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => setActive(t.id)} className={`w-full text-left rounded-xl border p-3 text-sm ${active === t.id ? "border-primary" : "border-white/10"}`}>
                <p>{t.subject}</p>
                <p className="text-xs text-white/40">{t.status}</p>
              </button>
            </li>
          ))}
          {threads.length === 0 && <p className="text-white/40 text-sm">Aucun ticket.</p>}
        </ul>
        <div className="lg:col-span-3 space-y-3">
          <div className="rounded-xl border border-white/10 h-64 overflow-y-auto p-3 space-y-2 text-sm">
            {messages.map((m) => (
              <p key={m.id} className="rounded-lg bg-white/5 px-3 py-2">{m.body}</p>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Réponse…" className="bg-white/5 border-white/10" />
            <Button onClick={send}>Envoyer</Button>
          </div>
          <div className="rounded-xl border border-white/10 p-3">
            <p className="text-xs uppercase tracking-wider text-white/40 mb-2">WhatsApp outbox</p>
            <ul className="text-xs space-y-1 text-white/55">
              {wa.map((w) => (
                <li key={w.id}>{w.status} · {w.kind} · {w.phone}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSupport;
