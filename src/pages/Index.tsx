import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/99f13565-043d-4a37-a932-d20977116e70";

interface User { id: number; username: string; role: string; rank: string; avatar: string; }

export default function Index() {
  const navigate = useNavigate();
  const [user] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem("nexus_user") || "null"); } catch { return null; }
  });
  const [maintenance, setMaintenance] = useState<{ is_active: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch(`${AUTH_URL}?action=maintenance`)
      .then(r => r.json())
      .then(d => setMaintenance(d))
      .catch(() => null);
  }, []);

  const logout = () => {
    localStorage.removeItem("nexus_token");
    localStorage.removeItem("nexus_user");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">

      {/* Maintenance banner */}
      {maintenance?.is_active && user?.role !== "admin" && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-background/95 backdrop-blur-xl">
          <div className="text-center max-w-md px-6">
            <div className="text-6xl mb-6">🔧</div>
            <h1 className="font-rajdhani font-bold text-4xl text-orange-400 mb-3">ТЕХРАБОТЫ</h1>
            <p className="text-muted-foreground font-rubik text-lg mb-6">{maintenance.message}</p>
            <div className="flex items-center justify-center gap-2 text-orange-400 text-sm font-rubik">
              <Icon name="Loader" size={16} className="animate-spin" />
              Скоро вернёмся...
            </div>
          </div>
        </div>
      )}

      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-purple-700/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-cyan-600/8 blur-[100px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-green-600/6 blur-[100px]" />
        <div className="scanline absolute inset-0 opacity-50" />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 grad-primary rounded-lg flex items-center justify-center glow-purple">
              <Icon name="Zap" size={18} className="text-white" />
            </div>
            <span className="font-rajdhani font-bold text-2xl tracking-widest grad-text">NEXUS</span>
            <span className="hidden sm:block text-muted-foreground text-xs font-rubik tracking-wider mt-1">FORUM</span>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === "admin" && (
              <button
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 text-sm font-rubik font-medium px-3 py-1.5 rounded-lg hover:bg-yellow-500/20 transition-all"
              >
                <Icon name="Shield" size={14} />
                Админ
              </button>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-3 py-1.5">
                  <span className="text-lg">{user.avatar}</span>
                  <div>
                    <div className="text-foreground text-xs font-rubik font-medium leading-none">{user.username}</div>
                    <div className="text-neon-purple text-xs font-rubik leading-none mt-0.5">{user.rank}</div>
                  </div>
                </div>
                <button onClick={logout} className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-red-400">
                  <Icon name="LogOut" size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/auth")}
                className="grad-primary text-white text-sm font-rubik font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity glow-purple"
              >
                Войти
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 pt-16 pb-12 px-4 sm:px-6 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="animate-slide-up max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-1.5 mb-8">
            <span className="online-dot text-neon-green text-xs font-rubik font-medium">Форум запущен</span>
          </div>
          <h1 className="font-rajdhani font-bold text-6xl sm:text-7xl lg:text-8xl leading-none mb-6">
            <span className="grad-text">NEXUS</span>
            <br />
            <span className="text-foreground">FORUM</span>
          </h1>
          <p className="text-muted-foreground font-rubik text-xl max-w-lg mx-auto mb-10 leading-relaxed">
            Геймерское сообщество. Разделы и темы скоро появятся — следи за обновлениями.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {user ? (
              <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-6 py-4">
                <span className="text-3xl">{user.avatar}</span>
                <div className="text-left">
                  <div className="text-foreground font-rajdhani font-bold text-lg">{user.username}</div>
                  <div className="text-neon-purple text-sm font-rubik">{user.rank}</div>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate("/auth")}
                  className="grad-primary text-white font-rubik font-semibold px-8 py-3 rounded-xl glow-purple hover:opacity-90 transition-all hover:scale-105 flex items-center gap-2"
                >
                  <Icon name="Rocket" size={18} />
                  Присоединиться
                </button>
                <button
                  onClick={() => navigate("/auth")}
                  className="border border-border bg-secondary/30 hover:bg-secondary/60 text-foreground font-rubik font-medium px-8 py-3 rounded-xl transition-all flex items-center gap-2"
                >
                  <Icon name="LogIn" size={18} className="text-neon-cyan" />
                  Войти
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* COMING SOON */}
      <section className="relative z-10 px-4 sm:px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: "MessageSquare", label: "Разделы форума", desc: "Создаются администратором", color: "text-neon-purple" },
              { icon: "Users", label: "Участники", desc: "Регистрируйся прямо сейчас", color: "text-neon-cyan" },
              { icon: "Trophy", label: "Рейтинг", desc: "Скоро появится", color: "text-yellow-400" },
            ].map(item => (
              <div key={item.label} className="bg-card border border-border rounded-2xl p-6 text-center card-hover">
                <div className={`flex justify-center mb-3 ${item.color}`}>
                  <Icon name={item.icon as unknown as string} size={32} />
                </div>
                <div className="font-rajdhani font-bold text-lg text-foreground mb-1">{item.label}</div>
                <div className="text-muted-foreground text-sm font-rubik">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-border/50 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 grad-primary rounded-md flex items-center justify-center">
              <Icon name="Zap" size={14} className="text-white" />
            </div>
            <span className="font-rajdhani font-bold text-lg grad-text">NEXUS FORUM</span>
          </div>
          <p className="text-muted-foreground text-xs font-rubik">© 2025 NEXUS Forum</p>
        </div>
      </footer>
    </div>
  );
}