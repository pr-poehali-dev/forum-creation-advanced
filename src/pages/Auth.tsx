import { useState } from "react";
import Icon from "@/components/ui/icon";

type Mode = "login" | "register";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden px-4">

      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-purple-700/12 blur-[120px]" />
        <div className="absolute bottom-0 -right-32 w-[400px] h-[400px] rounded-full bg-cyan-600/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-green-600/5 blur-[100px]" />
        <div className="scanline absolute inset-0 opacity-40" />
        {/* Grid pattern */}
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

      {/* Logo top center */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        <div className="w-8 h-8 grad-primary rounded-lg flex items-center justify-center glow-purple">
          <Icon name="Zap" size={16} className="text-white" />
        </div>
        <span className="font-rajdhani font-bold text-xl tracking-widest grad-text">NEXUS</span>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Glow border effect */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-purple-500/40 via-transparent to-cyan-500/30 pointer-events-none" />

        <div className="relative bg-card border border-border rounded-2xl p-8">

          {/* Tab switcher */}
          <div className="flex bg-secondary/50 rounded-xl p-1 mb-8">
            {(["login", "register"] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
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
          <form className="flex flex-col gap-4" onSubmit={e => e.preventDefault()}>

            {mode === "register" && (
              <div>
                <label className="text-xs font-rubik font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Никнейм
                </label>
                <div className="relative">
                  <Icon name="User" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="ProGamer_777"
                    value={form.username}
                    onChange={set("username")}
                    className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-rubik text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/60 focus:bg-secondary/80 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-rubik font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                {mode === "login" ? "Никнейм или Email" : "Email"}
              </label>
              <div className="relative">
                <Icon name="Mail" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  placeholder="gamer@nexus.gg"
                  value={form.email}
                  onChange={set("email")}
                  className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-rubik text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/60 focus:bg-secondary/80 transition-all"
                />
              </div>
            </div>

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

            {mode === "register" && (
              <div>
                <label className="text-xs font-rubik font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Подтвердить пароль
                </label>
                <div className="relative">
                  <Icon name="ShieldCheck" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    className="w-full bg-secondary/50 border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-rubik text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/60 focus:bg-secondary/80 transition-all"
                  />
                </div>
              </div>
            )}

            {mode === "login" && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="w-4 h-4 bg-secondary border border-border rounded flex items-center justify-center">
                    <Icon name="Check" size={10} className="text-neon-green" />
                  </div>
                  <span className="text-muted-foreground text-xs font-rubik">Запомнить меня</span>
                </label>
                <button type="button" className="text-neon-purple text-xs font-rubik hover:text-purple-400 transition-colors">
                  Забыл пароль?
                </button>
              </div>
            )}

            {mode === "register" && (
              <p className="text-muted-foreground text-xs font-rubik leading-relaxed">
                Регистрируясь, ты принимаешь{" "}
                <button type="button" className="text-neon-purple hover:text-purple-400 transition-colors">правила форума</button>
                {" "}и{" "}
                <button type="button" className="text-neon-purple hover:text-purple-400 transition-colors">политику конфиденциальности</button>
              </p>
            )}

            <button
              type="submit"
              className="w-full grad-primary text-white font-rajdhani font-bold text-lg py-3 rounded-xl glow-purple hover:opacity-90 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 mt-2"
            >
              {mode === "login" ? (
                <><Icon name="LogIn" size={18} /> ВОЙТИ</>
              ) : (
                <><Icon name="Rocket" size={18} /> СОЗДАТЬ АККАУНТ</>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-xs font-rubik">или войди через</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social */}
          <div className="flex gap-3">
            {[
              { label: "Steam", icon: "Gamepad2", color: "hover:border-blue-500/50 hover:text-blue-400" },
              { label: "Discord", icon: "MessageCircle", color: "hover:border-indigo-500/50 hover:text-indigo-400" },
              { label: "VK", icon: "Users", color: "hover:border-cyan-500/50 hover:text-neon-cyan" },
            ].map(s => (
              <button
                key={s.label}
                className={`flex-1 flex items-center justify-center gap-2 bg-secondary/30 border border-border rounded-xl py-2.5 text-muted-foreground text-xs font-rubik transition-all ${s.color}`}
              >
                <Icon name={s.icon as unknown as string} size={14} />
                {s.label}
              </button>
            ))}
          </div>

          {/* Switch mode */}
          <p className="text-center text-muted-foreground text-sm font-rubik mt-6">
            {mode === "login" ? "Ещё нет аккаунта?" : "Уже есть аккаунт?"}
            {" "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-neon-purple hover:text-purple-400 font-medium transition-colors"
            >
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </button>
          </p>
        </div>

        {/* Rank badges decorative */}
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
