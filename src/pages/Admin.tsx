import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

interface User { id: number; username: string; role: string; rank: string; avatar: string; }
interface Member { id: number; username: string; role: string; rank: string; avatar: string; reputation: number; created_at: string; }

const AUTH_URL = "https://functions.poehali.dev/99f13565-043d-4a37-a932-d20977116e70";

type Tab = "users" | "stats";

export default function Admin() {
  const navigate = useNavigate();
  const [user] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem("nexus_user") || "null"); } catch { return null; }
  });
  const [tab, setTab] = useState<Tab>("users");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchUsers();
  }, []);

  const token = () => localStorage.getItem("nexus_token") || "";

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}?action=admin_users`, {
        headers: { "X-Session-Token": token() },
      });
      const data = await res.json();
      if (data.users) setMembers(data.users);
    } finally {
      setLoading(false);
    }
  };

  const setRole = async (userId: number, role: string) => {
    const res = await fetch(`${AUTH_URL}?action=admin_set_role`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Token": token() },
      body: JSON.stringify({ user_id: userId, role }),
    });
    const data = await res.json();
    if (data.ok) {
      setActionMsg(`Роль обновлена`);
      fetchUsers();
      setTimeout(() => setActionMsg(""), 2000);
    }
  };

  const deleteUser = async (userId: number, username: string) => {
    if (!confirm(`Удалить пользователя ${username}?`)) return;
    const res = await fetch(`${AUTH_URL}?action=admin_delete_user`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Token": token() },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    if (data.ok) {
      setActionMsg(`Пользователь удалён`);
      fetchUsers();
      setTimeout(() => setActionMsg(""), 2000);
    }
  };

  if (!user || user.role !== "admin") return null;

  const stats = {
    total: members.length,
    admins: members.filter(m => m.role === "admin").length,
    members: members.filter(m => m.role === "member").length,
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-yellow-600/8 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-700/8 blur-[100px]" />
        <div className="scanline absolute inset-0 opacity-30" />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-neon-cyan transition-colors text-sm font-rubik">
              <Icon name="ArrowLeft" size={16} />
              На форум
            </button>
            <span className="text-border">|</span>
            <div className="w-7 h-7 bg-yellow-500/20 border border-yellow-500/40 rounded-lg flex items-center justify-center">
              <Icon name="Shield" size={14} className="text-yellow-400" />
            </div>
            <span className="font-rajdhani font-bold text-xl text-yellow-400">АДМИН-ПАНЕЛЬ</span>
          </div>
          <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-3 py-1.5">
            <span className="text-lg">{user.avatar}</span>
            <span className="text-foreground text-xs font-rubik font-medium">{user.username}</span>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Action message */}
        {actionMsg && (
          <div className="mb-4 flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-neon-green text-sm font-rubik animate-fade-in">
            <Icon name="CheckCircle" size={16} />
            {actionMsg}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Всего участников", value: stats.total, icon: "Users", color: "text-neon-cyan" },
            { label: "Администраторов", value: stats.admins, icon: "Shield", color: "text-yellow-400" },
            { label: "Обычных юзеров", value: stats.members, icon: "User", color: "text-neon-purple" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-5 text-center">
              <div className={`flex justify-center mb-2 ${s.color}`}>
                <Icon name={s.icon as unknown as string} size={24} />
              </div>
              <div className={`font-rajdhani font-bold text-4xl ${s.color}`}>{s.value}</div>
              <div className="text-muted-foreground text-xs font-rubik mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {([["users", "Пользователи", "Users"], ["stats", "О панели", "BarChart2"]] as [Tab, string, string][]).map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-rubik text-sm transition-all
                ${tab === id ? "grad-primary text-white border-transparent glow-purple" : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"}`}
            >
              <Icon name={icon as unknown as string} size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {tab === "users" && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-rajdhani font-bold text-xl text-foreground flex items-center gap-2">
                <Icon name="Users" size={18} className="text-neon-cyan" />
                Список пользователей
              </h2>
              <button onClick={fetchUsers} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary/50">
                <Icon name="RefreshCw" size={16} />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground font-rubik gap-2">
                <Icon name="Loader" size={18} className="animate-spin" />
                Загрузка...
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground font-rubik gap-2">
                <Icon name="UserX" size={32} className="opacity-30" />
                <p>Нет зарегистрированных пользователей</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {members.map(m => (
                  <div key={m.id} className="flex items-center justify-between px-5 py-4 hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                        {m.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-rubik font-medium text-sm">{m.username}</span>
                          {m.role === "admin" && (
                            <span className="text-xs font-rubik text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Icon name="Shield" size={10} />
                              Админ
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs font-rubik mt-0.5">
                          {m.rank} · ID {m.id} · {new Date(m.created_at).toLocaleDateString("ru")}
                        </div>
                      </div>
                    </div>
                    {m.username !== "admin" && (
                      <div className="flex items-center gap-2">
                        {m.role === "member" ? (
                          <button
                            onClick={() => setRole(m.id, "admin")}
                            className="text-xs font-rubik text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg hover:bg-yellow-500/20 transition-all flex items-center gap-1"
                          >
                            <Icon name="ShieldPlus" size={12} />
                            Сделать админом
                          </button>
                        ) : (
                          <button
                            onClick={() => setRole(m.id, "member")}
                            className="text-xs font-rubik text-muted-foreground bg-secondary/50 border border-border px-3 py-1.5 rounded-lg hover:text-foreground transition-all flex items-center gap-1"
                          >
                            <Icon name="ShieldMinus" size={12} />
                            Снять права
                          </button>
                        )}
                        <button
                          onClick={() => deleteUser(m.id, m.username)}
                          className="text-xs font-rubik text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-all flex items-center gap-1"
                        >
                          <Icon name="Trash2" size={12} />
                          Удалить
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info tab */}
        {tab === "stats" && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">👑</div>
            <h2 className="font-rajdhani font-bold text-2xl text-foreground mb-2">Панель администратора</h2>
            <p className="text-muted-foreground font-rubik mb-6 max-w-md mx-auto">
              Здесь ты управляешь форумом. По мере развития сайта появятся: управление темами, разделами, банами и настройки форума.
            </p>
            <div className="flex flex-wrap gap-3 justify-center text-sm font-rubik text-muted-foreground">
              {["Управление пользователями ✅", "Управление темами 🔜", "Управление разделами 🔜", "Баны 🔜", "Настройки форума 🔜"].map(f => (
                <span key={f} className="bg-secondary/50 border border-border px-3 py-1.5 rounded-lg">{f}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
