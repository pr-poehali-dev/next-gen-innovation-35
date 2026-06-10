import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, Hash, Users, Mic, Settings, Bell,
  Search, Menu, X, Send, LogOut, RefreshCw, Phone,
  SmilePlus, AtSign, ChevronDown, ChevronRight, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VoiceChat } from "@/components/VoiceChat";
import { SettingsModal } from "@/components/SettingsModal";
import { DirectMessages } from "@/components/DirectMessages";
import { t, type Locale } from "@/i18n";

const AUTH_URL  = "https://functions.poehali.dev/2d6e8302-2db4-4ea2-8b80-095c945a36bc";
const MSG_URL   = "https://functions.poehali.dev/6706baf9-02f3-40a1-b747-e26deac2f64a";
const VOICE_URL = "https://functions.poehali.dev/0958ddb3-2885-4c55-a299-38539aab2053";

type User    = { id: number; username: string; avatar: string; bobyz?: string; theme?: string; locale?: string };
type Message = { id: number; text: string; created_at: string; username: string; avatar: string };
type Channel = { id: number; name: string; type: string };
type Theme   = "dark" | "light" | "midnight" | "bobyn";

const VOICE_ROOMS = ["Нора Боба", "Ветка Совы", "Инкубатор"];
const BOB_EMOJIS  = ["🦉","🐦","🦆","🥚","🌙","🦅","🐣","🦚"];

const THEME_VARS: Record<Theme, { bg: string; sidebar: string; sidebarDeep: string; border: string; input: string; accent: string; accentHover: string; msgHover: string; text: string; muted: string }> = {
  dark:     { bg:"#313338", sidebar:"#2b2d31", sidebarDeep:"#232428", border:"#1e1f22", input:"#383a40", accent:"#5865f2", accentHover:"#4752c4", msgHover:"#2e3035", text:"#dcddde", muted:"#8e9297" },
  light:    { bg:"#f2f3f5", sidebar:"#e3e5e8", sidebarDeep:"#d4d7dc", border:"#c7ccd1", input:"#ebedef", accent:"#5865f2", accentHover:"#4752c4", msgHover:"#e8eaed", text:"#2e3338", muted:"#4f5660" },
  midnight: { bg:"#0d1117", sidebar:"#161b22", sidebarDeep:"#0d1117", border:"#21262d", input:"#1c2128", accent:"#7c3aed", accentHover:"#6d28d9", msgHover:"#161b22", text:"#e6edf3", muted:"#8b949e" },
  bobyn:    { bg:"#1a0a2e", sidebar:"#2d1b4e", sidebarDeep:"#1a0a2e", border:"#3d2565", input:"#2d1b4e", accent:"#a855f7", accentHover:"#9333ea", msgHover:"#251040", text:"#e9d5ff", muted:"#a78bfa" },
};

