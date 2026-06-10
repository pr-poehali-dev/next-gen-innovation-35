import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  Hash,
  Users,
  Mic,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Send,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const AUTH_URL = "https://functions.poehali.dev/2d6e8302-2db4-4ea2-8b80-095c945a36bc";
const MSG_URL = "https://functions.poehali.dev/6706baf9-02f3-40a1-b747-e26deac2f64a";

type User = { id: number; username: string; avatar: string };
type Message = { id: number; text: string; created_at: string; username: string; avatar: string };
type Channel = { id: number; name: string; type: string };

// ─── Auth Modal ───────────────────────────────────────────────────────────────
const AuthModal = ({ onAuth }: { onAuth: (user: User, token: string) => void }) => {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newUser, setNewUser] = useState<User | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: Record<string, string> = mode === "register"
        ? { action: "register", username: form.username, email: form.email, password: form.password, avatar: "🦉" }
        : { action: "login", username: form.username, password: form.password };

      const res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка"); return; }

      if (mode === "register") {
        setNewUser(data.user);
        setSuccess(true);
        setTimeout(() => onAuth(data.user, data.token), 2000);
      } else {
        onAuth(data.user, data.token);
      }
    } catch {
      setError("Ошибка сети — попробуй ещё раз");
    } finally {
      setLoading(false);
    }
  };

  if (success && newUser) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-[#36393f] rounded-xl w-full max-w-md border border-[#202225] shadow-2xl p-8 text-center">
          <div className="text-6xl mb-4 animate-bounce">🦉</div>
          <h2 className="text-white text-2xl font-bold mb-2">Добро пожаловать, {newUser.username}!</h2>
          <p className="text-[#b9bbbe] text-sm mb-1">Ты теперь настоящая Бобинь</p>
          <p className="text-[#7c3aed] text-xs italic">by nezdoroviy</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#36393f] rounded-xl w-full max-w-md border border-[#202225] shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#7c3aed] to-[#5865f2] p-6 text-center">
          <div className="text-5xl mb-2">🦉</div>
          <h2 className="text-white text-2xl font-bold">
            {mode === "register" ? "Стать Бобинью" : "Войти в Бобинь"}
          </h2>
          <p className="text-purple-200 text-xs mt-1 italic">by nezdoroviy</p>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide block mb-1">
              {mode === "register" ? "Имя Бобини" : "Логин или почта"}
            </label>
            <input
              type="text"
              placeholder={mode === "register" ? "боб_сова_1337" : "твой логин"}
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              className="w-full bg-[#202225] text-white rounded px-3 py-2 text-sm border border-[#40444b] focus:border-[#5865f2] focus:outline-none placeholder-[#72767d]"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide block mb-1">
                Почта Бобини
              </label>
              <input
                type="email"
                placeholder="bob@sovamail.ru"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full bg-[#202225] text-white rounded px-3 py-2 text-sm border border-[#40444b] focus:border-[#5865f2] focus:outline-none placeholder-[#72767d]"
              />
            </div>
          )}

          <div>
            <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide block mb-1">
              Пароль
            </label>
            <input
              type="password"
              placeholder="минимум 8 бобей"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
              className="w-full bg-[#202225] text-white rounded px-3 py-2 text-sm border border-[#40444b] focus:border-[#5865f2] focus:outline-none placeholder-[#72767d]"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white py-2 rounded font-medium disabled:opacity-50"
          >
            {loading ? "Бобим..." : mode === "register" ? "Зарегистрироваться 🦉" : "Войти 🦉"}
          </Button>

          <button
            type="button"
            onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}
            className="w-full text-[#b9bbbe] hover:text-white text-sm text-center transition-colors"
          >
            {mode === "register" ? "Уже бобинь? Войти" : "Ещё не боб? Зарегистрироваться"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");
  const [showAuth, setShowAuth] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeChannelRef = useRef<Channel | null>(null);

  useEffect(() => {
    activeChannelRef.current = activeChannel;
  }, [activeChannel]);

  // Restore session
  useEffect(() => {
    const savedToken = localStorage.getItem("bobyn_token");
    const savedUser = localStorage.getItem("bobyn_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Load channels on mount
  useEffect(() => {
    fetch(`${MSG_URL}?channel_id=1`)
      .then((r) => r.json())
      .then((data) => {
        if (data.channels?.length) {
          setChannels(data.channels);
          setActiveChannel(data.channels[0]);
        }
      })
      .catch(() => {});
  }, []);

  // Poll messages
  useEffect(() => {
    if (!activeChannel) return;
    loadMessages(activeChannel.id);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (activeChannelRef.current) loadMessages(activeChannelRef.current.id);
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChannel?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async (channelId: number) => {
    try {
      const res = await fetch(`${MSG_URL}?channel_id=${channelId}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (err) {
      console.error("load messages error", err);
    }
  };

  const handleAuth = (u: User, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem("bobyn_token", t);
    localStorage.setItem("bobyn_user", JSON.stringify(u));
    setShowAuth(false);
  };

  const handleLogout = () => {
    setUser(null);
    setToken("");
    localStorage.removeItem("bobyn_token");
    localStorage.removeItem("bobyn_user");
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !activeChannel) return;
    setSending(true);
    try {
      const res = await fetch(MSG_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ text: inputText.trim(), channel_id: activeChannel.id }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setInputText("");
      }
    } catch (err) {
      console.error("send error", err);
    }
    setSending(false);
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  return (
    <div className="min-h-screen bg-[#36393f] text-white overflow-x-hidden">
      {showAuth && <AuthModal onAuth={handleAuth} />}

      {/* Навигация */}
      <nav className="bg-[#2f3136] border-b border-[#202225] px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-xl">
              🦉
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Бобинь</h1>
              <p className="text-xs text-[#72767d]">by nezdoroviy</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 text-sm text-[#b9bbbe]">
                  <span className="text-lg">{user.avatar}</span>
                  <span className="text-white font-medium">{user.username}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]">
                  <LogOut className="w-4 h-4 mr-1" /> Выйти
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b] text-sm" onClick={() => setShowAuth(true)}>
                  Войти
                </Button>
                <Button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 py-2 rounded text-sm font-medium" onClick={() => setShowAuth(true)}>
                  Стать Бобинью 🦉
                </Button>
              </>
            )}
          </div>

          <Button variant="ghost" className="sm:hidden text-[#b9bbbe] p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden mt-3 pt-3 border-t border-[#202225] flex flex-col gap-2">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-2 text-sm text-white"><span>{user.avatar}</span><span>{user.username}</span></div>
                <Button variant="ghost" className="justify-start text-[#b9bbbe] hover:text-white" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Выйти
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="justify-start text-[#b9bbbe]" onClick={() => { setShowAuth(true); setMobileMenuOpen(false); }}>Войти</Button>
                <Button className="bg-[#7c3aed] text-white" onClick={() => { setShowAuth(true); setMobileMenuOpen(false); }}>Стать Бобинью 🦉</Button>
              </>
            )}
          </div>
        )}
      </nav>

      <div className="flex" style={{ height: "calc(100vh - 57px)" }}>
        {/* Серверная панель */}
        <div className="hidden lg:flex w-[72px] bg-[#202225] flex-col items-center py-3 gap-2 flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-2xl flex items-center justify-center text-2xl cursor-pointer">
            🦉
          </div>
          <div className="w-8 h-[2px] bg-[#36393f] rounded-full" />
          {["🐦", "🌙", "🦆", "🥚"].map((e, i) => (
            <div key={i} className="w-12 h-12 bg-[#36393f] rounded-3xl hover:rounded-xl transition-all flex items-center justify-center cursor-pointer hover:bg-[#7c3aed] text-xl">
              {e}
            </div>
          ))}
        </div>

        {/* Канальная панель */}
        <div className={`${mobileSidebarOpen ? "flex" : "hidden"} lg:flex w-full lg:w-60 bg-[#2f3136] flex-col flex-shrink-0`}>
          <div className="p-4 border-b border-[#202225] flex items-center justify-between">
            <h2 className="text-white font-semibold">Сервер Бобинь 🦉</h2>
            <Button variant="ghost" className="lg:hidden p-1 text-[#b9bbbe]" onClick={() => setMobileSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 p-2 overflow-y-auto">
            <div className="flex items-center gap-1 px-2 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-1">
              <ArrowRight className="w-3 h-3" />
              <span>Каналы бобей</span>
            </div>
            {channels.filter(c => c.type === "text").map((ch) => (
              <div
                key={ch.id}
                onClick={() => { setActiveChannel(ch); setMobileSidebarOpen(false); }}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer transition-colors ${activeChannel?.id === ch.id ? "bg-[#393c43] text-white" : "text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43]"}`}
              >
                <Hash className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">{ch.name}</span>
              </div>
            ))}

            <div className="flex items-center gap-1 px-2 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-1 mt-3">
              <ArrowRight className="w-3 h-3" />
              <span>Голосовые норы</span>
            </div>
            {["Нора Боба", "Ветка Совы"].map((ch) => (
              <div key={ch} className="flex items-center gap-1.5 px-2 py-1.5 rounded text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43] cursor-pointer">
                <Mic className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">{ch}</span>
              </div>
            ))}
          </div>

          {/* Пользователь */}
          <div className="p-2 bg-[#292b2f] flex items-center gap-2">
            {user ? (
              <>
                <div className="w-8 h-8 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-lg flex-shrink-0">
                  {user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{user.username}</div>
                  <div className="text-[#3ba55c] text-xs">онлайн</div>
                </div>
                <Button variant="ghost" size="sm" className="w-7 h-7 p-0 hover:bg-[#40444b]" onClick={handleLogout}>
                  <LogOut className="w-3.5 h-3.5 text-[#b9bbbe]" />
                </Button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} className="flex items-center gap-2 w-full hover:bg-[#40444b] rounded p-1 transition-colors">
                <div className="w-8 h-8 bg-[#40444b] rounded-full flex items-center justify-center text-lg">🦉</div>
                <div className="text-[#b9bbbe] text-xs">Войди, чтобы бобить</div>
              </button>
            )}
            <Button variant="ghost" size="sm" className="w-7 h-7 p-0 hover:bg-[#40444b] flex-shrink-0">
              <Settings className="w-3.5 h-3.5 text-[#b9bbbe]" />
            </Button>
          </div>
        </div>

        {/* Чат */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Хедер канала */}
          <div className="h-12 bg-[#36393f] border-b border-[#202225] flex items-center px-4 gap-2 flex-shrink-0">
            <Button variant="ghost" className="lg:hidden p-1 text-[#8e9297]" onClick={() => setMobileSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <Hash className="w-5 h-5 text-[#8e9297]" />
            <span className="text-white font-semibold">{activeChannel?.name || "боб-общий"}</span>
            <div className="w-px h-5 bg-[#40444b] mx-2 hidden sm:block" />
            <span className="text-[#8e9297] text-sm hidden sm:block">Бобинь — мессенджер бобов сов</span>
            <div className="ml-auto flex items-center gap-3">
              <button onClick={() => activeChannel && loadMessages(activeChannel.id)} className="text-[#b9bbbe] hover:text-white transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
              <Bell className="w-4 h-4 text-[#b9bbbe]" />
              <Users className="w-4 h-4 text-[#b9bbbe]" />
              <Search className="w-4 h-4 text-[#b9bbbe]" />
            </div>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
            <div className="text-center py-6 mb-4">
              <div className="text-5xl mb-3">🦉</div>
              <h3 className="text-white font-bold text-xl mb-1">Начало #{activeChannel?.name || "боб-общий"}</h3>
              <p className="text-[#8e9297] text-sm">Это самое начало истории этого канала бобей</p>
            </div>

            {messages.length === 0 && (
              <div className="text-center text-[#72767d] text-sm py-4">Пока тут тишина... Стань первым бобом! 🦉</div>
            )}

            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const grouped = !!prev && prev.username === msg.username &&
                (new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime()) < 300000;
              return (
                <div key={msg.id} className={`flex gap-3 ${grouped ? "mt-0.5" : "mt-4"} group hover:bg-[#32353b] rounded px-2 py-0.5 -mx-2 transition-colors`}>
                  {grouped ? (
                    <div className="w-10 flex-shrink-0 flex items-center justify-center">
                      <span className="text-[#72767d] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center flex-shrink-0 text-lg mt-0.5">
                      {msg.avatar}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {!grouped && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className={`font-medium text-sm ${msg.username === user?.username ? "text-[#7c3aed]" : "text-white"}`}>
                          {msg.username}
                        </span>
                        <span className="text-[#72767d] text-xs">{formatTime(msg.created_at)}</span>
                      </div>
                    )}
                    <div className="text-[#dcddde] text-sm break-words">{msg.text}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода */}
          <div className="p-3 sm:p-4 flex-shrink-0">
            {user ? (
              <form onSubmit={sendMessage} className="flex items-center gap-2 bg-[#40444b] rounded-lg px-4 py-2.5">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Бобить в #${activeChannel?.name || "боб-общий"}...`}
                  maxLength={2000}
                  className="flex-1 bg-transparent text-white text-sm placeholder-[#72767d] outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="text-[#b9bbbe] hover:text-white disabled:opacity-40 transition-colors flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            ) : (
              <div
                onClick={() => setShowAuth(true)}
                className="flex items-center gap-2 bg-[#40444b] rounded-lg px-4 py-3 cursor-pointer hover:bg-[#454950] transition-colors"
              >
                <span className="flex-1 text-[#72767d] text-sm">
                  Зарегистрируйся, чтобы бобить в #{activeChannel?.name || "боб-общий"}...
                </span>
                <Send className="w-4 h-4 text-[#72767d]" />
              </div>
            )}
          </div>
        </div>

        {/* Участники */}
        <div className="hidden xl:flex w-60 bg-[#2f3136] flex-col p-4 flex-shrink-0">
          <h3 className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-3">
            Бобят сейчас
          </h3>
          <div className="space-y-1 flex-1">
            {[...new Map(messages.slice(-30).reverse().map(m => [m.username, m])).values()].slice(0, 8).map((m) => (
              <div key={m.username} className="flex items-center gap-3 p-2 rounded hover:bg-[#36393f] cursor-pointer">
                <div className="w-8 h-8 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-base relative flex-shrink-0">
                  {m.avatar}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3ba55c] border-2 border-[#2f3136] rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{m.username}</div>
                  <div className="text-[#b9bbbe] text-xs">бобит</div>
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="text-[#72767d] text-xs text-center py-4">Пока тут никого 🦉</div>
            )}
          </div>
          <div className="mt-4 p-3 bg-[#36393f] rounded-lg text-center">
            <div className="text-3xl mb-1">🦉</div>
            <p className="text-white text-xs font-bold">Бобинь</p>
            <p className="text-[#72767d] text-xs italic">by nezdoroviy</p>
            {!user && (
              <Button className="mt-2 w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs py-1 rounded" onClick={() => setShowAuth(true)}>
                Вступить
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;