import { useState, useEffect, useRef } from "react";
import { X, Send, Search, Plus, Users, ArrowLeft, UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Locale } from "@/i18n";

const CHATS_URL    = "https://functions.poehali.dev/8c043b19-55fe-4167-8be6-84b67094f518";
const SETTINGS_URL = "https://functions.poehali.dev/454ee5b6-6863-40b3-a801-2c605a3b7c16";

type User    = { id: number; username: string; avatar: string; bobyz?: string };
type Message = { id: number; user_id: number; username: string; avatar: string; text: string; created_at: string };
type Chat    = { id: number; type: "dm"|"group"; name: string; avatar: string; last_msg?: string; last_at?: string; last_user?: string; member_count: number };

interface DirectMessagesProps {
  currentUser: User;
  token: string;
  locale: Locale;
  onClose: () => void;
}

const BOB_EMOJIS = ["🦉","🐦","🦆","🥚","🌙","🦅","🐣","🦚"];

export const DirectMessages = ({ currentUser, token, locale, onClose }: DirectMessagesProps) => {
  const tr = t(locale);
  const [tab, setTab]           = useState<"dm"|"group">("dm");
  const [chats, setChats]       = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending]   = useState(false);
  const [showNew, setShowNew]   = useState(false);
  const [searchQ, setSearchQ]   = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupAvatar, setGroupAvatar] = useState("🦉");

  const messagesEnd  = useRef<HTMLDivElement>(null);
  const pollRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeChatRef = useRef<Chat | null>(null);

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);

  useEffect(() => {
    loadChats();
    const timer = setInterval(loadChats, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!activeChat) return;
    loadMessages(activeChat.id);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (activeChatRef.current) loadMessages(activeChatRef.current.id);
    }, 2000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeChat?.id]);

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (searchQ.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res  = await fetch(`${SETTINGS_URL}?action=search&q=${encodeURIComponent(searchQ)}`, { headers: { "X-Auth-Token": token } });
        const data = await res.json();
        setSearchResults((data.users || []).filter((u: User) => u.id !== currentUser.id));
      } catch (err) {
        console.error("search error", err);
      } finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQ, token, currentUser.id]);

  const loadChats = async () => {
    try {
      const res  = await fetch(`${CHATS_URL}?action=list`, { headers: { "X-Auth-Token": token } });
      const data = await res.json();
      if (data.chats) setChats(data.chats);
    } catch (err) { console.error("loadChats", err); }
  };

  const loadMessages = async (id: number) => {
    try {
      const res  = await fetch(`${CHATS_URL}?action=messages&id=${id}`, { headers: { "X-Auth-Token": token } });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
    } catch (err) { console.error("loadMessages", err); }
  };

  const openDM = async (targetUser: User) => {
    try {
      const res  = await fetch(CHATS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ action: "create_dm", target_id: targetUser.id }),
      });
      const data = await res.json();
      if (data.id) {
        await loadChats();
        const chat: Chat = { id: data.id, type: "dm", name: targetUser.username, avatar: targetUser.avatar || "🦉", member_count: 2 };
        setActiveChat(chat);
        setShowNew(false);
        setSearchQ("");
      }
    } catch (err) { console.error("openDM", err); }
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    try {
      const res  = await fetch(CHATS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ action: "create_group", name: groupName, avatar: groupAvatar, member_ids: selectedUsers.map(u => u.id) }),
      });
      const data = await res.json();
      if (data.id) {
        await loadChats();
        const chat: Chat = { id: data.id, type: "group", name: groupName, avatar: groupAvatar, member_count: selectedUsers.length + 1 };
        setActiveChat(chat);
        setShowNew(false);
        setGroupName(""); setSelectedUsers([]);
      }
    } catch (err) { console.error("createGroup", err); }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;
    setSending(true);
    try {
      const res  = await fetch(CHATS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ action: "send", conversation_id: activeChat.id, text: inputText.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.message) { setMessages(prev => [...prev, data.message]); setInputText(""); }
    } catch (err) { console.error("sendMessage", err); }
    setSending(false);
  };

  const fmt = (iso: string) => {
    try { return new Date(iso).toLocaleTimeString(locale === "ru" ? "ru-RU" : "en-US", { hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  const filteredChats = chats.filter(c => c.type === tab);

  const toggleUser = (u: User) => {
    setSelectedUsers(prev => prev.find(p => p.id === u.id) ? prev.filter(p => p.id !== u.id) : [...prev, u]);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-2 sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#313338] rounded-2xl w-full max-w-3xl h-[90vh] border border-[#1e1f22] shadow-2xl overflow-hidden flex flex-col">

        {/* Хедер */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#2b2d31] border-b border-[#1e1f22] flex-shrink-0">
          {activeChat ? (
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveChat(null)} className="text-[#b9bbbe] hover:text-white mr-1"><ArrowLeft className="w-4 h-4" /></button>
              <div className="w-8 h-8 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-lg">{activeChat.avatar}</div>
              <div>
                <div className="text-white font-semibold text-sm">{activeChat.name}</div>
                {activeChat.type === "group" && <div className="text-[#8e9297] text-xs">{activeChat.member_count} {tr.members}</div>}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button onClick={() => setTab("dm")}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${tab === "dm" ? "bg-[#393c43] text-white" : "text-[#8e9297] hover:text-white"}`}>
                {tr.directMessages}
              </button>
              <button onClick={() => setTab("group")}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${tab === "group" ? "bg-[#393c43] text-white" : "text-[#8e9297] hover:text-white"}`}>
                <Users className="w-3.5 h-3.5" />{tr.groups}
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            {!activeChat && (
              <Button size="sm" onClick={() => setShowNew(true)}
                className="bg-[#5865f2] hover:bg-[#4752c4] text-white h-8 px-3 text-xs rounded-lg">
                <Plus className="w-3.5 h-3.5 mr-1" />
                {tab === "dm" ? tr.newDM : tr.newGroup}
              </Button>
            )}
            <button onClick={onClose} className="text-[#b9bbbe] hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#40444b]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Список чатов (если нет активного) */}
          {!activeChat && !showNew && (
            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="text-5xl mb-3">{tab === "dm" ? "🦉" : "🐦"}</div>
                  <p className="text-white font-semibold mb-1">{tr.noChats}</p>
                  <p className="text-[#8e9297] text-sm">{tr.noChatsHint}</p>
                  <Button className="mt-4 bg-[#5865f2] hover:bg-[#4752c4] text-white" onClick={() => setShowNew(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    {tab === "dm" ? tr.newDM : tr.newGroup}
                  </Button>
                </div>
              ) : (
                <div className="p-2">
                  {filteredChats.map(chat => (
                    <div key={chat.id} onClick={() => setActiveChat(chat)}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[#2b2d31] transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-xl flex-shrink-0">{chat.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium text-sm">{chat.name}</span>
                          {chat.last_at && <span className="text-[#72767d] text-xs">{fmt(chat.last_at)}</span>}
                        </div>
                        {chat.last_msg && (
                          <p className="text-[#8e9297] text-xs truncate mt-0.5">
                            {chat.last_user && chat.type === "group" ? `${chat.last_user}: ` : ""}{chat.last_msg}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Форма создания нового */}
          {showNew && !activeChat && (
            <div className="flex-1 p-5 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => { setShowNew(false); setSearchQ(""); setSelectedUsers([]); }} className="text-[#b9bbbe] hover:text-white">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h3 className="text-white font-semibold">{tab === "dm" ? tr.newDM : tr.newGroup}</h3>
              </div>

              {tab === "group" && (
                <div className="mb-4 space-y-3">
                  <div className="flex gap-2 flex-wrap mb-2">
                    {BOB_EMOJIS.map(e => (
                      <button key={e} onClick={() => setGroupAvatar(e)}
                        className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${groupAvatar === e ? "bg-[#7c3aed] ring-2 ring-[#7c3aed] ring-offset-2 ring-offset-[#313338] scale-110" : "bg-[#202225] hover:bg-[#40444b]"}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                  <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)}
                    placeholder={tr.groupNamePlaceholder}
                    className="w-full bg-[#202225] text-white rounded-lg px-3 py-2.5 text-sm border border-[#40444b] focus:border-[#5865f2] focus:outline-none placeholder-[#72767d]" />
                  {selectedUsers.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {selectedUsers.map(u => (
                        <div key={u.id} className="flex items-center gap-1.5 bg-[#5865f2]/20 text-[#5865f2] rounded-full px-2.5 py-1 text-xs">
                          <span>{u.avatar}</span><span>{u.username}</span>
                          <button onClick={() => toggleUser(u)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Поиск */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#72767d]" />
                <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder={tr.search}
                  className="w-full bg-[#202225] text-white rounded-lg pl-9 pr-3 py-2.5 text-sm border border-[#40444b] focus:border-[#5865f2] focus:outline-none placeholder-[#72767d]" />
              </div>

              {searching && <div className="text-[#72767d] text-sm text-center py-4">Ищем бобов...</div>}

              <div className="space-y-1">
                {searchResults.map(u => {
                  const isSelected = selectedUsers.find(s => s.id === u.id);
                  return (
                    <div key={u.id}
                      onClick={() => tab === "dm" ? openDM(u) : toggleUser(u)}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[#2b2d31] transition-colors">
                      <div className="w-9 h-9 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-lg flex-shrink-0">{u.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm">{u.username}</div>
                        {u.bobyz && <div className="text-[#7c3aed] text-xs">@{u.bobyz}</div>}
                      </div>
                      {tab === "group" && (
                        <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${isSelected ? "bg-[#5865f2] border-[#5865f2]" : "border-[#40444b]"}`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      )}
                      {tab === "dm" && <UserPlus className="w-4 h-4 text-[#8e9297]" />}
                    </div>
                  );
                })}
              </div>

              {tab === "group" && selectedUsers.length > 0 && groupName.trim() && (
                <Button onClick={createGroup} className="w-full mt-4 bg-[#5865f2] hover:bg-[#4752c4] text-white">
                  {tr.create} {groupAvatar} «{groupName}» ({selectedUsers.length + 1} {tr.members})
                </Button>
              )}
            </div>
          )}

          {/* Чат */}
          {activeChat && (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-0.5">
                <div className="text-center py-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-2xl mx-auto mb-2 shadow">{activeChat.avatar}</div>
                  <h3 className="text-white font-bold">{activeChat.name}</h3>
                  <p className="text-[#8e9297] text-sm mt-0.5">{activeChat.type === "group" ? `${tr.groups} · ${activeChat.member_count} ${tr.members}` : tr.directMessages}</p>
                </div>

                {messages.map((msg, i) => {
                  const prev    = messages[i - 1];
                  const grouped = !!prev && prev.username === msg.username && new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 300000;
                  const isMe    = msg.user_id === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex gap-3 ${grouped ? "mt-0.5" : "mt-3"} hover:bg-[#2e3035] rounded-lg px-2 py-0.5 -mx-2 transition-colors group`}>
                      {grouped ? (
                        <div className="w-9 flex-shrink-0 flex items-center justify-end">
                          <span className="text-[#72767d] text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">{fmt(msg.created_at)}</span>
                        </div>
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-lg flex-shrink-0 mt-0.5">{msg.avatar}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        {!grouped && (
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className={`font-semibold text-sm ${isMe ? "text-[#7c3aed]" : "text-white"}`}>{isMe ? `${msg.username} (${tr.you})` : msg.username}</span>
                            <span className="text-[#72767d] text-xs">{fmt(msg.created_at)}</span>
                          </div>
                        )}
                        <p className="text-[#dcddde] text-sm break-words leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEnd} />
              </div>

              <div className="px-4 pb-4 pt-2 flex-shrink-0">
                <form onSubmit={sendMessage} className="flex items-center gap-3 bg-[#383a40] rounded-xl px-4 py-3">
                  <input type="text" value={inputText} onChange={e => setInputText(e.target.value)}
                    placeholder={`${tr.sendMessage} ${activeChat.name}...`} maxLength={2000}
                    className="flex-1 bg-transparent text-white text-sm placeholder-[#72767d] outline-none" />
                  <button type="submit" disabled={sending || !inputText.trim()}
                    className="w-8 h-8 flex items-center justify-center bg-[#5865f2] hover:bg-[#4752c4] disabled:bg-[#40444b] disabled:opacity-40 rounded-lg transition-all flex-shrink-0">
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};