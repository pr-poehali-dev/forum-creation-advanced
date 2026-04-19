import { useState } from "react";
import Icon from "@/components/ui/icon";

const CATEGORIES = [
  { id: "all", label: "Все темы", icon: "LayoutGrid" },
  { id: "games", label: "Игры", icon: "Gamepad2" },
  { id: "team", label: "Набор команды", icon: "Users" },
  { id: "hardware", label: "Железо", icon: "Cpu" },
  { id: "clips", label: "Клипы", icon: "Play" },
  { id: "market", label: "Барахолка", icon: "ShoppingBag" },
];

const TOPICS = [
  {
    id: 1,
    category: "games",
    categoryLabel: "Игры",
    categoryColor: "text-neon-purple",
    categoryBg: "bg-purple-500/10 border-purple-500/30",
    title: "CS2 Major 2025 — лучшая команда турнира по версии форума",
    preview: "Голосуем за MVP Major'а! Кто из игроков реально заслуживает звания лучшего?",
    author: "ShadowSniper_88",
    authorRank: "Легенда",
    rankColor: "text-neon-purple",
    avatar: "🎯",
    time: "5 мин назад",
    views: 4821,
    replies: 247,
    likes: 1203,
    hot: true,
    tags: ["CS2", "Major", "Голосование"],
  },
  {
    id: 2,
    category: "team",
    categoryLabel: "Набор команды",
    categoryColor: "text-neon-green",
    categoryBg: "bg-green-500/10 border-green-500/30",
    title: "Ищу 2-х в команду Valorant — рейтинг Diamond+",
    preview: "Серьёзная команда, играем каждый день с 20:00. Нужны: Duelist и Controller.",
    author: "XenonRifle",
    authorRank: "Pro",
    rankColor: "text-neon-cyan",
    avatar: "⚡",
    time: "23 мин назад",
    views: 891,
    replies: 63,
    likes: 45,
    hot: false,
    tags: ["Valorant", "Diamond", "LFG"],
  },
  {
    id: 3,
    category: "hardware",
    categoryLabel: "Железо",
    categoryColor: "text-neon-cyan",
    categoryBg: "bg-cyan-500/10 border-cyan-500/30",
    title: "RTX 5090 vs RTX 4090 — реальный прирост или маркетинг?",
    preview: "Протестировал обе карты в 12 играх. Результаты удивили даже меня — делюсь бенчами.",
    author: "TechOverlord",
    authorRank: "Эксперт",
    rankColor: "text-yellow-400",
    avatar: "🖥️",
    time: "1 час назад",
    views: 12403,
    replies: 589,
    likes: 3871,
    hot: true,
    tags: ["GPU", "Benchmark", "RTX 5090"],
  },
  {
    id: 4,
    category: "clips",
    categoryLabel: "Клипы",
    categoryColor: "text-neon-pink",
    categoryBg: "bg-pink-500/10 border-pink-500/30",
    title: "Ace через дым — слепой пятак на MIRAGE в ranked",
    preview: "Не верил сам пока не смонтировал. Противники явно не ожидали такого подхода.",
    author: "BlindFrag_Pro",
    authorRank: "Ветеран",
    rankColor: "text-orange-400",
    avatar: "🎬",
    time: "2 часа назад",
    views: 7234,
    replies: 134,
    likes: 2890,
    hot: false,
    tags: ["CS2", "Ace", "Highlight"],
  },
  {
    id: 5,
    category: "market",
    categoryLabel: "Барахолка",
    categoryColor: "text-yellow-400",
    categoryBg: "bg-yellow-500/10 border-yellow-500/30",
    title: "Продам скины CS2 — StatTrak AK-47 Redline MW",
    preview: "Срочно продаю коллекцию. Цены ниже торговой площадки. Оплата через Steam или карту.",
    author: "TradeKing_RU",
    authorRank: "Участник",
    rankColor: "text-gray-400",
    avatar: "💰",
    time: "3 часа назад",
    views: 2109,
    replies: 28,
    likes: 12,
    hot: false,
    tags: ["Продажа", "Скины", "AK-47"],
  },
  {
    id: 6,
    category: "games",
    categoryLabel: "Игры",
    categoryColor: "text-neon-purple",
    categoryBg: "bg-purple-500/10 border-purple-500/30",
    title: "GTA VI дата выхода подтверждена — обсуждаем детали",
    preview: "Rockstar наконец анонсировали точную дату. Что думаете о показанном геймплее?",
    author: "ViceCity_Fan",
    authorRank: "Старожил",
    rankColor: "text-neon-purple",
    avatar: "🚗",
    time: "4 часа назад",
    views: 19870,
    replies: 1047,
    likes: 5623,
    hot: true,
    tags: ["GTA VI", "Rockstar", "Анонс"],
  },
];

