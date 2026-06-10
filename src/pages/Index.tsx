import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowRight, Hash, Users, Mic, Settings, Bell,
  Search, Menu, X, Send, LogOut, RefreshCw, Phone,
  SmilePlus, AtSign, ChevronDown, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceChat } from "@/components/VoiceChat";

const AUTH_URL = "https://functions.poehali.dev/2d6e8302-2db4-4ea2-8b80-095c945a36bc";
const MSG_URL  = "https://functions.poehali.dev/6706baf9-02f3-40a1-b747-e26deac2f64a";
const VOICE_URL = "https://functions.poehali.dev/0958ddb3-2885-4c55-a299-38539aab2053";

type User    = { id: number; username: string; avatar: string };
type Message = { id: number; text: string; created_at: string; username: string; avatar: string };
type Channel = { id: number; name: string; type: string };

const VOICE_ROOMS = ["Нора Боба", "Ветка Совы", "Инкубатор"];
const BOB_EMOJIS  = ["🦉","🐦","🦆","🥚","🌙","🦅","🐣","🦚"];

// ─── Auth Modal ───────────────────────────────────────────────────────────────
const AuthModal = ({ onAuth, onClose }: { onAuth: (user: User, token: string) => void; onClose: () => void }) => {
  const [mode, setMode]   = useState<"login" | "register">("register");
  const [form, setForm]   = useState({ username: "", email: "", password: "", avatar: "🦉" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newUser, setNewUser] = useState<User | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body = mode === "register"
        ? { action: "register", ...form }
        : { action: "login", username: form.username, password: form.password };

      const res  = await fetch(AUTH_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка"); return; }

      if (mode === "register") {
        setNewUser(data.user); setSuccess(true);
        setTimeout(() => onAuth(data.user, data.token), 1800);
      } else {
        onAuth(data.user, data.token);
      }
    } catch { setError("Ошибка сети — попробуй ещё раз"); }
    finally  { setLoading(false); }
  };

  if (success && newUser) return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#36393f] rounded-2xl w-full max-w-sm border border-[#202225] p-8 text-center shadow-2xl">
        <div className="text-7xl mb-4 animate-bounce">{newUser.avatar}</div>
        <h2 className="text-white text-2xl font-bold mb-1">Вы в стае, {newUser.username}!</h2>
        <p className="text-[#b9bbbe] text-sm">Теперь ты настоящая Бобинь</p>
        <p className="text-[#7c3aed] text-xs italic mt-1">by nezdoroviy</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#36393f] rounded-2xl w-full max-w-md border border-[#202225] shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-[#7c3aed] to-[#5865f2] p-7 text-center relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-white/60 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <div className="text-5xl mb-2">{form.avatar}</div>
          <h2 className="text-white text-2xl font-bold">{mode === "register" ? "Стать Бобинью" : "Войти в Бобинь"}</h2>
          <p className="text-purple-200 text-xs mt-1 italic">Мессенджер бобов сов · by nezdoroviy</p>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{error}</div>}

          {mode === "register" && (
            <div>
              <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide block mb-2">Аватар-Бобинь</label>
              <div className="flex gap-2 flex-wrap">
                {BOB_EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setForm({...form, avatar: e})}
                    className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${form.avatar === e ? "bg-[#7c3aed] ring-2 ring-[#7c3aed] ring-offset-2 ring-offset-[#36393f]" : "bg-[#202225] hover:bg-[#40444b]"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide block mb-1">
              {mode === "register" ? "Имя Бобини" : "Логин или почта"}
            </label>
            <input type="text" placeholder={mode === "register" ? "боб_сова_1337" : "твой логин"}
              value={form.username} onChange={e => setForm({...form, username: e.target.value})} required
              className="w-full bg-[#202225] text-white rounded-lg px-3 py-2.5 text-sm border border-[#40444b] focus:border-[#5865f2] focus:outline-none placeholder-[#72767d]" />
          </div>

          {mode === "register" && (
            <div>
              <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide block mb-1">Почта</label>
              <input type="email" placeholder="bob@sovamail.ru"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
                className="w-full bg-[#202225] text-white rounded-lg px-3 py-2.5 text-sm border border-[#40444b] focus:border-[#5865f2] focus:outline-none placeholder-[#72767d]" />
            </div>
          )}

          <div>
            <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide block mb-1">Пароль</label>
            <input type="password" placeholder="минимум 8 бобей"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={8}
              className="w-full bg-[#202225] text-white rounded-lg px-3 py-2.5 text-sm border border-[#40444b] focus:border-[#5865f2] focus:outline-none placeholder-[#72767d]" />
          </div>

          <Button type="submit" disabled={loading}
            className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white py-2.5 rounded-lg font-semibold disabled:opacity-50">
            {loading ? "Бобим..." : mode === "register" ? `Зарегистрироваться ${form.avatar}` : "Войти 🦉"}
          </Button>

          <button type="button" onClick={() => { setMode(mode === "register" ? "login" : "register"); setError(""); }}
            className="w-full text-[#b9bbbe] hover:text-white text-sm text-center transition-colors">
            {mode === "register" ? "Уже бобинь? Войти" : "Ещё не боб? Зарегистрироваться"}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
const Index = () => {
  const [user, setUser]           = useState<User | null>(null);
  const [token, setToken]         = useState("");
  const [showAuth, setShowAuth]   = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [mobileMenu, setMobileMenu]       = useState(false);
  const [showMembers, setShowMembers]     = useState(true);

  const [channels, setChannels]         = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [inputText, setInputText]         = useState("");
  const [sending, setSending]             = useState(false);

  const [voiceRoom, setVoiceRoom]         = useState<string | null>(null);
  const [voiceRoomMembers, setVoiceRoomMembers] = useState<Record<string, string[]>>({});
  const [textCatOpen, setTextCatOpen]   = useState(true);
  const [voiceCatOpen, setVoiceCatOpen] = useState(true);

  const messagesEndRef    = useRef<HTMLDivElement>(null);
  const pollRef           = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeChannelRef  = useRef<Channel | null>(null);
  const voiceRoomsTimer   = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { activeChannelRef.current = activeChannel; }, [activeChannel]);

  // Restore session
  useEffect(() => {
    const t = localStorage.getItem("bobyn_token");
    const u = localStorage.getItem("bobyn_user");
    if (t && u) { setToken(t); setUser(JSON.parse(u)); }
  }, []);

  // Load channels
  useEffect(() => {
    fetch(`${MSG_URL}?channel_id=1`).then(r => r.json()).then(data => {
      if (data.channels?.length) { setChannels(data.channels); setActiveChannel(data.channels[0]); }
    }).catch(() => {});
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

  // Poll voice rooms
  useEffect(() => {
    const pollVoice = () => {
      fetch(`${VOICE_URL}?action=rooms`).then(r => r.json()).then(d => {
        if (d.rooms) setVoiceRoomMembers(d.rooms);
      }).catch(() => {});
    };
    pollVoice();
    voiceRoomsTimer.current = setInterval(pollVoice, 5000);
    return () => { if (voiceRoomsTimer.current) clearInterval(voiceRoomsTimer.current); };
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadMessages = async (channelId: number) => {
    try {
      const res = await fetch(`${MSG_URL}?channel_id=${channelId}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (err) { console.error(err); }
  };

  const handleAuth = (u: User, t: string) => {
    setUser(u); setToken(t);
    localStorage.setItem("bobyn_token", t);
    localStorage.setItem("bobyn_user", JSON.stringify(u));
    setShowAuth(false);
  };

  const handleLogout = () => {
    setUser(null); setToken("");
    localStorage.removeItem("bobyn_token");
    localStorage.removeItem("bobyn_user");
    if (voiceRoom) setVoiceRoom(null);
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
      if (res.ok && data.message) { setMessages(prev => [...prev, data.message]); setInputText(""); }
    } catch (err) { console.error(err); }
    setSending(false);
  };

  const joinVoice = (room: string) => {
    if (!user) { setShowAuth(true); return; }
    setVoiceRoom(room);
  };

  const fmt = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  const fmtDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) return "Сегодня";
      return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
    } catch { return ""; }
  };

  // Группируем сообщения по дням
  const msgGroups: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const d = fmtDate(m.created_at);
    const last = msgGroups[msgGroups.length - 1];
    if (last && last.date === d) last.msgs.push(m);
    else msgGroups.push({ date: d, msgs: [m] });
  });

  const onlineMembers = [...new Map(messages.slice(-30).reverse().map(m => [m.username, m])).values()].slice(0, 10);

  return (
    <div className="min-h-screen bg-[#313338] text-white overflow-x-hidden font-['Whitney',_'Helvetica_Neue',_Helvetica,_Arial,_sans-serif]">
      {showAuth && <AuthModal onAuth={handleAuth} onClose={() => setShowAuth(false)} />}

      {/* Навигация */}
      <nav className="bg-[#2b2d31] border-b border-[#1e1f22] px-4 py-3 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-xl shadow-lg">🦉</div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">Бобинь</h1>
              <p className="text-[10px] text-[#72767d] leading-none mt-0.5">by nezdoroviy</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#1e1f22] rounded-lg px-3 py-1.5">
                  <span className="text-base">{user.avatar}</span>
                  <span className="text-white text-sm font-medium">{user.username}</span>
                  <div className="w-2 h-2 bg-[#3ba55c] rounded-full" />
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}
                  className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b] h-8 px-2">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b] text-sm h-8" onClick={() => setShowAuth(true)}>Войти</Button>
                <Button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-4 h-8 text-sm font-medium" onClick={() => setShowAuth(true)}>Стать Бобинью 🦉</Button>
              </div>
            )}
          </div>

          <Button variant="ghost" className="sm:hidden p-2 text-[#b9bbbe]" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {mobileMenu && (
          <div className="sm:hidden mt-3 pt-3 border-t border-[#1e1f22] flex flex-col gap-2">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span>{user.avatar}</span><span className="text-white text-sm">{user.username}</span></div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-[#b9bbbe]"><LogOut className="w-4 h-4" /></Button>
              </div>
            ) : (
              <>
                <Button variant="ghost" className="justify-start text-[#b9bbbe]" onClick={() => { setShowAuth(true); setMobileMenu(false); }}>Войти</Button>
                <Button className="bg-[#7c3aed] text-white" onClick={() => { setShowAuth(true); setMobileMenu(false); }}>Стать Бобинью 🦉</Button>
              </>
            )}
          </div>
        )}
      </nav>

      <div className="flex" style={{ height: "calc(100vh - 57px)" }}>

        {/* Серверная панель */}
        <div className="hidden lg:flex w-[72px] bg-[#1e1f22] flex-col items-center py-3 gap-2 flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-[16px] hover:rounded-[12px] transition-all duration-150 flex items-center justify-center text-2xl cursor-pointer shadow-lg">🦉</div>
          <div className="w-8 h-[2px] bg-[#35363c] rounded-full my-1" />
          {["🐦", "🌙", "🦆", "🥚"].map((e, i) => (
            <div key={i} className="w-12 h-12 bg-[#313338] rounded-[24px] hover:rounded-[12px] transition-all duration-150 flex items-center justify-center cursor-pointer hover:bg-[#7c3aed] text-xl">
              {e}
            </div>
          ))}
        </div>

        {/* Канальная панель */}
        <div className={`${mobileSidebar ? "flex" : "hidden"} lg:flex w-full lg:w-60 bg-[#2b2d31] flex-col flex-shrink-0`}>
          <div className="px-4 py-3 border-b border-[#1e1f22] flex items-center justify-between shadow-sm">
            <h2 className="text-white font-bold text-sm">Сервер Бобинь 🦉</h2>
            <Button variant="ghost" className="lg:hidden p-1 text-[#b9bbbe] h-6 w-6" onClick={() => setMobileSidebar(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 p-2 overflow-y-auto space-y-1">
            {/* Текстовые каналы */}
            <button onClick={() => setTextCatOpen(!textCatOpen)}
              className="flex items-center gap-1 px-1 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide w-full hover:text-[#dcddde] transition-colors">
              {textCatOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Каналы бобей
            </button>
            {textCatOpen && channels.filter(c => c.type === "text").map(ch => (
              <div key={ch.id} onClick={() => { setActiveChannel(ch); setMobileSidebar(false); }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors group ${activeChannel?.id === ch.id ? "bg-[#393c43] text-white" : "text-[#8e9297] hover:text-[#dcddde] hover:bg-[#35373c]"}`}>
                <Hash className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate flex-1">{ch.name}</span>
              </div>
            ))}

            {/* Голосовые каналы */}
            <button onClick={() => setVoiceCatOpen(!voiceCatOpen)}
              className="flex items-center gap-1 px-1 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide w-full hover:text-[#dcddde] transition-colors mt-3">
              {voiceCatOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              Голосовые норы
            </button>
            {voiceCatOpen && VOICE_ROOMS.map(room => (
              <div key={room}>
                <div
                  onClick={() => joinVoice(room)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors group ${voiceRoom === room ? "bg-[#393c43] text-white" : "text-[#8e9297] hover:text-[#dcddde] hover:bg-[#35373c]"}`}>
                  <Mic className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm truncate flex-1">{room}</span>
                  {voiceRoom !== room && (
                    <Phone className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#3ba55c]" />
                  )}
                  {voiceRoom === room && (
                    <div className="w-2 h-2 bg-[#3ba55c] rounded-full animate-pulse" />
                  )}
                </div>
                {/* Участники голосового канала */}
                {(voiceRoomMembers[room] || []).map(uname => (
                  <div key={uname} className="flex items-center gap-2 px-6 py-0.5">
                    <div className="w-5 h-5 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-xs">🦉</div>
                    <span className="text-[#8e9297] text-xs truncate">{uname}</span>
                    <div className="w-1.5 h-1.5 bg-[#3ba55c] rounded-full ml-auto" />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Активный голосовой чат */}
          {voiceRoom && user && (
            <VoiceChat
              room={voiceRoom}
              user={user}
              token={token}
              onLeave={() => setVoiceRoom(null)}
            />
          )}

          {/* Пользователь внизу */}
          <div className="p-2 bg-[#232428] flex items-center gap-2">
            {user ? (
              <>
                <div className="w-8 h-8 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-lg flex-shrink-0 relative">
                  {user.avatar}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3ba55c] border-2 border-[#232428] rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold truncate leading-none">{user.username}</div>
                  <div className="text-[#3ba55c] text-xs leading-none mt-0.5">онлайн</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="w-7 h-7 p-0 hover:bg-[#40444b]" onClick={() => setShowAuth(false)}>
                    <Mic className="w-3.5 h-3.5 text-[#b9bbbe]" />
                  </Button>
                  <Button variant="ghost" size="sm" className="w-7 h-7 p-0 hover:bg-[#40444b]" onClick={handleLogout}>
                    <LogOut className="w-3.5 h-3.5 text-[#b9bbbe]" />
                  </Button>
                  <Button variant="ghost" size="sm" className="w-7 h-7 p-0 hover:bg-[#40444b]">
                    <Settings className="w-3.5 h-3.5 text-[#b9bbbe]" />
                  </Button>
                </div>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} className="flex items-center gap-2 w-full hover:bg-[#40444b] rounded-lg p-1.5 transition-colors">
                <div className="w-8 h-8 bg-[#40444b] rounded-full flex items-center justify-center text-lg">🦉</div>
                <span className="text-[#b9bbbe] text-xs">Войди, чтобы бобить</span>
              </button>
            )}
          </div>
        </div>

        {/* Чат */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#313338]">
          {/* Хедер */}
          <div className="h-12 bg-[#313338] border-b border-[#1e1f22] flex items-center px-4 gap-3 flex-shrink-0 shadow-sm">
            <Button variant="ghost" className="lg:hidden p-1 text-[#8e9297] h-8 w-8" onClick={() => setMobileSidebar(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <Hash className="w-5 h-5 text-[#8e9297]" />
            <span className="text-white font-bold">{activeChannel?.name || "боб-общий"}</span>
            <div className="w-px h-5 bg-[#40444b] mx-1 hidden sm:block" />
            <span className="text-[#8e9297] text-sm hidden sm:block truncate">Бобинь — мессенджер бобов сов by nezdoroviy</span>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => activeChannel && loadMessages(activeChannel.id)}
                className="w-8 h-8 flex items-center justify-center text-[#b9bbbe] hover:text-white transition-colors rounded hover:bg-[#40444b]">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => setShowMembers(!showMembers)}
                className={`w-8 h-8 flex items-center justify-center transition-colors rounded hover:bg-[#40444b] ${showMembers ? "text-white bg-[#40444b]" : "text-[#b9bbbe] hover:text-white"}`}>
                <Users className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 hidden sm:flex items-center justify-center text-[#b9bbbe] hover:text-white transition-colors rounded hover:bg-[#40444b]">
                <Bell className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 hidden sm:flex items-center justify-center text-[#b9bbbe] hover:text-white transition-colors rounded hover:bg-[#40444b]">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Сообщения */}
          <div className="flex-1 overflow-y-auto px-0 py-2 space-y-0.5">
            <div className="text-center py-8 px-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">🦉</div>
              <h3 className="text-white font-bold text-xl mb-1">#{activeChannel?.name || "боб-общий"}</h3>
              <p className="text-[#8e9297] text-sm">Начало канала бобей. Первый боб — легенда.</p>
            </div>

            {msgGroups.map(group => (
              <div key={group.date}>
                <div className="flex items-center gap-3 px-4 my-4">
                  <div className="flex-1 h-px bg-[#3f4147]" />
                  <span className="text-[#72767d] text-xs font-medium">{group.date}</span>
                  <div className="flex-1 h-px bg-[#3f4147]" />
                </div>

                {group.msgs.map((msg, i) => {
                  const prev = group.msgs[i - 1];
                  const grouped = !!prev && prev.username === msg.username &&
                    new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 300000;
                  return (
                    <div key={msg.id}
                      className={`flex gap-4 px-4 py-0.5 ${grouped ? "" : "mt-3"} hover:bg-[#2e3035] transition-colors group`}>
                      {grouped ? (
                        <div className="w-10 flex-shrink-0 flex items-center justify-end pr-1">
                          <span className="text-[#72767d] text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">{fmt(msg.created_at)}</span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center flex-shrink-0 text-xl mt-0.5 shadow">
                          {msg.avatar}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {!grouped && (
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className={`font-semibold text-sm ${msg.username === user?.username ? "text-[#7c3aed]" : "text-white"}`}>
                              {msg.username}
                            </span>
                            <span className="text-[#72767d] text-xs">{fmt(msg.created_at)}</span>
                          </div>
                        )}
                        <p className="text-[#dcddde] text-sm break-words leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {messages.length === 0 && (
              <div className="text-center text-[#72767d] text-sm py-4 px-4">
                Пока тут тишина... Стань первым бобом! 🦉
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода */}
          <div className="px-4 pb-4 pt-2 flex-shrink-0">
            {user ? (
              <form onSubmit={sendMessage}
                className="flex items-center gap-3 bg-[#383a40] rounded-xl px-4 py-3 focus-within:ring-1 focus-within:ring-[#5865f2]/30 transition-all">
                <button type="button" className="text-[#b9bbbe] hover:text-white transition-colors flex-shrink-0">
                  <SmilePlus className="w-5 h-5" />
                </button>
                <input
                  type="text" value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { sendMessage(e); } }}
                  placeholder={`Бобить в #${activeChannel?.name || "боб-общий"}...`}
                  maxLength={2000}
                  className="flex-1 bg-transparent text-white text-sm placeholder-[#72767d] outline-none" />
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" className="text-[#b9bbbe] hover:text-white transition-colors hidden sm:block">
                    <AtSign className="w-4 h-4" />
                  </button>
                  <button type="submit" disabled={sending || !inputText.trim()}
                    className="w-8 h-8 flex items-center justify-center bg-[#5865f2] hover:bg-[#4752c4] disabled:bg-[#40444b] disabled:opacity-40 rounded-lg transition-all">
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </form>
            ) : (
              <div onClick={() => setShowAuth(true)}
                className="flex items-center gap-3 bg-[#383a40] rounded-xl px-4 py-3 cursor-pointer hover:bg-[#3e4047] transition-colors">
                <span className="flex-1 text-[#72767d] text-sm">Зарегистрируйся, чтобы бобить...</span>
                <Send className="w-4 h-4 text-[#72767d] flex-shrink-0" />
              </div>
            )}
          </div>
        </div>

        {/* Панель участников */}
        {showMembers && (
          <div className="hidden xl:flex w-60 bg-[#2b2d31] flex-col p-3 flex-shrink-0 overflow-y-auto">
            {onlineMembers.length > 0 && (
              <>
                <h3 className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-2 px-2">
                  Бобят в чате — {onlineMembers.length}
                </h3>
                <div className="space-y-0.5">
                  {onlineMembers.map(m => (
                    <div key={m.username} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-[#35373c] cursor-pointer group transition-colors">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-base relative flex-shrink-0">
                        {m.avatar}
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#3ba55c] border-2 border-[#2b2d31] rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${m.username === user?.username ? "text-[#7c3aed]" : "text-[#dcddde] group-hover:text-white"}`}>
                          {m.username}
                        </div>
                        <div className="text-[#b9bbbe] text-xs">в чате</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {Object.keys(voiceRoomMembers).some(r => voiceRoomMembers[r].length > 0) && (
              <div className="mt-4">
                <h3 className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-2 px-2">В голосе</h3>
                {VOICE_ROOMS.map(room => {
                  const members = voiceRoomMembers[room] || [];
                  if (!members.length) return null;
                  return (
                    <div key={room} className="mb-2">
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[#8e9297] text-xs">
                        <Mic className="w-3 h-3" />
                        <span className="truncate">{room}</span>
                      </div>
                      {members.map(uname => (
                        <div key={uname} className="flex items-center gap-2 px-4 py-0.5">
                          <div className="w-6 h-6 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-xs">🦉</div>
                          <span className="text-[#dcddde] text-xs truncate">{uname}</span>
                          <div className="w-1.5 h-1.5 bg-[#3ba55c] rounded-full ml-auto flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {onlineMembers.length === 0 && (
              <div className="text-center py-8 text-[#72767d] text-xs">Пока никого 🦉<br />Будь первым бобом!</div>
            )}

            <div className="mt-auto pt-4 p-3 bg-[#1e1f22] rounded-xl text-center">
              <div className="text-3xl mb-1">🦉</div>
              <p className="text-white text-xs font-bold">Бобинь</p>
              <p className="text-[#72767d] text-[10px] italic">by nezdoroviy</p>
              {!user && (
                <Button className="mt-2 w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs h-7 rounded-lg" onClick={() => setShowAuth(true)}>
                  Вступить
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
