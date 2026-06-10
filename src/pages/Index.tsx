import { useState } from "react";
import {
  Shield,
  Zap,
  Eye,
  Clock,
  ArrowRight,
  Hash,
  Users,
  Mic,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  MessageCircle,
  Send,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

const BOB_OWL = "🦉";
const BOB_EMOJI = "🐦";

const RegisterModal = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState<"register" | "success">("register");
  const [form, setForm] = useState({ username: "", email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("success");
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#36393f] rounded-xl w-full max-w-md border border-[#202225] shadow-2xl overflow-hidden">
        {step === "register" ? (
          <>
            <div className="bg-gradient-to-r from-[#7c3aed] to-[#5865f2] p-6 text-center">
              <div className="text-5xl mb-2">{BOB_OWL}</div>
              <h2 className="text-white text-2xl font-bold">Вступить в Бобинь</h2>
              <p className="text-purple-200 text-sm mt-1">Мессенджер для настоящих бобов</p>
              <p className="text-purple-300 text-xs mt-1 italic">by nezdoroviy</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[#b9bbbe] text-xs font-semibold uppercase tracking-wide block mb-1">
                  Имя Бобини
                </label>
                <input
                  type="text"
                  placeholder="например: боб_сова_1337"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                  className="w-full bg-[#202225] text-white rounded px-3 py-2 text-sm border border-[#40444b] focus:border-[#5865f2] focus:outline-none placeholder-[#72767d]"
                />
              </div>
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
                className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white py-2 rounded font-medium"
              >
                Стать Бобинью {BOB_OWL}
              </Button>
              <p className="text-[#72767d] text-xs text-center">
                Регистрируясь, ты подтверждаешь что ты настоящий боб сова
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-[#b9bbbe] hover:text-white text-sm text-center transition-colors"
              >
                Уже бобинь? Войти
              </button>
            </form>
          </>
        ) : (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4 animate-bounce">{BOB_OWL}</div>
            <h2 className="text-white text-2xl font-bold mb-2">Добро пожаловать в стаю, {form.username}!</h2>
            <p className="text-[#b9bbbe] text-sm mb-2">Ты теперь настоящая Бобинь</p>
            <p className="text-[#7c3aed] text-xs italic mb-6">by nezdoroviy</p>
            <Button
              onClick={onClose}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-8 py-2 rounded font-medium"
            >
              Войти в Бобинь {BOB_OWL}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const Index = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="min-h-screen bg-[#36393f] text-white overflow-x-hidden">
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}

      {/* Навигация в стиле Discord */}
      <nav className="bg-[#2f3136] border-b border-[#202225] px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center text-lg sm:text-xl">
              {BOB_OWL}
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">Бобинь</h1>
              <p className="text-xs text-[#b9bbbe] hidden sm:block">Мессенджер боб совы · by nezdoroviy</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b]"
              onClick={() => setShowRegister(true)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Войти
            </Button>
            <Button
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-2 rounded text-sm font-medium"
              onClick={() => setShowRegister(true)}
            >
              Стать Бобинью {BOB_OWL}
            </Button>
          </div>
          <Button
            variant="ghost"
            className="sm:hidden text-[#b9bbbe] hover:text-white hover:bg-[#40444b] p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="sm:hidden mt-4 pt-4 border-t border-[#202225]">
            <div className="flex flex-col gap-3">
              <Button
                variant="ghost"
                className="text-[#b9bbbe] hover:text-white hover:bg-[#40444b] justify-start"
                onClick={() => { setShowRegister(true); setMobileMenuOpen(false); }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Войти
              </Button>
              <Button
                className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 py-2 rounded text-sm font-medium"
                onClick={() => { setShowRegister(true); setMobileMenuOpen(false); }}
              >
                Стать Бобинью {BOB_OWL}
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Макет в стиле Discord */}
      <div className="flex min-h-screen">
        {/* Боковая панель серверов */}
        <div className="hidden lg:flex w-[72px] bg-[#202225] flex-col items-center py-3 gap-2">
          <div className="w-12 h-12 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer text-2xl">
            {BOB_OWL}
          </div>
          <div className="w-8 h-[2px] bg-[#36393f] rounded-full"></div>
          {["🐦", "🌙", "🦆", "🥚"].map((emoji, i) => (
            <div
              key={i}
              className="w-12 h-12 bg-[#36393f] rounded-3xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer hover:bg-[#7c3aed] text-xl"
            >
              {emoji}
            </div>
          ))}
        </div>

        {/* Основной контент */}
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Боковая панель каналов */}
          <div className={`${mobileSidebarOpen ? "block" : "hidden"} lg:block w-full lg:w-60 bg-[#2f3136] flex flex-col`}>
            <div className="p-4 border-b border-[#202225] flex items-center justify-between">
              <h2 className="text-white font-semibold text-base">Сервер Бобинь {BOB_OWL}</h2>
              <Button
                variant="ghost"
                className="lg:hidden text-[#b9bbbe] hover:text-white hover:bg-[#40444b] p-1"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 p-2">
              <div className="mb-4">
                <div className="flex items-center gap-1 px-2 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide">
                  <ArrowRight className="w-3 h-3" />
                  <span>Каналы бобей</span>
                </div>
                <div className="mt-1 space-y-0.5">
                  {["боб-общий", "мемы-совы", "бобинь-флуд", "крик-бобини"].map((channel) => (
                    <div
                      key={channel}
                      className="flex items-center gap-1.5 px-2 py-1 rounded text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43] cursor-pointer"
                    >
                      <Hash className="w-4 h-4" />
                      <span className="text-sm">{channel}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1 px-2 py-1 text-[#8e9297] text-xs font-semibold uppercase tracking-wide">
                  <ArrowRight className="w-3 h-3" />
                  <span>Голосовые норы</span>
                </div>
                <div className="mt-1 space-y-0.5">
                  {["Нора Боба", "Ветка Совы"].map((channel) => (
                    <div
                      key={channel}
                      className="flex items-center gap-1.5 px-2 py-1 rounded text-[#8e9297] hover:text-[#dcddde] hover:bg-[#393c43] cursor-pointer"
                    >
                      <Mic className="w-4 h-4" />
                      <span className="text-sm">{channel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Область пользователя */}
            <div className="p-2 bg-[#292b2f] flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center">
                <span className="text-lg">{BOB_OWL}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">боб_сова</div>
                <div className="text-[#b9bbbe] text-xs truncate">#0000</div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 hover:bg-[#40444b]">
                  <Mic className="w-4 h-4 text-[#b9bbbe]" />
                </Button>
                <Button variant="ghost" size="sm" className="w-8 h-8 p-0 hover:bg-[#40444b]">
                  <Settings className="w-4 h-4 text-[#b9bbbe]" />
                </Button>
              </div>
            </div>
          </div>

          {/* Область чата */}
          <div className="flex-1 flex flex-col">
            {/* Заголовок чата */}
            <div className="h-12 bg-[#36393f] border-b border-[#202225] flex items-center px-4 gap-2">
              <Button
                variant="ghost"
                className="lg:hidden text-[#8e9297] hover:text-[#dcddde] hover:bg-[#40444b] p-1 mr-2"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Hash className="w-5 h-5 text-[#8e9297]" />
              <span className="text-white font-semibold">боб-общий</span>
              <div className="w-px h-6 bg-[#40444b] mx-2 hidden sm:block"></div>
              <span className="text-[#8e9297] text-sm hidden sm:block">Добро пожаловать в Бобинь — мессенджер бобов сов</span>
              <div className="ml-auto flex items-center gap-2 sm:gap-4">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-[#b9bbbe] cursor-pointer hover:text-[#dcddde]" />
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#b9bbbe] cursor-pointer hover:text-[#dcddde]" />
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#b9bbbe] cursor-pointer hover:text-[#dcddde]" />
              </div>
            </div>

            {/* Сообщения чата */}
            <div className="flex-1 p-2 sm:p-4 space-y-4 sm:space-y-6 overflow-y-auto">

              {/* Приветственное сообщение бота */}
              <div className="flex gap-2 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-full flex items-center justify-center flex-shrink-0 text-lg sm:text-xl">
                  {BOB_OWL}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-white font-medium text-sm sm:text-base">БобБот</span>
                    <span className="bg-[#7c3aed] text-white text-xs px-1 rounded">БОТ</span>
                    <span className="text-[#72767d] text-xs hidden sm:inline">Сегодня в 00:00</span>
                  </div>
                  <div className="text-[#dcddde] text-sm sm:text-base">
                    <p className="mb-3 sm:mb-4">
                      <strong>Добро пожаловать в Бобинь!</strong> 🦉 Единственный мессенджер, созданный настоящими бобами для настоящих сов.
                    </p>
                    <div className="bg-[#2f3136] border-l-4 border-[#7c3aed] p-3 sm:p-4 rounded">
                      <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">Что умеет Бобинь {BOB_OWL}:</h3>
                      <ul className="space-y-1 text-xs sm:text-sm text-[#b9bbbe]">
                        <li>🦉 Отправлять сообщения в стиле боб совы</li>
                        <li>🐦 Делиться мемами про боба прямо в чате</li>
                        <li>🌙 Ночной режим — для настоящих сов</li>
                        <li>🥚 Инкубатор бобей — найди своих</li>
                        <li>📣 Кричать на всех каналах одновременно</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Сообщение от боба совы */}
              <div className="flex gap-2 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 text-lg">
                  🦆
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-white font-medium text-sm sm:text-base">главный_боб</span>
                    <span className="text-[#72767d] text-xs hidden sm:inline">Сегодня в 03:17</span>
                  </div>
                  <div className="text-[#dcddde] mb-3 text-sm sm:text-base">
                    я боб сова и я пришёл в этот мессенджер потому что так надо
                  </div>

                  {/* Профиль боба */}
                  <div className="bg-[#2f3136] border border-[#202225] rounded-lg overflow-hidden w-full max-w-sm">
                    <div className="h-16 sm:h-20 bg-gradient-to-r from-[#7c3aed] to-[#5865f2] relative">
                      <div className="absolute -bottom-3 sm:-bottom-4 left-3 sm:left-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-[#2f3136] bg-[#36393f] overflow-hidden flex items-center justify-center text-3xl sm:text-4xl">
                          {BOB_OWL}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-[#3ba55c] border-4 border-[#2f3136] rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 sm:pt-6 px-3 sm:px-4 pb-3 sm:pb-4">
                      <div className="mb-3 sm:mb-4">
                        <h3 className="text-white text-lg sm:text-xl font-bold mb-1">боб сова</h3>
                        <div className="flex items-center gap-2 text-[#b9bbbe] text-xs sm:text-sm">
                          <span>bob_sova</span>
                          <span>·</span>
                          <span className="text-[#7c3aed]">by nezdoroviy</span>
                        </div>
                      </div>
                      <div className="mb-3 sm:mb-4">
                        <div className="bg-[#36393f] rounded-lg p-2 sm:p-3">
                          <div className="flex items-center gap-2 text-[#dcddde] text-xs sm:text-sm">
                            <span className="text-lg">{BOB_OWL}</span>
                            <span>я боб. я сова. я всегда онлайн.</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex border-b border-[#40444b] mb-3 sm:mb-4">
                        <button className="px-3 sm:px-4 py-2 text-[#8e9297] text-xs sm:text-sm font-medium hover:text-[#dcddde]">
                          Обо мне
                        </button>
                        <button className="px-3 sm:px-4 py-2 text-white text-xs sm:text-sm font-medium border-b-2 border-[#7c3aed]">
                          Активность
                        </button>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-2 sm:mb-3">
                          <span>Бобит</span>
                        </div>
                        <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-[#36393f] rounded-lg">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#7c3aed] to-[#5865f2] rounded-lg flex items-center justify-center flex-shrink-0 text-2xl">
                            {BOB_OWL}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-semibold text-xs sm:text-sm mb-1">Бобинь</div>
                            <div className="text-[#dcddde] text-xs sm:text-sm mb-1">Пишет мемы в #мемы-совы</div>
                            <div className="text-[#b9bbbe] text-xs sm:text-sm mb-2">Нора Боба 🌙</div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-[#3ba55c] rounded-full animate-pulse"></div>
                              <span className="text-[#3ba55c] text-xs font-medium">бобит уже 3:17 ночи</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Второй боб */}
              <div className="flex gap-2 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 text-lg">
                  🥚
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-white font-medium text-sm sm:text-base">маленький_бобинь</span>
                    <span className="text-[#72767d] text-xs hidden sm:inline">Сегодня в 03:18</span>
                  </div>
                  <div className="text-[#dcddde] text-sm sm:text-base">
                    я ещё яйцо но уже бобинь в душе 🥚🦉
                  </div>
                </div>
              </div>

              {/* Секция регистрации */}
              <div className="bg-[#2f3136] border border-[#202225] rounded-lg p-4 sm:p-6 mt-6 sm:mt-8">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <span className="text-2xl">{BOB_OWL}</span>
                  Стань частью стаи Бобинь
                </h2>
                <p className="text-[#b9bbbe] text-sm mb-4 italic">by nezdoroviy · мессенджер для настоящих бобов</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">{BOB_OWL}</div>
                    <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Зарегистрируйся</h3>
                    <p className="text-[#b9bbbe] text-xs sm:text-sm">Придумай имя бобини и вступай</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">🐦</div>
                    <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Найди своих бобей</h3>
                    <p className="text-[#b9bbbe] text-xs sm:text-sm">Вступай в каналы и гнёзда</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">📣</div>
                    <h3 className="text-white font-medium mb-2 text-sm sm:text-base">Бобь со всеми</h3>
                    <p className="text-[#b9bbbe] text-xs sm:text-sm">Кричи мемы и делись совами</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-6 sm:px-8 py-2 sm:py-3 rounded text-sm font-medium"
                    onClick={() => setShowRegister(true)}
                  >
                    <span className="mr-2">{BOB_OWL}</span>
                    Зарегистрироваться
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#4f545c] text-[#b9bbbe] hover:bg-[#40444b] hover:border-[#6d6f78] px-6 sm:px-8 py-2 sm:py-3 rounded text-sm font-medium bg-transparent"
                    onClick={() => setShowRegister(true)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Войти как Бобинь
                  </Button>
                </div>
              </div>

              {/* Почему Бобинь */}
              <div className="bg-[#2f3136] border border-[#202225] rounded-lg p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Почему Бобинь? {BOB_OWL}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {[
                    { emoji: "🦉", title: "100% боб сова", desc: "Весь интерфейс заточен под бобов" },
                    { emoji: "🌙", title: "Работает ночью", desc: "Настоящие совы не спят — мы тоже" },
                    { emoji: "🥚", title: "Инкубатор бобей", desc: "Растим новых бобинь с нуля" },
                    { emoji: "🎉", title: "Мем-экономика", desc: "Никакого сбора данных, только мемы" },
                  ].map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded hover:bg-[#36393f] transition-colors"
                    >
                      <div className="text-2xl mt-0.5">{feature.emoji}</div>
                      <div>
                        <div className="text-white font-medium text-xs sm:text-sm">{feature.title}</div>
                        <div className="text-[#b9bbbe] text-xs sm:text-sm">{feature.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Поле ввода сообщения */}
            <div className="p-2 sm:p-4">
              <div
                className="bg-[#40444b] rounded-lg px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 cursor-pointer hover:bg-[#454950] transition-colors"
                onClick={() => setShowRegister(true)}
              >
                <span className="text-[#72767d] text-xs sm:text-sm flex-1">
                  Зарегистрируйся, чтобы бобить в #боб-общий...
                </span>
                <Send className="w-4 h-4 text-[#72767d]" />
              </div>
            </div>
          </div>

          {/* Боковая панель участников */}
          <div className="hidden xl:block w-60 bg-[#2f3136] p-4">
            <div className="mb-4">
              <h3 className="text-[#8e9297] text-xs font-semibold uppercase tracking-wide mb-2">Бобят сейчас — 3</h3>
              <div className="space-y-2">
                {[
                  { name: "главный_боб", status: "Кричит в #мемы-совы", emoji: "🦉", color: "from-purple-500 to-pink-500" },
                  { name: "маленький_бобинь", status: "Вылупляется", emoji: "🥚", color: "from-green-500 to-teal-500" },
                  { name: "nezdoroviy", status: "Создаёт Бобинь", emoji: "🐦", color: "from-blue-500 to-purple-500" },
                ].map((user, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 rounded hover:bg-[#36393f] cursor-pointer">
                    <div className={`w-8 h-8 bg-gradient-to-r ${user.color} rounded-full flex items-center justify-center relative text-lg`}>
                      {user.emoji}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#3ba55c] border-2 border-[#2f3136] rounded-full"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{user.name}</div>
                      <div className="text-[#b9bbbe] text-xs truncate">{user.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 p-3 bg-[#36393f] rounded-lg text-center">
              <div className="text-3xl mb-2">{BOB_OWL}</div>
              <p className="text-white text-xs font-bold mb-1">Бобинь</p>
              <p className="text-[#b9bbbe] text-xs italic">by nezdoroviy</p>
              <Button
                className="mt-3 w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs py-1 rounded"
                onClick={() => setShowRegister(true)}
              >
                Вступить
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
