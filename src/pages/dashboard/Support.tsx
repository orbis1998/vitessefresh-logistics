import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const ClientSupport = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [threads, setThreads] = useState<any[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("support_threads").select("*").eq("client_id", user.id).order("created_at", { ascending: false });
    setThreads(data ?? []);
    if (!active && data?.[0]) setActive(data[0].id);
  };

  useEffect(() => {
    load();
  }, [user]);

  useEffect(() => {
    if (!active) return;
    supabase.from("support_messages").select("*").eq("thread_id", active).order("created_at").then(({ data }) => setMessages(data ?? []));
  }, [active]);

  const create = async () => {
    if (!user || !subject.trim()) return;
    const { data } = await supabase.from("support_threads").insert({ client_id: user.id, subject: subject.trim() }).select("id").single();
    setSubject("");
    await load();
    if (data?.id) setActive(data.id);
  };

  const send = async () => {
    if (!active || !body.trim() || !user) return;
    await supabase.from("support_messages").insert({ thread_id: active, sender_id: user.id, body: body.trim() });
    setBody("");
    const { data } = await supabase.from("support_messages").select("*").eq("thread_id", active).order("created_at");
    setMessages(data ?? []);
  };

  return (
    <DashboardLayout title="Support" subtitle="Écrire à Vita Express">
      <div className="flex gap-2 max-w-2xl mb-6">
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Sujet" />
        <Button onClick={create}>Ouvrir un ticket</Button>
      </div>
      <div className="grid md:grid-cols-5 gap-4 max-w-3xl">
        <ul className="md:col-span-2 space-y-2">
          {threads.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => setActive(t.id)} className={`w-full text-left rounded-xl border p-3 text-sm ${active === t.id ? "border-primary" : "border-border"}`}>
                {t.subject} · {t.status}
              </button>
            </li>
          ))}
        </ul>
        <div className="md:col-span-3 space-y-2">
          <div className="rounded-xl border border-border min-h-[180px] p-3 space-y-2 text-sm">
            {messages.map((m) => (
              <p key={m.id} className="rounded-lg bg-secondary px-3 py-2">{m.body}</p>
            ))}
            {active && messages.length === 0 && <p className="text-muted-foreground">Aucun message.</p>}
          </div>
          {active && (
            <div className="flex gap-2">
              <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Votre message…" />
              <Button onClick={send}>Envoyer</Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientSupport;
