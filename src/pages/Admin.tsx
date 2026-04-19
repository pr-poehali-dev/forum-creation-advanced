import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/99f13565-043d-4a37-a932-d20977116e70";

interface User { id: number; username: string; role: string; rank: string; avatar: string; }
interface Member {
  id: number; username: string; role: string; rank: string; avatar: string;
  reputation: number; is_banned: boolean; ban_reason: string | null; ban_until: string | null;
  is_muted: boolean; mute_until: string | null; warnings: number; created_at: string;
}
interface ModLog { id: number; admin: string; target: string | null; action: string; reason: string | null; created_at: string; }
interface Maintenance { is_active: boolean; message: string; }

type Tab = "users" | "modlog" | "maintenance";

// ─── Модальное окно действия ────────────────────────────────────────────────
interface ActionModal {
  userId: number; username: string;
  type: "ban" | "mute" | "warn" | "kick" | "unban" | "unmute" | "delete" | "role";
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-rubik font-medium px-2 py-0.5 rounded-md border ${color}`}>
      {children}
    </span>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const [user] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem("nexus_user") || "null"); } catch { return null; }
  });

  const [tab, setTab] = useState<Tab>("users");
  const [members, setMembers] = useState<Member[]>([]);
  const [modlogs, setModlogs] = useState<ModLog[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance>({ is_active: false, message: "" });
  const [maintMsg, setMaintMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState<ActionModal | null>(null);
  const [modalReason, setModalReason] = useState("");
  const [modalDays, setModalDays] = useState("");
  const [modalMinutes, setModalMinutes] = useState("60");
  const [actionLoading, setActionLoading] = useState(false);

  const token = () => localStorage.getItem("nexus_token") || "";

  const apiGet = useCallback(async (act: string) => {
    const res = await fetch(`${AUTH_URL}?action=${act}`, {
      headers: { "X-Session-Token": token() },
    });
    return res.json();
  }, []);

  const apiPost = useCallback(async (act: string, body: object) => {
    const res = await fetch(`${AUTH_URL}?action=${act}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Token": token() },
      body: JSON.stringify(body),
    });
    return res.json();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const data = await apiGet("admin_users");
    if (data.users) setMembers(data.users);
    setLoading(false);
  }, [apiGet]);

  const fetchModlog = useCallback(async () => {
    const data = await apiGet("admin_modlog");
    if (data.logs) setModlogs(data.logs);
  }, [apiGet]);

  const fetchMaintenance = useCallback(async () => {
    const data = await apiGet("maintenance");
    setMaintenance(data);
    setMaintMsg(data.message || "");
  }, [apiGet]);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchUsers();
    fetchMaintenance();
  }, [user, navigate, fetchUsers, fetchMaintenance]);

  useEffect(() => {
    if (tab === "modlog") fetchModlog();
  }, [tab, fetchModlog]);

  const openModal = (m: Member, type: ActionModal["type"]) => {
    setModal({ userId: m.id, username: m.username, type });
    setModalReason("");
    setModalDays("");
    setModalMinutes("60");
  };

  const closeModal = () => setModal(null);

  const confirmAction = async () => {
    if (!modal) return;
    setActionLoading(true);
    const { userId, type } = modal;

    let ok = false;
    if (type === "ban") {
      const r = await apiPost("admin_ban", { user_id: userId, reason: modalReason, days: modalDays ? Number(modalDays) : null });
      ok = r.ok;
    } else if (type === "unban") {
      const r = await apiPost("admin_unban", { user_id: userId });
      ok = r.ok;
    } else if (type === "mute") {
      const r = await apiPost("admin_mute", { user_id: userId, reason: modalReason, minutes: Number(modalMinutes) });
      ok = r.ok;
    } else if (type === "unmute") {
      const r = await apiPost("admin_unmute", { user_id: userId });
      ok = r.ok;
    } else if (type === "warn") {
      const r = await apiPost("admin_warn", { user_id: userId, reason: modalReason });
      ok = r.ok;
    } else if (type === "kick") {
      const r = await apiPost("admin_kick", { user_id: userId, reason: modalReason });
      ok = r.ok;
    } else if (type === "delete") {
      const r = await apiPost("admin_delete_user", { user_id: userId });
      ok = r.ok;
    } else if (type === "role") {
      const m2 = members.find(m => m.id === userId);
      const newRole = m2?.role === "admin" ? "member" : "admin";
      const r = await apiPost("admin_set_role", { user_id: userId, role: newRole });
      ok = r.ok;
    }

    setActionLoading(false);
    if (ok) {
      showToast(actionLabel(type) + " — выполнено");
      closeModal();
      fetchUsers();
    }
  };

  const toggleMaintenance = async () => {
    const next = !maintenance.is_active;
    const r = await apiPost("admin_maintenance", { is_active: next, message: maintMsg });
    if (r.ok) {
      setMaintenance(prev => ({ ...prev, is_active: next }));
      showToast(next ? "🔧 Режим техработ ВКЛЮЧЁН" : "✅ Форум ОТКРЫТ");
    }
  };

  const saveMaintMsg = async () => {
    const r = await apiPost("admin_maintenance", { is_active: maintenance.is_active, message: maintMsg });
    if (r.ok) showToast("Сообщение сохранено");
  };

  if (!user || user.role !== "admin") return null;

  const stats = {
    total: members.length,
    admins: members.filter(m => m.role === "admin").length,
    banned: members.filter(m => m.is_banned).length,
    muted: members.filter(m => m.is_muted).length,
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-yellow-600/8 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-700/8 blur-[100px]" />
        <div className="scanline absolute inset-0 opacity-30" />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-2 bg-card border border-neon-green/40 rounded-xl px-4 py-3 text-neon-green text-sm font-rubik shadow-xl animate-fade-in">
          <Icon name="CheckCircle" size={16} />
          {toast}
        </div>
      )}

      {/* NAVBAR */}
      <nav className="relative z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-neon-cyan transition-colors text-sm font-rubik">
              <Icon name="ArrowLeft" size={16} />
              На форум
            </button>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-yellow-500/20 border border-yellow-500/40 rounded-lg flex items-center justify-center">
                <Icon name="Shield" size={14} className="text-yellow-400" />
              </div>
              <span className="font-rajdhani font-bold text-xl text-yellow-400">NEXUS ADMIN</span>
            </div>
            {maintenance.is_active && (
              <Badge color="text-orange-400 bg-orange-500/10 border-orange-500/30">
                <Icon name="Wrench" size={10} /> ТЕХРАБОТЫ
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-3 py-1.5">
            <span className="text-lg">{user.avatar}</span>
            <span className="text-foreground text-xs font-rubik font-medium">{user.username}</span>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Участников", value: stats.total, icon: "Users", color: "text-neon-cyan" },
            { label: "Администраторов", value: stats.admins, icon: "Shield", color: "text-yellow-400" },
            { label: "Забанено", value: stats.banned, icon: "Ban", color: "text-red-400" },
            { label: "Замьючено", value: stats.muted, icon: "VolumeX", color: "text-orange-400" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-5 text-center">
              <div className={`flex justify-center mb-2 ${s.color}`}>
                <Icon name={s.icon as unknown as string} size={22} />
              </div>
              <div className={`font-rajdhani font-bold text-4xl ${s.color}`}>{s.value}</div>
              <div className="text-muted-foreground text-xs font-rubik mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {([
            ["users", "Пользователи", "Users"],
            ["modlog", "Лог действий", "FileText"],
            ["maintenance", "Техработы", "Wrench"],
          ] as [Tab, string, string][]).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-rubik text-sm transition-all
                ${tab === id
                  ? "grad-primary text-white border-transparent glow-purple"
                  : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon name={icon as unknown as string} size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── USERS TAB ─────────────────────────────────────────────── */}
        {tab === "users" && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-rajdhani font-bold text-xl text-foreground flex items-center gap-2">
                <Icon name="Users" size={18} className="text-neon-cyan" />
                Пользователи
              </h2>
              <button onClick={fetchUsers} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary/50">
                <Icon name="RefreshCw" size={16} />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground font-rubik gap-2">
                <Icon name="Loader" size={18} className="animate-spin" />Загрузка...
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground font-rubik gap-2">
                <Icon name="UserX" size={32} className="opacity-30" />
                <p>Нет зарегистрированных пользователей</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {members.map(m => (
                  <div key={m.id} className="px-5 py-4 hover:bg-secondary/10 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      {/* User info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                          {m.avatar}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-foreground font-rubik font-medium">{m.username}</span>
                            {m.role === "admin" && (
                              <Badge color="text-yellow-400 bg-yellow-500/10 border-yellow-500/30">
                                <Icon name="Shield" size={10} /> Админ
                              </Badge>
                            )}
                            {m.is_banned && (
                              <Badge color="text-red-400 bg-red-500/10 border-red-500/30">
                                <Icon name="Ban" size={10} /> Бан
                              </Badge>
                            )}
                            {m.is_muted && (
                              <Badge color="text-orange-400 bg-orange-500/10 border-orange-500/30">
                                <Icon name="VolumeX" size={10} /> Мут
                              </Badge>
                            )}
                            {m.warnings > 0 && (
                              <Badge color="text-yellow-300 bg-yellow-500/10 border-yellow-500/20">
                                <Icon name="AlertTriangle" size={10} /> {m.warnings} варн{m.warnings > 1 ? "а" : ""}
                              </Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground text-xs font-rubik mt-1">
                            {m.rank} · ID {m.id} · {new Date(m.created_at).toLocaleDateString("ru")}
                            {m.ban_reason && <span className="text-red-400"> · Причина бана: {m.ban_reason}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Actions — только не для себя и не для главного admin */}
                      {m.username !== "admin" && m.id !== user.id && (
                        <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
                          {/* Роль */}
                          <button onClick={() => openModal(m, "role")}
                            className="text-xs font-rubik text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1.5 rounded-lg hover:bg-yellow-500/20 transition-all flex items-center gap-1">
                            <Icon name="Shield" size={11} />
                            {m.role === "admin" ? "Снять" : "Админ"}
                          </button>
                          {/* Варн */}
                          <button onClick={() => openModal(m, "warn")}
                            className="text-xs font-rubik text-yellow-300 bg-yellow-400/10 border border-yellow-400/30 px-2.5 py-1.5 rounded-lg hover:bg-yellow-400/20 transition-all flex items-center gap-1">
                            <Icon name="AlertTriangle" size={11} />Warn
                          </button>
                          {/* Кик */}
                          <button onClick={() => openModal(m, "kick")}
                            className="text-xs font-rubik text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1.5 rounded-lg hover:bg-blue-500/20 transition-all flex items-center gap-1">
                            <Icon name="LogOut" size={11} />Kick
                          </button>
                          {/* Мут/Анмут */}
                          {m.is_muted ? (
                            <button onClick={() => openModal(m, "unmute")}
                              className="text-xs font-rubik text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1.5 rounded-lg hover:bg-orange-500/20 transition-all flex items-center gap-1">
                              <Icon name="Volume2" size={11} />Unmute
                            </button>
                          ) : (
                            <button onClick={() => openModal(m, "mute")}
                              className="text-xs font-rubik text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2.5 py-1.5 rounded-lg hover:bg-orange-500/20 transition-all flex items-center gap-1">
                              <Icon name="VolumeX" size={11} />Mute
                            </button>
                          )}
                          {/* Бан/Разбан */}
                          {m.is_banned ? (
                            <button onClick={() => openModal(m, "unban")}
                              className="text-xs font-rubik text-green-400 bg-green-500/10 border border-green-500/30 px-2.5 py-1.5 rounded-lg hover:bg-green-500/20 transition-all flex items-center gap-1">
                              <Icon name="ShieldCheck" size={11} />Unban
                            </button>
                          ) : (
                            <button onClick={() => openModal(m, "ban")}
                              className="text-xs font-rubik text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 transition-all flex items-center gap-1">
                              <Icon name="Ban" size={11} />Ban
                            </button>
                          )}
                          {/* Удалить */}
                          <button onClick={() => openModal(m, "delete")}
                            className="text-xs font-rubik text-red-500 bg-red-600/10 border border-red-600/30 px-2.5 py-1.5 rounded-lg hover:bg-red-600/20 transition-all flex items-center gap-1">
                            <Icon name="Trash2" size={11} />Del
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MODLOG TAB ────────────────────────────────────────────── */}
        {tab === "modlog" && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-rajdhani font-bold text-xl text-foreground flex items-center gap-2">
                <Icon name="FileText" size={18} className="text-neon-cyan" />
                Лог действий
              </h2>
              <button onClick={fetchModlog} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary/50">
                <Icon name="RefreshCw" size={16} />
              </button>
            </div>
            {modlogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground font-rubik gap-2">
                <Icon name="FileText" size={32} className="opacity-30" />
                <p>Лог пуст</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {modlogs.map(log => (
                  <div key={log.id} className="px-5 py-3 flex items-start gap-3 hover:bg-secondary/10 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${actionIconStyle(log.action)}`}>
                      <Icon name={actionIcon(log.action) as unknown as string} size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground text-sm font-rubik">
                        <span className="text-yellow-400 font-medium">{log.admin}</span>
                        {" → "}
                        <span className="font-medium">{actionLabel(log.action)}</span>
                        {log.target && <span className="text-neon-cyan"> @{log.target}</span>}
                        {log.reason && <span className="text-muted-foreground"> · {log.reason}</span>}
                      </div>
                      <div className="text-muted-foreground text-xs font-rubik mt-0.5">
                        {new Date(log.created_at).toLocaleString("ru")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MAINTENANCE TAB ───────────────────────────────────────── */}
        {tab === "maintenance" && (
          <div className="flex flex-col gap-4">
            {/* Status card */}
            <div className={`bg-card border rounded-2xl p-6 ${maintenance.is_active ? "border-orange-500/40" : "border-border"}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-rajdhani font-bold text-2xl text-foreground flex items-center gap-2">
                    <Icon name="Wrench" size={20} className={maintenance.is_active ? "text-orange-400" : "text-muted-foreground"} />
                    Режим технических работ
                  </h2>
                  <p className="text-muted-foreground text-sm font-rubik mt-1">
                    Когда включён — обычные пользователи не могут войти. Только администраторы.
                  </p>
                </div>
                <div className={`w-16 h-8 rounded-full flex items-center px-1 cursor-pointer transition-all ${maintenance.is_active ? "bg-orange-500" : "bg-secondary"}`}
                  onClick={toggleMaintenance}>
                  <div className={`w-6 h-6 rounded-full bg-white shadow transition-all ${maintenance.is_active ? "translate-x-8" : "translate-x-0"}`} />
                </div>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-rubik font-semibold ${maintenance.is_active
                ? "bg-orange-500/15 text-orange-400 border border-orange-500/40"
                : "bg-green-500/15 text-neon-green border border-green-500/40"
                }`}>
                <Icon name={maintenance.is_active ? "Wrench" : "CheckCircle"} size={16} />
                {maintenance.is_active ? "ТЕХРАБОТЫ АКТИВНЫ — форум закрыт" : "ФОРУМ ОТКРЫТ — всё работает"}
              </div>
            </div>

            {/* Message card */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-rajdhani font-bold text-lg text-foreground mb-3 flex items-center gap-2">
                <Icon name="MessageSquare" size={16} className="text-neon-cyan" />
                Сообщение для пользователей
              </h3>
              <textarea
                value={maintMsg}
                onChange={e => setMaintMsg(e.target.value)}
                rows={3}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm font-rubik text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/60 resize-none transition-all"
                placeholder="Ведутся технические работы. Скоро вернёмся!"
              />
              <button
                onClick={saveMaintMsg}
                className="mt-3 grad-primary text-white font-rubik font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Icon name="Save" size={16} />
                Сохранить сообщение
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL ─────────────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${modalIconBg(modal.type)}`}>
                <Icon name={actionIcon(modal.type) as unknown as string} size={18} />
              </div>
              <div>
                <h3 className="font-rajdhani font-bold text-xl text-foreground">{modalTitle(modal.type)}</h3>
                <p className="text-muted-foreground text-sm font-rubik">@{modal.username}</p>
              </div>
            </div>

            {["ban", "mute", "warn", "kick"].includes(modal.type) && (
              <div className="mb-4">
                <label className="text-xs font-rubik font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Причина
                </label>
                <input
                  type="text"
                  value={modalReason}
                  onChange={e => setModalReason(e.target.value)}
                  placeholder="Укажи причину..."
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm font-rubik text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/60 transition-all"
                />
              </div>
            )}

            {modal.type === "ban" && (
              <div className="mb-4">
                <label className="text-xs font-rubik font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Срок (дни, пусто = навсегда)
                </label>
                <input
                  type="number"
                  value={modalDays}
                  onChange={e => setModalDays(e.target.value)}
                  placeholder="Навсегда"
                  min={1}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm font-rubik text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/60 transition-all"
                />
              </div>
            )}

            {modal.type === "mute" && (
              <div className="mb-4">
                <label className="text-xs font-rubik font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Продолжительность
                </label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {[["15", "15 мин"], ["60", "1 час"], ["360", "6 часов"], ["1440", "1 день"]].map(([v, l]) => (
                    <button key={v} onClick={() => setModalMinutes(v)}
                      className={`text-xs font-rubik px-3 py-1.5 rounded-lg border transition-all ${modalMinutes === v ? "grad-primary text-white border-transparent" : "border-border text-muted-foreground hover:text-foreground"}`}>
                      {l}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={modalMinutes}
                  onChange={e => setModalMinutes(e.target.value)}
                  min={1}
                  className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm font-rubik text-foreground focus:outline-none focus:border-purple-500/60 transition-all"
                />
                <p className="text-muted-foreground text-xs font-rubik mt-1">минут</p>
              </div>
            )}

            {modal.type === "delete" && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm font-rubik flex items-center gap-2">
                <Icon name="AlertTriangle" size={16} />
                Это действие нельзя отменить. Аккаунт будет удалён навсегда.
              </div>
            )}

            {(modal.type === "unban" || modal.type === "unmute") && (
              <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-neon-green text-sm font-rubik">
                Ограничения будут сняты немедленно.
              </div>
            )}

            {modal.type === "role" && (
              <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-400 text-sm font-rubik">
                {members.find(m => m.id === modal.userId)?.role === "admin"
                  ? "Права администратора будут сняты."
                  : "Пользователь получит права администратора."}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button onClick={closeModal}
                className="flex-1 bg-secondary/50 border border-border text-muted-foreground font-rubik font-medium py-2.5 rounded-xl hover:text-foreground transition-all">
                Отмена
              </button>
              <button onClick={confirmAction} disabled={actionLoading}
                className={`flex-1 text-white font-rubik font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${modalBtnColor(modal.type)}`}>
                {actionLoading ? <Icon name="Loader" size={16} className="animate-spin" /> : <Icon name={actionIcon(modal.type) as unknown as string} size={16} />}
                {modalTitle(modal.type)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Хелперы ─────────────────────────────────────────────────────────────────
function actionLabel(action: string): string {
  const map: Record<string, string> = {
    ban: "Бан", unban: "Разбан", mute: "Мут", unmute: "Анмут",
    warn: "Варн", kick: "Кик", delete: "Удаление", role: "Роль",
    "set_role:admin": "→ Админ", "set_role:member": "→ Участник",
    "maintenance:on": "Техработы ВКЛ", "maintenance:off": "Техработы ВЫКЛ",
    delete_user: "Удалён аккаунт",
  };
  for (const k of Object.keys(map)) { if (action.startsWith(k)) return map[k]; }
  return action;
}

function actionIcon(action: string): string {
  if (action === "ban") return "Ban";
  if (action === "unban") return "ShieldCheck";
  if (action === "mute") return "VolumeX";
  if (action === "unmute") return "Volume2";
  if (action === "warn") return "AlertTriangle";
  if (action === "kick") return "LogOut";
  if (action === "delete" || action === "delete_user") return "Trash2";
  if (action === "role") return "Shield";
  if (action.includes("maintenance")) return "Wrench";
  if (action.includes("set_role")) return "Shield";
  return "Circle";
}

function actionIconStyle(action: string): string {
  if (action.includes("ban")) return "text-red-400 bg-red-500/10";
  if (action.includes("mute")) return "text-orange-400 bg-orange-500/10";
  if (action.includes("warn")) return "text-yellow-400 bg-yellow-500/10";
  if (action.includes("kick")) return "text-blue-400 bg-blue-500/10";
  if (action.includes("delete")) return "text-red-500 bg-red-600/10";
  if (action.includes("role") || action.includes("admin")) return "text-yellow-400 bg-yellow-500/10";
  if (action.includes("maintenance")) return "text-orange-400 bg-orange-500/10";
  return "text-muted-foreground bg-secondary";
}

function modalTitle(type: ActionModal["type"]): string {
  const m: Record<string, string> = {
    ban: "Забанить", unban: "Разбанить", mute: "Замьютить", unmute: "Анмутить",
    warn: "Предупреждение", kick: "Кикнуть", delete: "Удалить", role: "Изменить роль",
  };
  return m[type] || type;
}

function modalIconBg(type: ActionModal["type"]): string {
  const m: Record<string, string> = {
    ban: "text-red-400 bg-red-500/10", unban: "text-green-400 bg-green-500/10",
    mute: "text-orange-400 bg-orange-500/10", unmute: "text-green-400 bg-green-500/10",
    warn: "text-yellow-400 bg-yellow-500/10", kick: "text-blue-400 bg-blue-500/10",
    delete: "text-red-500 bg-red-600/10", role: "text-yellow-400 bg-yellow-500/10",
  };
  return m[type] || "text-muted-foreground bg-secondary";
}

function modalBtnColor(type: ActionModal["type"]): string {
  if (["ban", "delete"].includes(type)) return "bg-red-600 hover:bg-red-500";
  if (["mute", "kick"].includes(type)) return "bg-orange-600 hover:bg-orange-500";
  if (type === "warn") return "bg-yellow-600 hover:bg-yellow-500";
  if (["unban", "unmute"].includes(type)) return "bg-green-600 hover:bg-green-500";
  return "grad-primary";
}
