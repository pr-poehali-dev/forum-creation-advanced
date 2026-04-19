import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/99f13565-043d-4a37-a932-d20977116e70";

type Mode = "login" | "register";

interface User {
  id: number;
  username: string;
  role: string;
  rank: string;
  avatar: string;
}

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<User | null>(null);
  const [form, setForm] = useState({ username: "", password: "", confirmPassword: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setForm(prev => ({ ...prev, [k]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.username.trim() || !form.password) {
      setError("Заполни все поля");
      return;
    }
    if (mode === "register" && form.password !== form.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}?action=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username.trim(), password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка сервера");
        return;
      }
      localStorage.setItem("nexus_token", data.token);
      localStorage.setItem("nexus_user", JSON.stringify(data.user));
      setSuccess(data.user);
      setTimeout(() => navigate("/"), 1500);
    } catch {
      setError("Нет соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-scale-in">
          <div className="text-6xl mb-4">{success.avatar}</div>
          <h2 className="font-rajdhani font-bold text-3xl grad-text-green mb-2">ДОБРО ПОЖАЛОВАТЬ!</h2>
          <p className="text-foreground font-rubik text-lg">{success.username}</p>
          <p className="text-muted-foreground font-rubik text-sm mt-1">{success.rank}</p>
          <div className="flex items-center justify-center gap-2 mt-4 text-neon-green text-sm font-rubik">
            <Icon name="CheckCircle" size={16} />
            Переходим на форум...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden px-4">

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-purple-700/12 blur-[120px]" />
        <div className="absolute bottom-0 -right-32 w-[400px] h-[400px] rounded-full bg-cyan-600/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-green-600/5 blur-[100px]" />
        <div className="scanline absolute inset-0 opacity-40" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(147,51,234,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(147,51,234,0.5) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Back link */}
      <a
        href="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-muted-foreground hover:text-neon-cyan transition-colors text-sm font-rubik"
      >
        <Icon name="ArrowLeft" size={16} />
        На форум
      </a>

      {/* Logo */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <div className="w-8 h-8 grad-primary rounded-lg flex items-center justify-center glow-purple">
          <Icon name="Zap" size={16} className="text-white" />
        </div>
        <span className="font-rajdhani font-bold text-xl tracking-widest grad-text">NEXUS</span>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-purple-500/40 via-transparent to-cyan-500/30 pointer-events-none" />

        <div className="relative bg-card border border-border rounded-2xl p-8">

          {/* Tab switcher */}
          <div className="flex bg-secondary/50 rounded-xl p-1 mb-8">
            {(["login", "register"] as Mode[]).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-rubik font-medium transition-all
                  ${mode === m
                    ? "grad-primary text-white glow-purple"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {m === "login" ? "Войти" : "Регистрация"}
              </button>
            ))}
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="font-rajdhani font-bold text-3xl text-foreground mb-1">
              {mode === "login" ? (
                <><span className="grad-text">ДОБРО</span> ПОЖАЛОВАТЬ</>
              ) : (
                <>СОЗДАТЬ <span className="grad-text-green">АККАУНТ</span></>
              )}
            </h1>
            <p className="text-muted-foreground text-sm font-rubik">
              {mode === "login"
                ? "Войди в сообщество NEXUS"
                : "Присоединяйся к 248K геймерам"}
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>

            {/* Username */}
            <div>
              <label className="text-xs font-rubik font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Логин
              </label>
              <div className="relative">
                <Icon name="User" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="ProGamer_777"
                  value={form.username}
                  onChange={set("username")}
                  autoComplete="username"
                  className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-rubik text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/60 focus:bg-secondary/80 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-rubik font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Пароль
              </label>
              <div className="relative">
                <Icon name="Lock" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set("password")}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-12 py-3 text-sm font-rubik text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/60 focus:bg-secondary/80 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name={showPass ? "EyeOff" : "Eye"} size={16} />
                </button>
              </div>
            </div>

            {/* Confirm password (register only) */}
            {mode === "register" && (
              <div>
                <label className="text-xs font-rubik font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Повтори пароль
                </label>
                <div className="relative">
                  <Icon name="ShieldCheck" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    autoComplete="new-password"
                    className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-rubik text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/60 focus:bg-secondary/80 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm font-rubik">
                <Icon name="AlertCircle" size={16} />
                {error}
              </div>
            )}

            {/* Register hint */}
            {mode === "register" && (
              <p className="text-muted-foreground text-xs font-rubik leading-relaxed">
                Регистрируясь, ты принимаешь{" "}
                <span className="text-neon-purple">правила форума</span>
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full grad-primary text-white font-rajdhani font-bold text-lg py-3 rounded-xl glow-purple hover:opacity-90 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:scale-100 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Icon name="Loader" size={18} className="animate-spin" /> Загрузка...</>
              ) : mode === "login" ? (
                <><Icon name="LogIn" size={18} /> ВОЙТИ</>
              ) : (
                <><Icon name="Rocket" size={18} /> СОЗДАТЬ АККАУНТ</>
              )}
            </button>
          </form>

          {/* Switch mode */}
          <p className="text-center text-muted-foreground text-sm font-rubik mt-6">
            {mode === "login" ? "Ещё нет аккаунта?" : "Уже есть аккаунт?"}
            {" "}
            <button
              type="button"
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
              className="text-neon-purple hover:text-purple-400 font-medium transition-colors"
            >
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </button>
          </p>
        </div>

        {/* Rank badges */}
        <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
          {["🎯 Легенда", "⚡ Pro", "🖥️ Эксперт", "🎬 Ветеран"].map(r => (
            <span key={r} className="text-xs font-rubik text-muted-foreground bg-secondary/30 border border-border px-2.5 py-1 rounded-full">
              {r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
