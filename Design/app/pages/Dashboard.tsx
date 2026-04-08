import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Video,
  Film,
  Settings,
  Search,
  Plus,
  Users,
  Play,
  Pause,
  Lock,
  Globe,
  X,
} from "lucide-react";

interface Room {
  id: string;
  name: string;
  status: "live" | "paused";
  participants: { id: string; name: string; avatar: string }[];
  isPrivate: boolean;
  currentMovie?: string;
}

const mockRooms: Room[] = [
  {
    id: "1",
    name: "Вечерний киносеанс",
    status: "live",
    participants: [
      { id: "1", name: "Анна", avatar: "https://i.pravatar.cc/150?img=1" },
      { id: "2", name: "Иван", avatar: "https://i.pravatar.cc/150?img=2" },
      { id: "3", name: "Мария", avatar: "https://i.pravatar.cc/150?img=3" },
    ],
    isPrivate: false,
    currentMovie: "Интерстеллар",
  },
  {
    id: "2",
    name: "Марафон Marvel",
    status: "paused",
    participants: [
      { id: "4", name: "Петр", avatar: "https://i.pravatar.cc/150?img=4" },
      { id: "5", name: "Ольга", avatar: "https://i.pravatar.cc/150?img=5" },
    ],
    isPrivate: true,
    currentMovie: "Мстители: Финал",
  },
  {
    id: "3",
    name: "Классика кино",
    status: "live",
    participants: [
      { id: "6", name: "Дмитрий", avatar: "https://i.pravatar.cc/150?img=6" },
      { id: "7", name: "Елена", avatar: "https://i.pravatar.cc/150?img=7" },
      { id: "8", name: "Сергей", avatar: "https://i.pravatar.cc/150?img=8" },
      { id: "9", name: "Наталья", avatar: "https://i.pravatar.cc/150?img=9" },
    ],
    isPrivate: false,
    currentMovie: "Крёстный отец",
  },
];

export function Dashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("rooms");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rooms] = useState<Room[]>(mockRooms);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1e] to-[#1a1a2e]">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-20 lg:w-64 h-screen bg-white/5 backdrop-blur-xl border-r border-white/10 fixed left-0 top-0">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Video className="text-white" size={24} />
              </div>
              <h1 className="hidden lg:block text-xl font-bold text-white">WatchTogether</h1>
            </div>
          </div>

          <nav className="p-4 space-y-2">
            {[
              { id: "home", icon: Home, label: "Главная", path: "/dashboard" },
              { id: "rooms", icon: Video, label: "Комнаты", path: "/dashboard" },
              { id: "movies", icon: Film, label: "Мои фильмы", path: "/movies" },
              { id: "settings", icon: Settings, label: "Настройки", path: "/dashboard" },
            ].map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05, x: 4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveMenu(item.id);
                  if (item.path) navigate(item.path);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeMenu === item.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/50"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon size={20} />
                <span className="hidden lg:block">{item.label}</span>
              </motion.button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 ml-20 lg:ml-64">
          <div className="p-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Комнаты</h2>
                <p className="text-gray-400">Выберите комнату или создайте новую</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:flex-initial">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск комнат..."
                    className="w-full lg:w-64 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-600/50 hover:shadow-blue-600/70 transition-all"
                >
                  <Plus size={20} />
                  <span>Создать комнату</span>
                </motion.button>
              </div>
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms
                .filter((room) => room.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="relative group cursor-pointer"
                    onClick={() => navigate(`/room/${room.id}`)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
                    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-1">{room.name}</h3>
                          {room.currentMovie && (
                            <p className="text-sm text-gray-400">{room.currentMovie}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {room.isPrivate ? (
                            <Lock size={16} className="text-gray-400" />
                          ) : (
                            <Globe size={16} className="text-gray-400" />
                          )}
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                              room.status === "live"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {room.status === "live" ? <Play size={12} /> : <Pause size={12} />}
                            {room.status === "live" ? "Live" : "Paused"}
                          </div>
                        </div>
                      </div>

                      {/* Participants */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex -space-x-2">
                          {room.participants.slice(0, 3).map((participant) => (
                            <img
                              key={participant.id}
                              src={participant.avatar}
                              alt={participant.name}
                              className="w-8 h-8 rounded-full border-2 border-[#0f0f1e]"
                            />
                          ))}
                          {room.participants.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#0f0f1e] flex items-center justify-center text-xs text-gray-400">
                              +{room.participants.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Users size={16} />
                          <span>{room.participants.length}</span>
                        </div>
                      </div>

                      {/* Join Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2 rounded-xl font-semibold transition-all"
                      >
                        Войти в комнату
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal show={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}

function CreateRoomModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [roomName, setRoomName] = useState("");
  const navigate = useNavigate();

  const handleCreate = () => {
    if (roomName.trim()) {
      navigate(`/room/${encodeURIComponent(roomName)}`);
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && roomName.trim()) {
      handleCreate();
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          ></motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Создать комнату</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Название комнаты</label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Введите название..."
                    autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  disabled={!roomName.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-blue-600/50 hover:shadow-blue-600/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Создать комнату
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
