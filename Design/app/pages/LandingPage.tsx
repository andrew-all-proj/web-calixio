import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Video, Mail, Lock, User, Eye, EyeOff, Check, X } from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [roomId, setRoomId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/room/${roomId.trim()}`);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication
    navigate("/dashboard");
  };

  const getPasswordStrength = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1e] to-[#1a1a2e]">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>

      <div className="absolute top-20 left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px]"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Join Room Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-3xl font-semibold text-white mb-2">Присоединиться к просмотру</h2>
                <p className="text-gray-400">Введите ID или ссылку на комнату</p>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Video size={20} />
                  </div>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="ID комнаты или ссылка"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-blue-600/50 hover:shadow-blue-600/70 transition-all"
                >
                  Присоединиться
                </motion.button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Нет аккаунта?{" "}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Зарегистрируйтесь
                  </button>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Auth Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              {/* Toggle */}
              <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                    isLogin
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Вход
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                    !isLogin
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Регистрация
                </button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {!isLogin && (
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <User size={20} />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Имя"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                )}

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail size={20} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {!isLogin && (
                  <>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Lock size={20} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Подтвердите пароль"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-12 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>

                    {/* Password strength indicator */}
                    {password && (
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-1 flex-1 rounded-full transition-all ${
                                passwordStrength >= level
                                  ? passwordStrength === 4
                                    ? "bg-green-500"
                                    : passwordStrength === 3
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                  : "bg-white/10"
                              }`}
                            ></div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">
                          {passwordStrength === 4
                            ? "Надёжный пароль"
                            : passwordStrength === 3
                            ? "Средний пароль"
                            : "Слабый пароль"}
                        </p>
                      </div>
                    )}

                    <label className="flex items-start gap-3 cursor-pointer">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="w-5 h-5 bg-white/5 border border-white/10 rounded appearance-none checked:bg-gradient-to-r checked:from-blue-600 checked:to-purple-600 transition-all cursor-pointer"
                        />
                        {agreedToTerms && (
                          <Check size={14} className="absolute text-white pointer-events-none" />
                        )}
                      </div>
                      <span className="text-sm text-gray-400">
                        Я согласен с{" "}
                        <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                          условиями использования
                        </a>{" "}
                        и{" "}
                        <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                          политикой конфиденциальности
                        </a>
                      </span>
                    </label>
                  </>
                )}

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-blue-600/50 hover:shadow-blue-600/70 transition-all"
                >
                  {isLogin ? "Войти" : "Создать аккаунт"}
                </motion.button>
              </form>

              {isLogin && (
                <div className="mt-6 flex justify-between text-sm">
                  <button className="text-gray-400 hover:text-blue-400 transition-colors">
                    Забыли пароль?
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Создать аккаунт
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