const TOP_PLAYERS = [
  { name: "ShadowSniper_88", score: 48920, rank: "Легенда", avatar: "🎯", rankColor: "text-neon-purple" },
  { name: "TechOverlord", score: 41200, rank: "Эксперт", avatar: "🖥️", rankColor: "text-yellow-400" },
  { name: "XenonRifle", score: 38750, rank: "Pro", avatar: "⚡", rankColor: "text-neon-cyan" },
  { name: "BlindFrag_Pro", score: 29300, rank: "Ветеран", avatar: "🎬", rankColor: "text-orange-400" },
  { name: "ViceCity_Fan", score: 24100, rank: "Старожил", avatar: "🚗", rankColor: "text-neon-purple" },
];

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return n.toString();
}

export default function Index() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [likedTopics, setLikedTopics] = useState<Set<number>>(new Set());

  const filtered = activeCategory === "all"
    ? TOPICS
    : TOPICS.filter(t => t.category === activeCategory);

  const toggleLike = (id: number) => {
    setLikedTopics(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">

      {/* Background ambient blobs */}
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
            <span className="font-rajdhani font-bold text-2xl tracking-widest grad-text">
              NEXUS
            </span>
            <span className="hidden sm:block text-muted-foreground text-xs font-rubik tracking-wider mt-1">
              FORUM
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {["Форум", "Рейтинг", "Турниры", "Маркет"].map(link => (
              <button key={link} className="text-muted-foreground hover:text-foreground text-sm font-rubik transition-colors hover:text-neon-cyan">
                {link}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-3 py-1.5">
              <Icon name="Search" size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground text-sm font-rubik">Поиск...</span>
            </div>
            <button className="relative p-2 rounded-lg hover:bg-secondary/50 transition-colors">
              <Icon name="Bell" size={18} className="text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-neon-purple rounded-full" />
            </button>
            <button className="grad-primary text-white text-sm font-rubik font-medium px-4 py-2 rounded-lg hover:opacity-90 transition-opacity glow-purple">
              Войти
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative z-10 pt-12 pb-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1 animate-slide-up">
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-1.5 mb-6">
                <span className="online-dot text-neon-green text-xs font-rubik font-medium">
                  14 892 геймера онлайн
                </span>
              </div>
              <h1 className="font-rajdhani font-bold text-5xl sm:text-6xl lg:text-7xl leading-none mb-4">
                <span className="grad-text">ГЛАВНЫЙ</span>
                <br />
                <span className="text-foreground">ФОРУМ</span>
                <br />
                <span className="grad-text-green">ГЕЙМЕРОВ</span>
              </h1>
              <p className="text-muted-foreground font-rubik text-lg max-w-md mb-8 leading-relaxed">
                Обсуждай игры, находи тиммейтов, делись клипами и прокачивай репутацию в сообществе
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="grad-primary text-white font-rubik font-semibold px-6 py-3 rounded-xl glow-purple hover:opacity-90 transition-all hover:scale-105 flex items-center gap-2">
                  <Icon name="Plus" size={18} />
                  Создать тему
                </button>
                <button className="border border-border bg-secondary/30 hover:bg-secondary/60 text-foreground font-rubik font-medium px-6 py-3 rounded-xl transition-all flex items-center gap-2">
                  <Icon name="Compass" size={18} className="text-neon-cyan" />
                  Обзор разделов
                </button>
              </div>
            </div>

            <div className="flex-shrink-0 grid grid-cols-2 gap-3 animate-slide-up-delay-2">
              {[
                { label: "Участников", value: "248K", icon: "Users", color: "text-neon-purple" },
                { label: "Тем", value: "1.2M", icon: "MessageSquare", color: "text-neon-cyan" },
                { label: "Сообщений", value: "18.7M", icon: "MessagesSquare", color: "text-neon-green" },
                { label: "Онлайн", value: "14.9K", icon: "Wifi", color: "text-neon-pink" },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="bg-card border border-border rounded-2xl p-5 card-hover text-center min-w-[120px]"
                >
                  <div className={`mb-2 flex justify-center ${stat.color}`}>
                    <Icon name={stat.icon as unknown as string} size={24} />
                  </div>
                  <div className={`font-rajdhani font-bold text-3xl ${stat.color}`}>{stat.value}</div>
                  <div className="text-muted-foreground text-xs font-rubik mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="relative z-10 px-4 sm:px-6 pb-16">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6">

          {/* TOPICS COLUMN */}
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-rubik text-sm whitespace-nowrap transition-all flex-shrink-0
                    ${activeCategory === cat.id
                      ? "grad-primary text-white border-transparent glow-purple"
                      : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground hover:border-purple-500/40"
                    }`}
                >
                  <Icon name={cat.icon as unknown as string} size={14} />
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="font-rajdhani font-bold text-xl text-foreground flex items-center gap-2">
                <Icon name="Flame" size={20} className="text-orange-400" />
                {activeCategory === "all" ? "Горячие темы" : CATEGORIES.find(c => c.id === activeCategory)?.label}
              </h2>
              <button className="text-muted-foreground text-sm font-rubik hover:text-neon-cyan transition-colors flex items-center gap-1">
                Все темы <Icon name="ChevronRight" size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {filtered.map((topic, i) => (
                <div
                  key={topic.id}
                  className="bg-card border border-border rounded-2xl p-5 card-hover cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                        {topic.avatar}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-foreground font-rubik font-medium text-sm">{topic.author}</span>
                          <span className={`text-xs font-rubik font-semibold ${topic.rankColor}`}>{topic.authorRank}</span>
                          <span className="text-muted-foreground text-xs">{topic.time}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-rubik font-medium px-2 py-0.5 rounded-md border ${topic.categoryBg} ${topic.categoryColor}`}>
                            {topic.categoryLabel}
                          </span>
                          {topic.hot && (
                            <span className="inline-flex items-center gap-1 text-xs font-rubik text-orange-400 bg-orange-400/10 border border-orange-400/30 px-2 py-0.5 rounded-md">
                              <Icon name="Flame" size={10} />
                              ХОТ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-rajdhani font-bold text-lg text-foreground mb-1 leading-snug">
                    {topic.title}
                  </h3>
                  <p className="text-muted-foreground text-sm font-rubik mb-3 leading-relaxed line-clamp-2">
                    {topic.preview}
                  </p>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {topic.tags.map(tag => (
                      <span key={tag} className="text-xs font-rubik text-muted-foreground bg-secondary/50 px-2 py-1 rounded-lg">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-muted-foreground text-sm font-rubik">
                      <span className="flex items-center gap-1.5">
                        <Icon name="Eye" size={14} />
                        {formatNumber(topic.views)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="MessageCircle" size={14} />
                        {topic.replies}
                      </span>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); toggleLike(topic.id); }}
                      className={`flex items-center gap-1.5 text-sm font-rubik px-3 py-1.5 rounded-lg border transition-all
                        ${likedTopics.has(topic.id)
                          ? "text-neon-green border-green-500/40 bg-green-500/10"
                          : "text-muted-foreground border-border hover:border-green-500/30 hover:text-neon-green"
                        }`}
                    >
                      <Icon name="Heart" size={14} />
                      {formatNumber(topic.likes + (likedTopics.has(topic.id) ? 1 : 0))}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="lg:w-72 flex-shrink-0 flex flex-col gap-4">

            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-rajdhani font-bold text-lg mb-4 flex items-center gap-2">
                <Icon name="Activity" size={18} className="text-neon-green" />
                Сейчас онлайн
              </h3>
              <div className="flex flex-col gap-1 text-sm font-rubik">
                {["ShadowSniper_88", "XenonRifle", "TechOverlord", "BlindFrag_Pro", "NightWolf_99", "CyberByte_X"].map((user) => (
                  <div key={user} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-foreground">{user}</span>
                    <span className="w-2 h-2 rounded-full bg-neon-green animate-glow-pulse" style={{ boxShadow: '0 0 6px #00ff80' }} />
                  </div>
                ))}
                <p className="text-muted-foreground text-xs mt-2 text-center">
                  и ещё 14 886 участников
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-rajdhani font-bold text-lg mb-4 flex items-center gap-2">
                <Icon name="Trophy" size={18} className="text-yellow-400" />
                Топ участников
              </h3>
              <div className="flex flex-col gap-3">
                {TOP_PLAYERS.map((player, i) => (
                  <div key={player.name} className="flex items-center gap-3">
                    <span className={`font-rajdhani font-bold text-lg w-5 text-center flex-shrink-0
                      ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                      {player.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground text-sm font-rubik font-medium truncate">{player.name}</div>
                      <div className={`text-xs font-rubik ${player.rankColor}`}>{player.rank}</div>
                    </div>
                    <div className="text-muted-foreground text-xs font-rubik">{formatNumber(player.score)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden bg-card border border-purple-500/30 rounded-2xl p-5 glow-purple">
              <div className="absolute inset-0 grad-primary opacity-10" />
              <div className="relative z-10">
                <h3 className="font-rajdhani font-bold text-xl mb-2 text-foreground">Есть что сказать?</h3>
                <p className="text-muted-foreground text-sm font-rubik mb-4">Создай новую тему и запусти обсуждение в сообществе</p>
                <button className="w-full grad-primary text-white font-rubik font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <Icon name="PenSquare" size={16} />
                  Написать
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-rajdhani font-bold text-lg mb-4 flex items-center gap-2">
                <Icon name="Hash" size={18} className="text-neon-cyan" />
                Популярные теги
              </h3>
              <div className="flex flex-wrap gap-2">
                {["CS2", "Valorant", "GTA VI", "RTX 5090", "LFG", "Сезон 8", "Pro-League", "Clips", "Patch 14.3", "AMD"].map(tag => (
                  <button key={tag} className="text-xs font-rubik text-muted-foreground bg-secondary/50 hover:text-neon-cyan hover:bg-cyan-500/10 hover:border-cyan-500/30 border border-border px-2.5 py-1 rounded-lg transition-all">
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-border/50 bg-background/50 backdrop-blur-sm py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 grad-primary rounded-md flex items-center justify-center">
              <Icon name="Zap" size={14} className="text-white" />
            </div>
            <span className="font-rajdhani font-bold text-lg grad-text">NEXUS FORUM</span>
          </div>
          <div className="flex items-center gap-6 text-muted-foreground text-sm font-rubik">
            {["Правила", "Поддержка", "Реклама", "Контакты"].map(link => (
              <button key={link} className="hover:text-foreground transition-colors">{link}</button>
            ))}
          </div>
          <p className="text-muted-foreground text-xs font-rubik">© 2025 NEXUS Forum</p>
        </div>
      </footer>
    </div>
  );
}