// ─── Auth Modal ───────────────────────────────────────────────────────────────
const AuthModal = ({ onAuth, onClose, locale }: { onAuth: (u: User, t: string) => void; onClose: () => void; locale: Locale }) => {
  const tr = t(locale);
  const [mode, setMode]   = useState<"login"|"register">("register");
  const [form, setForm]   = useState({ username:"", email:"", password:"", avatar:"🦉" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newUser, setNewUser] = useState<User | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const body = mode === "register" ? { action:"register", ...form } : { action:"login", username:form.username, password:form.password };
      const res  = await fetch(AUTH_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка"); return; }
      if (mode === "register") { setNewUser(data.user); setSuccess(true); setTimeout(() => onAuth(data.user, data.token), 1800); }
      else { onAuth(data.user, data.token); }
    } catch { setError("Ошибка сети"); }
    finally { setLoading(false); }
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#36393f] rounded-2xl w-full max-w-md border border-[#202225] shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-[#7c3aed] to-[#5865f2] p-7 text-center relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
          <div className="text-5xl mb-2">{form.avatar}</div>
          <h2 className="text-white text-2xl font-bold">{mode === "register" ? tr.register : tr.login}</h2>
          <p className="text-purple-200 text-xs mt-1 italic">Мессенджер бобов сов · {tr.tagline}</p>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="bg-red-900/40 border border-red-800 text-red-300 text-sm rounded-lg px-3 py-2">{error}</div>}
          {mode === "register" && (
            <div>
              <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide block mb-2">{tr.avatar}</label>
              <div className="flex gap-2 flex-wrap">
                {BOB_EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setForm({...form, avatar:e})}
                    className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${form.avatar===e ? "bg-[#7c3aed] ring-2 ring-[#7c3aed] ring-offset-2 ring-offset-[#36393f] scale-110" : "bg-[#202225] hover:bg-[#40444b]"}`}>{e}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide block mb-1">{mode==="register" ? tr.username : tr.bobyz}</label>
            <input type="text" placeholder={mode==="register" ? "боб_сова_1337" : "логин или почта"} value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required
              className="w-full bg-[#202225] text-white rounded-lg px-3 py-2.5 text-sm border border-[#40444b] focus:border-[#5865f2] focus:outline-none placeholder-[#72767d]" />
          </div>
          {mode==="register" && (
            <div>
              <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide block mb-1">{tr.email}</label>
              <input type="email" placeholder="bob@sovamail.ru" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required
                className="w-full bg-[#202225] text-white rounded-lg px-3 py-2.5 text-sm border border-[#40444b] focus:border-[#5865f2] focus:outline-none placeholder-[#72767d]" />
            </div>
          )}
          <div>
            <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide block mb-1">{tr.password}</label>
            <input type="password" placeholder={tr.passwordHint} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={8}
              className="w-full bg-[#202225] text-white rounded-lg px-3 py-2.5 text-sm border border-[#40444b] focus:border-[#5865f2] focus:outline-none placeholder-[#72767d]" />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white py-2.5 rounded-lg font-semibold disabled:opacity-50">
            {loading ? tr.loading : mode==="register" ? `${tr.registerBtn} ${form.avatar}` : tr.loginBtn}
          </Button>
          <button type="button" onClick={() => { setMode(mode==="register"?"login":"register"); setError(""); }}
            className="w-full text-[#b9bbbe] hover:text-white text-sm text-center transition-colors">
            {mode==="register" ? tr.alreadyBobyn : tr.notBobyn}
          </button>
        </form>
      </div>
    </div>
  );
};

// ─── Main App ─────────────────────────────────────────────────────────────────
const Index = () => {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState("");
  const [theme, setTheme]     = useState<Theme>("dark");
  const [locale, setLocale]   = useState<Locale>("ru");
  const [showAuth, setShowAuth]         = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDMs, setShowDMs]           = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [mobileMenu, setMobileMenu]       = useState(false);
  const [showMembers, setShowMembers]     = useState(true);
  const [textCatOpen, setTextCatOpen]   = useState(true);
  const [voiceCatOpen, setVoiceCatOpen] = useState(true);

  const [channels, setChannels]           = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [inputText, setInputText]         = useState("");
  const [sending, setSending]             = useState(false);

  const [voiceRoom, setVoiceRoom]               = useState<string | null>(null);
  const [voiceRoomMembers, setVoiceRoomMembers] = useState<Record<string, string[]>>({});

  const messagesEnd     = useRef<HTMLDivElement>(null);
  const pollRef         = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeChannelRef = useRef<Channel | null>(null);

  useEffect(() => { activeChannelRef.current = activeChannel; }, [activeChannel]);

  const v = THEME_VARS[theme];

  // Restore session
  useEffect(() => {
    const tk = localStorage.getItem("bobyn_token");
    const us = localStorage.getItem("bobyn_user");
    if (tk && us) {
      const u: User = JSON.parse(us);
      setToken(tk); setUser(u);
      if (u.theme) setTheme(u.theme as Theme);
      if (u.locale) setLocale(u.locale as Locale);
    }
    const savedTheme  = localStorage.getItem("bobyn_theme") as Theme | null;
    const savedLocale = localStorage.getItem("bobyn_locale") as Locale | null;
    if (savedTheme)  setTheme(savedTheme);
    if (savedLocale) setLocale(savedLocale);
  }, []);

  useEffect(() => {
    fetch(`${MSG_URL}?channel_id=1`).then(r=>r.json()).then(data => {
      if (data.channels?.length) { setChannels(data.channels); setActiveChannel(data.channels[0]); }
    }).catch(()=>{});
  }, []);

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
    const poll = () => fetch(`${VOICE_URL}?action=rooms`).then(r=>r.json()).then(d => { if (d.rooms) setVoiceRoomMembers(d.rooms); }).catch(()=>{});
    poll();
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const loadMessages = async (channelId: number) => {
    try {
      const res = await fetch(`${MSG_URL}?channel_id=${channelId}`);
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (err) { console.error(err); }
  };

  const handleAuth = (u: User, tk: string) => {
    setUser(u); setToken(tk);
    if (u.theme) setTheme(u.theme as Theme);
    if (u.locale) setLocale(u.locale as Locale);
    localStorage.setItem("bobyn_token", tk);
    localStorage.setItem("bobyn_user", JSON.stringify(u));
    setShowAuth(false);
  };

  const handleLogout = () => {
    setUser(null); setToken("");
    localStorage.removeItem("bobyn_token");
    localStorage.removeItem("bobyn_user");
    if (voiceRoom) setVoiceRoom(null);
  };

  const handleSettingsUpdate = (updates: { avatar?: string; bobyz?: string; theme?: Theme; locale?: Locale }) => {
    if (updates.theme)  { setTheme(updates.theme);   localStorage.setItem("bobyn_theme",  updates.theme); }
    if (updates.locale) { setLocale(updates.locale); localStorage.setItem("bobyn_locale", updates.locale); }
    if (user && (updates.avatar || updates.bobyz)) {
      const updated = { ...user, avatar: updates.avatar || user.avatar, bobyz: updates.bobyz ?? user.bobyz };
      setUser(updated);
      localStorage.setItem("bobyn_user", JSON.stringify(updated));
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !activeChannel) return;
    setSending(true);
    try {
      const res = await fetch(MSG_URL, { method:"POST", headers:{"Content-Type":"application/json","X-Auth-Token":token}, body:JSON.stringify({text:inputText.trim(),channel_id:activeChannel.id}) });
      const data = await res.json();
      if (res.ok && data.message) { setMessages(prev=>[...prev, data.message]); setInputText(""); }
    } catch (err) { console.error(err); }
    setSending(false);
  };

  const fmt = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString(locale==="ru"?"ru-RU":"en-US", {hour:"2-digit",minute:"2-digit"}); }
    catch { return ""; }
  };

  const fmtDate = (iso: string) => {
    try {
      const d = new Date(iso); const today = new Date();
      if (d.toDateString()===today.toDateString()) return t(locale).today;
      return d.toLocaleDateString(locale==="ru"?"ru-RU":"en-US", {day:"numeric",month:"long"});
    } catch { return ""; }
  };

  const msgGroups: { date: string; msgs: Message[] }[] = [];
  messages.forEach(m => {
    const d = fmtDate(m.created_at), last = msgGroups[msgGroups.length-1];
    if (last && last.date===d) last.msgs.push(m);
    else msgGroups.push({date:d, msgs:[m]});
  });

  const onlineMembers = [...new Map(messages.slice(-30).reverse().map(m=>[m.username,m])).values()].slice(0,10);
  const tr = t(locale);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{background: v.bg, color: v.text}}>
      {showAuth     && <AuthModal onAuth={handleAuth} onClose={() => setShowAuth(false)} locale={locale} />}
      {showSettings && user && (
        <SettingsModal user={user} token={token} locale={locale} onClose={() => setShowSettings(false)} onUpdate={handleSettingsUpdate} />
      )}
      {showDMs && user && (
        <DirectMessages currentUser={user} token={token} locale={locale} onClose={() => setShowDMs(false)} />
      )}

      {/* Навигация */}
      <nav className="px-4 py-3 sticky top-0 z-30 border-b" style={{background: v.sidebar, borderColor: v.border}}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xl shadow-lg" style={{background:`linear-gradient(135deg, #7c3aed, ${v.accent})`}}>🦉</div>
            <div>
              <h1 className="text-base font-bold leading-none" style={{color: v.text}}>{tr.appName}</h1>
              <p className="text-[10px] leading-none mt-0.5" style={{color: v.muted}}>{tr.tagline}</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                {/* DM кнопка */}
                <button onClick={() => setShowDMs(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors hover:opacity-80"
                  style={{background: v.input, color: v.muted}}>
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden md:inline">{tr.directMessages}</span>
                </button>
                <div className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{background: v.sidebarDeep}}>
                  <span className="text-base">{user.avatar}</span>
                  <div>
                    <span className="text-sm font-medium" style={{color: v.text}}>{user.username}</span>
                    {user.bobyz && <span className="text-xs ml-1" style={{color: v.accent}}>@{user.bobyz}</span>}
                  </div>
                  <div className="w-2 h-2 bg-[#3ba55c] rounded-full" />
                </div>
                <button onClick={() => setShowSettings(true)} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:opacity-80" style={{background: v.input, color: v.muted}}>
                  <Settings className="w-4 h-4" />
                </button>
                <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:opacity-80" style={{background: v.input, color: v.muted}}>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button className="text-sm px-3 py-1.5 rounded-lg transition-colors" style={{color: v.muted}} onClick={() => setShowAuth(true)}>{tr.login}</button>
                <button className="text-white text-sm font-medium px-4 py-1.5 rounded-lg" style={{background: v.accent}} onClick={() => setShowAuth(true)}>{tr.register}</button>
              </div>
            )}
          </div>

          <button className="sm:hidden p-2 rounded-lg" style={{color: v.muted}} onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenu && (
          <div className="sm:hidden mt-3 pt-3 flex flex-col gap-2" style={{borderTop:`1px solid ${v.border}`}}>
            {user ? (
              <>
                <div className="flex items-center gap-2"><span>{user.avatar}</span><span className="text-sm" style={{color:v.text}}>{user.username}</span></div>
                <button className="flex items-center gap-2 text-sm" style={{color:v.muted}} onClick={() => { setShowDMs(true); setMobileMenu(false); }}><MessageSquare className="w-4 h-4" />{tr.directMessages}</button>
                <button className="flex items-center gap-2 text-sm" style={{color:v.muted}} onClick={() => { setShowSettings(true); setMobileMenu(false); }}><Settings className="w-4 h-4" />{tr.settings}</button>
                <button className="flex items-center gap-2 text-sm" style={{color:v.muted}} onClick={handleLogout}><LogOut className="w-4 h-4" />{tr.logout}</button>
              </>
            ) : (
              <>
                <button className="text-left text-sm" style={{color:v.muted}} onClick={() => { setShowAuth(true); setMobileMenu(false); }}>{tr.login}</button>
                <button className="text-white text-sm font-medium px-4 py-2 rounded-lg" style={{background:v.accent}} onClick={() => { setShowAuth(true); setMobileMenu(false); }}>{tr.register}</button>
              </>
            )}
          </div>
        )}
      </nav>

      <div className="flex" style={{height:"calc(100vh - 57px)"}}>

        {/* Серверная панель */}
        <div className="hidden lg:flex w-[72px] flex-col items-center py-3 gap-2 flex-shrink-0" style={{background: v.sidebarDeep}}>
          <div className="w-12 h-12 rounded-[16px] hover:rounded-[12px] transition-all duration-150 flex items-center justify-center text-2xl cursor-pointer shadow-lg" style={{background:`linear-gradient(135deg, #7c3aed, ${v.accent})`}}>🦉</div>
          <div className="w-8 h-[2px] rounded-full my-1" style={{background: v.border}} />
          {/* DM иконка на сайдбаре */}
          <button onClick={() => setShowDMs(true)} className="w-12 h-12 rounded-[24px] hover:rounded-[12px] transition-all duration-150 flex items-center justify-center cursor-pointer text-xl" style={{background: v.sidebar}}
            title={tr.directMessages}>
            <MessageSquare className="w-5 h-5" style={{color: v.muted}} />
          </button>
          {["🐦","🌙","🦆","🥚"].map((e, i) => (
            <div key={i} className="w-12 h-12 rounded-[24px] hover:rounded-[12px] transition-all duration-150 flex items-center justify-center cursor-pointer text-xl" style={{background: v.sidebar}}
              onMouseEnter={el => (el.currentTarget.style.background = v.accent)} onMouseLeave={el => (el.currentTarget.style.background = v.sidebar)}>
              {e}
            </div>
          ))}
        </div>

        {/* Канальная панель */}
        <div className={`${mobileSidebar ? "flex" : "hidden"} lg:flex w-full lg:w-60 flex-col flex-shrink-0`} style={{background: v.sidebar}}>
          <div className="px-4 py-3 flex items-center justify-between shadow-sm" style={{borderBottom:`1px solid ${v.border}`}}>
            <h2 className="font-bold text-sm" style={{color: v.text}}>{tr.serverName}</h2>
            <button className="lg:hidden p-1" style={{color: v.muted}} onClick={() => setMobileSidebar(false)}><X className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 p-2 overflow-y-auto space-y-0.5">
            <button onClick={() => setTextCatOpen(!textCatOpen)} className="flex items-center gap-1 px-1 py-1 text-xs font-semibold uppercase tracking-wide w-full transition-colors" style={{color: v.muted}}>
              {textCatOpen ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
              {tr.serverChannels}
            </button>
            {textCatOpen && channels.filter(c=>c.type==="text").map(ch => (
              <div key={ch.id} onClick={() => { setActiveChannel(ch); setMobileSidebar(false); }}
                className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors"
                style={{background: activeChannel?.id===ch.id ? v.input : "transparent", color: activeChannel?.id===ch.id ? v.text : v.muted}}
                onMouseEnter={el => { if (activeChannel?.id!==ch.id) el.currentTarget.style.background = v.msgHover; }}
                onMouseLeave={el => { if (activeChannel?.id!==ch.id) el.currentTarget.style.background = "transparent"; }}>
                <Hash className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate flex-1">{ch.name}</span>
              </div>
            ))}

            <button onClick={() => setVoiceCatOpen(!voiceCatOpen)} className="flex items-center gap-1 px-1 py-1 text-xs font-semibold uppercase tracking-wide w-full transition-colors mt-3" style={{color: v.muted}}>
              {voiceCatOpen ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
              {tr.voiceRooms}
            </button>
            {voiceCatOpen && VOICE_ROOMS.map(room => (
              <div key={room}>
                <div onClick={() => { if (!user) { setShowAuth(true); return; } setVoiceRoom(room); }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors group"
                  style={{background: voiceRoom===room ? v.input : "transparent", color: voiceRoom===room ? v.text : v.muted}}
                  onMouseEnter={el => { if (voiceRoom!==room) el.currentTarget.style.background = v.msgHover; }}
                  onMouseLeave={el => { if (voiceRoom!==room) el.currentTarget.style.background = "transparent"; }}>
                  <Mic className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm truncate flex-1">{room}</span>
                  {voiceRoom===room ? <div className="w-2 h-2 bg-[#3ba55c] rounded-full animate-pulse"/> : <Phone className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#3ba55c]"/>}
                </div>
                {(voiceRoomMembers[room]||[]).map(uname => (
                  <div key={uname} className="flex items-center gap-2 px-6 py-0.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{background:`linear-gradient(135deg,#7c3aed,${v.accent})`}}>🦉</div>
                    <span className="text-xs truncate" style={{color: v.muted}}>{uname}</span>
                    <div className="w-1.5 h-1.5 bg-[#3ba55c] rounded-full ml-auto"/>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {voiceRoom && user && (
            <VoiceChat room={voiceRoom} user={user} token={token} onLeave={() => setVoiceRoom(null)} />
          )}

          <div className="p-2 flex items-center gap-2" style={{background: v.sidebarDeep}}>
            {user ? (
              <>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0 relative" style={{background:`linear-gradient(135deg,#7c3aed,${v.accent})`}}>
                  {user.avatar}
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3ba55c] border-2 rounded-full" style={{borderColor: v.sidebarDeep}}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate leading-none" style={{color:v.text}}>{user.username}</div>
                  {user.bobyz && <div className="text-xs leading-none mt-0.5" style={{color:v.accent}}>@{user.bobyz}</div>}
                </div>
                <div className="flex gap-1">
                  <button className="w-7 h-7 p-0 flex items-center justify-center rounded hover:opacity-80" onClick={() => setShowDMs(true)} title={tr.directMessages}>
                    <MessageSquare className="w-3.5 h-3.5" style={{color:v.muted}}/>
                  </button>
                  <button className="w-7 h-7 p-0 flex items-center justify-center rounded hover:opacity-80" onClick={() => setShowSettings(true)}>
                    <Settings className="w-3.5 h-3.5" style={{color:v.muted}}/>
                  </button>
                  <button className="w-7 h-7 p-0 flex items-center justify-center rounded hover:opacity-80" onClick={handleLogout}>
                    <LogOut className="w-3.5 h-3.5" style={{color:v.muted}}/>
                  </button>
                </div>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} className="flex items-center gap-2 w-full rounded-lg p-1.5 transition-colors hover:opacity-80" style={{color:v.muted}}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg" style={{background:v.input}}>🦉</div>
                <span className="text-xs">Войди, чтобы бобить</span>
              </button>
            )}
          </div>
        </div>

        {/* Чат */}
        <div className="flex-1 flex flex-col min-w-0" style={{background: v.bg}}>
          <div className="h-12 flex items-center px-4 gap-3 flex-shrink-0 shadow-sm" style={{background: v.bg, borderBottom:`1px solid ${v.border}`}}>
            <button className="lg:hidden p-1 rounded" style={{color:v.muted}} onClick={() => setMobileSidebar(true)}><Menu className="w-5 h-5"/></button>
            <Hash className="w-5 h-5" style={{color:v.muted}} />
            <span className="font-bold" style={{color:v.text}}>{activeChannel?.name || "боб-общий"}</span>
            <div className="w-px h-5 mx-1 hidden sm:block" style={{background:v.border}}/>
            <span className="text-sm hidden sm:block truncate" style={{color:v.muted}}>{tr.appName} — {tr.tagline}</span>
            <div className="ml-auto flex items-center gap-1">
              <button onClick={() => activeChannel && loadMessages(activeChannel.id)} className="w-8 h-8 flex items-center justify-center rounded hover:opacity-80"><RefreshCw className="w-4 h-4" style={{color:v.muted}}/></button>
              <button onClick={() => setShowMembers(!showMembers)} className="w-8 h-8 flex items-center justify-center rounded" style={{background: showMembers ? v.input : "transparent"}}><Users className="w-4 h-4" style={{color: showMembers ? v.text : v.muted}}/></button>
              <button className="w-8 h-8 hidden sm:flex items-center justify-center rounded hover:opacity-80"><Bell className="w-4 h-4" style={{color:v.muted}}/></button>
              <button className="w-8 h-8 hidden sm:flex items-center justify-center rounded hover:opacity-80"><Search className="w-4 h-4" style={{color:v.muted}}/></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-0 py-2">
            <div className="text-center py-8 px-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg" style={{background:`linear-gradient(135deg,#7c3aed,${v.accent})`}}>🦉</div>
              <h3 className="font-bold text-xl mb-1" style={{color:v.text}}>#{activeChannel?.name || "боб-общий"}</h3>
              <p className="text-sm" style={{color:v.muted}}>{tr.startOfChannel}</p>
            </div>

            {msgGroups.map(group => (
              <div key={group.date}>
                <div className="flex items-center gap-3 px-4 my-4">
                  <div className="flex-1 h-px" style={{background:v.border}}/>
                  <span className="text-xs font-medium" style={{color:v.muted}}>{group.date}</span>
                  <div className="flex-1 h-px" style={{background:v.border}}/>
                </div>
                {group.msgs.map((msg, i) => {
                  const prev = group.msgs[i-1];
                  const grouped = !!prev && prev.username===msg.username && new Date(msg.created_at).getTime()-new Date(prev.created_at).getTime()<300000;
                  return (
                    <div key={msg.id} className={`flex gap-4 px-4 py-0.5 ${grouped?"":"mt-3"} group transition-colors`}
                      style={{}} onMouseEnter={el=>el.currentTarget.style.background=v.msgHover} onMouseLeave={el=>el.currentTarget.style.background="transparent"}>
                      {grouped ? (
                        <div className="w-10 flex-shrink-0 flex items-center justify-end pr-1">
                          <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{color:v.muted}}>{fmt(msg.created_at)}</span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xl mt-0.5 shadow" style={{background:`linear-gradient(135deg,#7c3aed,${v.accent})`}}>{msg.avatar}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        {!grouped && (
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="font-semibold text-sm" style={{color: msg.username===user?.username ? v.accent : v.text}}>{msg.username}</span>
                            <span className="text-xs" style={{color:v.muted}}>{fmt(msg.created_at)}</span>
                          </div>
                        )}
                        <p className="text-sm break-words leading-relaxed" style={{color:v.text}}>{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {messages.length===0 && <div className="text-center text-sm py-4 px-4" style={{color:v.muted}}>{tr.noMessages}</div>}
            <div ref={messagesEnd}/>
          </div>

          <div className="px-4 pb-4 pt-2 flex-shrink-0">
            {user ? (
              <form onSubmit={sendMessage} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{background:v.input}}>
                <button type="button"><SmilePlus className="w-5 h-5" style={{color:v.muted}}/></button>
                <input type="text" value={inputText} onChange={e=>setInputText(e.target.value)}
                  placeholder={`${tr.writeHere} #${activeChannel?.name||"боб-общий"}...`} maxLength={2000}
                  className="flex-1 bg-transparent text-sm outline-none" style={{color:v.text}} />
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" className="hidden sm:block"><AtSign className="w-4 h-4" style={{color:v.muted}}/></button>
                  <button type="submit" disabled={sending||!inputText.trim()} className="w-8 h-8 flex items-center justify-center rounded-lg transition-all disabled:opacity-40" style={{background: inputText.trim() ? v.accent : v.border}}>
                    <Send className="w-4 h-4 text-white"/>
                  </button>
                </div>
              </form>
            ) : (
              <div onClick={() => setShowAuth(true)} className="flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer transition-colors" style={{background:v.input}}
                onMouseEnter={el=>el.currentTarget.style.opacity="0.8"} onMouseLeave={el=>el.currentTarget.style.opacity="1"}>
                <span className="flex-1 text-sm" style={{color:v.muted}}>{tr.registerToChat}</span>
                <Send className="w-4 h-4 flex-shrink-0" style={{color:v.muted}}/>
              </div>
            )}
          </div>
        </div>

        {/* Панель участников */}
        {showMembers && (
          <div className="hidden xl:flex w-60 flex-col p-3 flex-shrink-0 overflow-y-auto" style={{background:v.sidebar}}>
            {onlineMembers.length > 0 && (
              <>
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-2 px-2" style={{color:v.muted}}>{tr.membersOnline} — {onlineMembers.length}</h3>
                <div className="space-y-0.5">
                  {onlineMembers.map(m => (
                    <div key={m.username} className="flex items-center gap-3 px-2 py-1.5 rounded cursor-pointer transition-colors"
                      onMouseEnter={el=>el.currentTarget.style.background=v.msgHover} onMouseLeave={el=>el.currentTarget.style.background="transparent"}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-base relative flex-shrink-0" style={{background:`linear-gradient(135deg,#7c3aed,${v.accent})`}}>
                        {m.avatar}
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#3ba55c] border-2 rounded-full" style={{borderColor:v.sidebar}}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{color: m.username===user?.username ? v.accent : v.text}}>{m.username}</div>
                        <div className="text-xs" style={{color:v.muted}}>{tr.chatting}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {Object.keys(voiceRoomMembers).some(r=>voiceRoomMembers[r].length>0) && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-2 px-2" style={{color:v.muted}}>{tr.inVoice}</h3>
                {VOICE_ROOMS.map(room => {
                  const members = voiceRoomMembers[room]||[];
                  if (!members.length) return null;
                  return (
                    <div key={room} className="mb-2">
                      <div className="flex items-center gap-1.5 px-2 py-1 text-xs" style={{color:v.muted}}><Mic className="w-3 h-3"/><span className="truncate">{room}</span></div>
                      {members.map(uname => (
                        <div key={uname} className="flex items-center gap-2 px-4 py-0.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{background:`linear-gradient(135deg,#7c3aed,${v.accent})`}}>🦉</div>
                          <span className="text-xs truncate" style={{color:v.text}}>{uname}</span>
                          <div className="w-1.5 h-1.5 bg-[#3ba55c] rounded-full ml-auto flex-shrink-0"/>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {onlineMembers.length===0 && (
              <div className="text-center py-8 text-xs" style={{color:v.muted}}>Пока никого 🦉<br/>Будь первым бобом!</div>
            )}

            <div className="mt-auto pt-4 p-3 rounded-xl text-center" style={{background:v.sidebarDeep}}>
              <div className="text-3xl mb-1">🦉</div>
              <p className="text-xs font-bold" style={{color:v.text}}>{tr.appName}</p>
              <p className="text-[10px] italic" style={{color:v.muted}}>{tr.tagline}</p>
              {!user && (
                <button className="mt-2 w-full text-white text-xs h-7 rounded-lg" style={{background:v.accent}} onClick={() => setShowAuth(true)}>
                  Вступить
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
