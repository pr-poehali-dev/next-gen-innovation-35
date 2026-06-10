import { useState } from "react";
import { X, Save, Check, User, Palette, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { t, type Locale } from "@/i18n";

const SETTINGS_URL = "https://functions.poehali.dev/454ee5b6-6863-40b3-a801-2c605a3b7c16";
const BOB_EMOJIS = ["🦉","🐦","🦆","🥚","🌙","🦅","🐣","🦚","🦜","🐧","🦤","🕊️"];
const THEMES = ["dark","light","midnight","bobyn"] as const;

type Theme = typeof THEMES[number];

interface SettingsModalProps {
  user: { id: number; username: string; avatar: string; bobyz?: string; theme?: string; locale?: string };
  token: string;
  locale: Locale;
  onClose: () => void;
  onUpdate: (updates: { avatar?: string; bobyz?: string; theme?: Theme; locale?: Locale }) => void;
}

export const SettingsModal = ({ user, token, locale, onClose, onUpdate }: SettingsModalProps) => {
  const tr = t(locale);
  const [tab, setTab] = useState<"profile" | "theme" | "language">("profile");
  const [avatar, setAvatar] = useState(user.avatar || "🦉");
  const [bobyz, setBobyz]   = useState(user.bobyz || "");
  const [theme, setTheme]   = useState<Theme>((user.theme as Theme) || "dark");
  const [lang, setLang]     = useState<Locale>((user.locale as Locale) || "ru");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");

  const save = async () => {
    setSaving(true); setError("");
    try {
      const res  = await fetch(SETTINGS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Auth-Token": token },
        body: JSON.stringify({ action: "update", avatar, bobyz, theme, locale: lang }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Ошибка"); return; }
      onUpdate({ avatar, bobyz: data.user.bobyz, theme, locale: lang });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { setError("Ошибка сети"); }
    finally { setSaving(false); }
  };

  const themePreview: Record<Theme, { bg: string; sidebar: string; accent: string; label: string }> = {
    dark:     { bg: "#313338", sidebar: "#2b2d31", accent: "#5865f2", label: tr.themes.dark },
    light:    { bg: "#f2f3f5", sidebar: "#e3e5e8", accent: "#5865f2", label: tr.themes.light },
    midnight: { bg: "#0d1117", sidebar: "#161b22", accent: "#7c3aed", label: tr.themes.midnight },
    bobyn:    { bg: "#1a0a2e", sidebar: "#2d1b4e", accent: "#a855f7", label: tr.themes.bobyn },
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#36393f] rounded-2xl w-full max-w-lg border border-[#202225] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Хедер */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202225]">
          <h2 className="text-white font-bold text-lg">{tr.settings}</h2>
          <button onClick={onClose} className="text-[#b9bbbe] hover:text-white transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#40444b]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Боковое меню */}
          <div className="w-44 bg-[#2f3136] p-2 flex-shrink-0">
            {([
              { id: "profile",  icon: User,    label: tr.you },
              { id: "theme",    icon: Palette, label: tr.theme },
              { id: "language", icon: Globe,   label: tr.language },
            ] as const).map(item => (
              <button key={item.id} onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${tab === item.id ? "bg-[#393c43] text-white font-medium" : "text-[#8e9297] hover:text-white hover:bg-[#35373c]"}`}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Контент */}
          <div className="flex-1 p-6 overflow-y-auto">
            {tab === "profile" && (
              <div className="space-y-5">
                <div>
                  <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide block mb-3">{tr.avatar}</label>
                  <div className="flex gap-2 flex-wrap">
                    {BOB_EMOJIS.map(e => (
                      <button key={e} type="button" onClick={() => setAvatar(e)}
                        className={`w-10 h-10 rounded-xl text-2xl flex items-center justify-center transition-all ${avatar === e ? "bg-[#7c3aed] ring-2 ring-[#7c3aed] ring-offset-2 ring-offset-[#36393f] scale-110" : "bg-[#202225] hover:bg-[#40444b]"}`}>
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide block mb-1">
                    {tr.bobyz}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72767d] text-sm">@</span>
                    <input
                      type="text" value={bobyz} onChange={e => setBobyz(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      placeholder={tr.bobyzPlaceholder} maxLength={32}
                      className="w-full bg-[#202225] text-white rounded-lg pl-7 pr-3 py-2.5 text-sm border border-[#40444b] focus:border-[#5865f2] focus:outline-none placeholder-[#72767d]" />
                  </div>
                  <p className="text-[#72767d] text-xs mt-1.5">{tr.bobyzHint}</p>
                </div>

                <div className="bg-[#202225] rounded-xl p-4 flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-3xl shadow-lg">
                    {avatar}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{user.username}</div>
                    {bobyz && <div className="text-[#7c3aed] text-sm">@{bobyz}</div>}
                    <div className="text-[#3ba55c] text-xs mt-0.5">{tr.online}</div>
                  </div>
                </div>
              </div>
            )}

            {tab === "theme" && (
              <div className="space-y-3">
                <p className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-4">{tr.theme}</p>
                {THEMES.map(th => {
                  const p = themePreview[th];
                  return (
                    <button key={th} onClick={() => setTheme(th)}
                      className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${theme === th ? "border-[#7c3aed] bg-[#7c3aed]/10" : "border-[#40444b] hover:border-[#5d6169] bg-[#202225]"}`}>
                      {/* Превью темы */}
                      <div className="w-16 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow" style={{ background: p.bg }}>
                        <div className="h-full flex">
                          <div className="w-5 h-full" style={{ background: p.sidebar }} />
                          <div className="flex-1 p-1 flex flex-col gap-0.5">
                            <div className="h-1.5 rounded-full w-3/4" style={{ background: p.accent }} />
                            <div className="h-1 rounded-full w-1/2 bg-white/20" />
                            <div className="h-1 rounded-full w-2/3 bg-white/10" />
                          </div>
                        </div>
                      </div>
                      <span className="text-white text-sm font-medium">{p.label}</span>
                      {theme === th && <Check className="w-4 h-4 text-[#7c3aed] ml-auto" />}
                    </button>
                  );
                })}
              </div>
            )}

            {tab === "language" && (
              <div className="space-y-3">
                <p className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide mb-4">{tr.language}</p>
                {(["ru","en"] as Locale[]).map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${lang === l ? "border-[#7c3aed] bg-[#7c3aed]/10" : "border-[#40444b] hover:border-[#5d6169] bg-[#202225]"}`}>
                    <span className="text-2xl">{l === "ru" ? "🇷🇺" : "🇬🇧"}</span>
                    <span className="text-white font-medium">{tr.locales[l]}</span>
                    {lang === l && <Check className="w-4 h-4 text-[#7c3aed] ml-auto" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Футер */}
        <div className="px-6 py-4 border-t border-[#202225] flex items-center justify-between">
          {error && <span className="text-red-400 text-sm">{error}</span>}
          {!error && <span className="text-[#72767d] text-xs">🦉 by nezdoroviy</span>}
          <Button onClick={save} disabled={saving}
            className={`px-5 h-9 rounded-lg font-medium text-sm transition-all ${saved ? "bg-[#3ba55c] hover:bg-[#3ba55c]" : "bg-[#5865f2] hover:bg-[#4752c4]"} text-white`}>
            {saved ? <><Check className="w-4 h-4 mr-1" />{tr.saved}</> : saving ? tr.loading : <><Save className="w-4 h-4 mr-1" />{tr.save}</>}
          </Button>
        </div>
      </div>
    </div>
  );
};