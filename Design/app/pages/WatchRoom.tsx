import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  SkipBack,
  SkipForward,
  MessageCircle,
  Users,
  VideoIcon,
  Send,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ArrowLeft,
  Film,
  Monitor,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";

type RoomMode = "movie" | "conference";

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
}

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isSpeaking: boolean;
  micEnabled: boolean;
  cameraEnabled: boolean;
  volume: number;
  audioLevel: number;
}

interface Movie {
  id: string;
  title: string;
  thumbnail: string;
}

const mockParticipants: Participant[] = [
  {
    id: "1",
    name: "Анна (Вы)",
    avatar: "https://i.pravatar.cc/150?img=1",
    isHost: true,
    isSpeaking: false,
    micEnabled: true,
    cameraEnabled: true,
    volume: 100,
    audioLevel: 0,
  },
  {
    id: "2",
    name: "Иван",
    avatar: "https://i.pravatar.cc/150?img=2",
    isHost: false,
    isSpeaking: false,
    micEnabled: true,
    cameraEnabled: false,
    volume: 100,
    audioLevel: 45,
  },
  {
    id: "3",
    name: "Мария",
    avatar: "https://i.pravatar.cc/150?img=3",
    isHost: false,
    isSpeaking: true,
    micEnabled: true,
    cameraEnabled: true,
    volume: 100,
    audioLevel: 85,
  },
];

const mockMessages: Message[] = [
  {
    id: "1",
    userId: "2",
    userName: "Иван",
    text: "Привет! Готовы начать?",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: "2",
    userId: "3",
    userName: "Мария",
    text: "Да, давайте!",
    timestamp: new Date(Date.now() - 240000),
  },
];

const mockMovies: Movie[] = [
  {
    id: "1",
    title: "Интерстеллар",
    thumbnail: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=225&fit=crop",
  },
  {
    id: "2",
    title: "Мстители: Финал",
    thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=225&fit=crop",
  },
  {
    id: "3",
    title: "Крёстный отец",
    thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&h=225&fit=crop",
  },
];

export function WatchRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [roomMode, setRoomMode] = useState<RoomMode>("conference");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(7200);
  const [showControls, setShowControls] = useState(true);
  const [activeTab, setActiveTab] = useState<"chat" | "participants" | "video">("chat");
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [micSensitivity, setMicSensitivity] = useState(50);
  const [masterVolume, setMasterVolume] = useState(100);
  const controlsTimeoutRef = useRef<number>();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => Math.min(prev + 1, duration));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, duration]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        {
          id: Date.now().toString(),
          userId: "1",
          userName: "Анна",
          text: newMessage,
          timestamp: new Date(),
        },
      ]);
      setNewMessage("");
    }
  };

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
    setRoomMode("movie");
    setShowModeSelect(false);
  };

  const switchToConference = () => {
    setRoomMode("conference");
    setIsPlaying(false);
    setSelectedMovie(null);
  };

  const handleParticipantVolumeChange = (participantId: string, newVolume: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, volume: newVolume } : p))
    );
  };

  // Simulate audio levels
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants((prev) =>
        prev.map((p) => ({
          ...p,
          audioLevel: p.micEnabled && Math.random() > 0.5 ? Math.random() * 100 : 0,
          isSpeaking: p.micEnabled && Math.random() > 0.7,
        }))
      );
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1e] to-[#1a1a2e] flex flex-col">
      {/* Top Bar */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/dashboard")}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowLeft size={isMobile ? 20 : 24} />
            </motion.button>
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-xl font-semibold text-white truncate">
                {decodeURIComponent(roomId || "Комната")}
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 truncate">
                {roomMode === "movie" && selectedMovie
                  ? `${selectedMovie.title} • ${participants.length} участников`
                  : `Конференция • ${participants.length} участников`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            {/* Mode Switch Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowModeSelect(true)}
              className="p-2 sm:p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all hidden sm:flex"
            >
              {roomMode === "movie" ? <Film size={20} /> : <Monitor size={20} />}
            </motion.button>

            {/* Settings Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(true)}
              className="p-2 sm:p-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
            >
              <Settings size={isMobile ? 16 : 20} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMicEnabled(!micEnabled)}
              className={`p-2 sm:p-3 rounded-xl transition-all ${
                micEnabled
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              }`}
            >
              {micEnabled ? <Mic size={isMobile ? 16 : 20} /> : <MicOff size={isMobile ? 16 : 20} />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCameraEnabled(!cameraEnabled)}
              className={`p-2 sm:p-3 rounded-xl transition-all ${
                cameraEnabled
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
              }`}
            >
              {cameraEnabled ? <Video size={isMobile ? 16 : 20} /> : <VideoOff size={isMobile ? 16 : 20} />}
            </motion.button>

            {isMobile && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <Menu size={16} />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Content Area */}
        <div className="flex-1 relative" onMouseMove={handleMouseMove}>
          {roomMode === "movie" && selectedMovie ? (
            /* Movie Mode */
            <div className="w-full h-full bg-black flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black"></div>

              <AnimatePresence>
                {!isPlaying && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setIsPlaying(true)}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                    >
                      <Play size={isMobile ? 24 : 32} className="ml-1" />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showControls && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 sm:p-6"
                  >
                    <div className="mb-2 sm:mb-4">
                      <div className="relative h-1 bg-white/20 rounded-full cursor-pointer group">
                        <div
                          className="absolute h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all"
                          style={{ width: `${(currentTime / duration) * 100}%` }}
                        ></div>
                        <input
                          type="range"
                          min="0"
                          max={duration}
                          value={currentTime}
                          onChange={(e) => setCurrentTime(parseInt(e.target.value))}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between mt-1 sm:mt-2 text-xs text-gray-400">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="text-white hover:text-blue-400 transition-colors"
                        >
                          {isPlaying ? <Pause size={isMobile ? 24 : 32} /> : <Play size={isMobile ? 24 : 32} />}
                        </motion.button>

                        {!isMobile && (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
                              className="text-white hover:text-blue-400 transition-colors"
                            >
                              <SkipBack size={20} />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
                              className="text-white hover:text-blue-400 transition-colors"
                            >
                              <SkipForward size={20} />
                            </motion.button>
                          </>
                        )}

                        <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setIsMuted(!isMuted)}
                            className="text-white hover:text-blue-400 transition-colors"
                          >
                            {isMuted || volume === 0 ? (
                              <VolumeX size={isMobile ? 20 : 24} />
                            ) : (
                              <Volume2 size={isMobile ? 20 : 24} />
                            )}
                          </motion.button>
                          {!isMobile && (
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={isMuted ? 0 : volume}
                              onChange={(e) => {
                                setVolume(parseInt(e.target.value));
                                setIsMuted(false);
                              }}
                              className="w-16 sm:w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                            />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4">
                        {!isMobile && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="text-white hover:text-blue-400 transition-colors"
                          >
                            <Settings size={20} />
                          </motion.button>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-white hover:text-blue-400 transition-colors"
                        >
                          <Maximize size={isMobile ? 20 : 24} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Conference Mode */
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black p-2 sm:p-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 h-full">
                {participants
                  .filter((p) => p.cameraEnabled)
                  .map((participant) => (
                    <ParticipantCard
                      key={participant.id}
                      participant={participant}
                      isMobile={isMobile}
                      onVolumeChange={(volume) => handleParticipantVolumeChange(participant.id, volume)}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || !isMobile) && (
            <motion.div
              initial={isMobile ? { x: "100%" } : false}
              animate={{ x: 0 }}
              exit={isMobile ? { x: "100%" } : {}}
              className={`${
                isMobile ? "fixed inset-y-0 right-0 z-50" : "relative"
              } w-full sm:w-80 lg:w-96 bg-white/5 backdrop-blur-xl border-l border-white/10 flex flex-col`}
            >
              {isMobile && (
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                  <h3 className="text-white font-semibold">Панель</h3>
                  <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
                    <X size={24} />
                  </button>
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-white/10">
                {[
                  { id: "chat" as const, icon: MessageCircle, label: "Чат" },
                  { id: "participants" as const, icon: Users, label: "Участники" },
                  { id: "video" as const, icon: VideoIcon, label: "Видео" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 transition-all text-sm sm:text-base ${
                      activeTab === tab.id
                        ? "text-white border-b-2 border-blue-500"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <tab.icon size={isMobile ? 16 : 20} />
                    <span className={isMobile ? "text-xs" : ""}>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === "chat" && (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex flex-col ${
                            message.userId === "1" ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 ${
                              message.userId === "1"
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                : "bg-white/10 text-white"
                            }`}
                          >
                            <p className="text-xs opacity-70 mb-1">{message.userName}</p>
                            <p className="text-sm sm:text-base">{message.text}</p>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {message.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-white/10">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Написать сообщение..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="submit"
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 sm:p-3 rounded-xl hover:shadow-lg hover:shadow-blue-600/50 transition-all"
                        >
                          <Send size={isMobile ? 16 : 20} />
                        </motion.button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === "participants" && (
                  <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto h-full">
                    {participants.map((participant) => (
                      <ParticipantListItem
                        key={participant.id}
                        participant={participant}
                        isMobile={isMobile}
                        onVolumeChange={(volume) => handleParticipantVolumeChange(participant.id, volume)}
                      />
                    ))}
                  </div>
                )}

                {activeTab === "video" && (
                  <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto h-full">
                    {participants
                      .filter((p) => p.cameraEnabled)
                      .map((participant) => (
                        <ParticipantVideoCard
                          key={participant.id}
                          participant={participant}
                          isMobile={isMobile}
                          onVolumeChange={(volume) => handleParticipantVolumeChange(participant.id, volume)}
                        />
                      ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mode Selection Modal */}
      <ModeSelectModal
        show={showModeSelect}
        onClose={() => setShowModeSelect(false)}
        currentMode={roomMode}
        onSelectConference={switchToConference}
        onSelectMovie={handleSelectMovie}
        movies={mockMovies}
      />

      {/* Settings Modal */}
      <SettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        micSensitivity={micSensitivity}
        onMicSensitivityChange={setMicSensitivity}
        masterVolume={masterVolume}
        onMasterVolumeChange={setMasterVolume}
      />
    </div>
  );
}

function ModeSelectModal({
  show,
  onClose,
  currentMode,
  onSelectConference,
  onSelectMovie,
  movies,
}: {
  show: boolean;
  onClose: () => void;
  currentMode: RoomMode;
  onSelectConference: () => void;
  onSelectMovie: (movie: Movie) => void;
  movies: Movie[];
}) {
  const [showMovieList, setShowMovieList] = useState(false);

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
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
                {showMovieList ? "Выберите фильм" : "Выберите режим"}
              </h2>

              {!showMovieList ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onSelectConference();
                      onClose();
                    }}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      currentMode === "conference"
                        ? "border-blue-500 bg-gradient-to-br from-blue-600/20 to-purple-600/20"
                        : "border-white/20 bg-white/5 hover:border-white/40"
                    }`}
                  >
                    <Monitor size={48} className="text-white mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Конференция</h3>
                    <p className="text-sm text-gray-400">Общение без просмотра фильма</p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowMovieList(true)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      currentMode === "movie"
                        ? "border-blue-500 bg-gradient-to-br from-blue-600/20 to-purple-600/20"
                        : "border-white/20 bg-white/5 hover:border-white/40"
                    }`}
                  >
                    <Film size={48} className="text-white mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Просмотр фильма</h3>
                    <p className="text-sm text-gray-400">Совместный просмотр</p>
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowMovieList(false)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
                  >
                    <ChevronLeft size={20} />
                    <span>Назад</span>
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {movies.map((movie) => (
                      <motion.button
                        key={movie.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectMovie(movie)}
                        className="group relative rounded-xl overflow-hidden bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/50 transition-all"
                      >
                        <img
                          src={movie.thumbnail}
                          alt={movie.title}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="p-4">
                          <p className="text-white font-semibold">{movie.title}</p>
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play size={48} className="text-white" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Participant Card Component for Conference Mode
function ParticipantCard({
  participant,
  isMobile,
  onVolumeChange,
}: {
  participant: Participant;
  isMobile: boolean;
  onVolumeChange: (volume: number) => void;
}) {
  const [showVolumeControl, setShowVolumeControl] = useState(false);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => !isMobile && setShowVolumeControl(true)}
      onHoverEnd={() => !isMobile && setShowVolumeControl(false)}
      className={`relative rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 group ${
        participant.isSpeaking ? "ring-2 ring-green-500" : ""
      }`}
    >
      <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />

      {/* Bottom Info */}
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-lg">
        <p className="text-white text-xs sm:text-sm font-medium">{participant.name}</p>
      </div>

      {/* Speaking Indicator */}
      {participant.isSpeaking && (
        <div className="absolute top-2 right-2 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
      )}

      {/* Mic Status */}
      <div className="absolute top-2 left-2 flex gap-1">
        {!participant.micEnabled ? (
          <div className="p-1 sm:p-1.5 bg-red-500/80 rounded-full">
            <MicOff size={isMobile ? 10 : 12} className="text-white" />
          </div>
        ) : (
          participant.audioLevel > 0 && (
            <div className="flex items-end gap-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-1 rounded-lg">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-green-500 rounded-full transition-all"
                  style={{
                    height: `${Math.min(12, (participant.audioLevel / 100) * 16 * (i + 1) * 0.5)}px`,
                  }}
                ></div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Volume Control Overlay */}
      <AnimatePresence>
        {(showVolumeControl || isMobile) && participant.id !== "1" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Volume2 size={isMobile ? 20 : 24} className="text-white" />
            <input
              type="range"
              min="0"
              max="100"
              value={participant.volume}
              onChange={(e) => onVolumeChange(parseInt(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              className="w-24 sm:w-32 h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${participant.volume}%, rgba(255,255,255,0.2) ${participant.volume}%, rgba(255,255,255,0.2) 100%)`,
              }}
            />
            <span className="text-white text-sm font-semibold">{participant.volume}%</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Participant List Item for Sidebar
function ParticipantListItem({
  participant,
  isMobile,
  onVolumeChange,
}: {
  participant: Participant;
  isMobile: boolean;
  onVolumeChange: (volume: number) => void;
}) {
  const [showVolume, setShowVolume] = useState(false);

  return (
    <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl bg-white/5 hover:bg-white/10 transition-all">
      <div className="flex items-center gap-3 p-2 sm:p-3">
        <div className="relative flex-shrink-0">
          <img
            src={participant.avatar}
            alt={participant.name}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
          />
          {participant.isHost && (
            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full border-2 border-[#0f0f1e]"></div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-medium text-sm sm:text-base truncate">{participant.name}</p>
          <p className="text-xs text-gray-400">{participant.isHost ? "Хост" : "Участник"}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Audio Level Indicator */}
          {participant.micEnabled && participant.audioLevel > 0 && (
            <div className="flex items-end gap-0.5 h-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-green-500 rounded-full transition-all"
                  style={{
                    height: `${Math.min(16, (participant.audioLevel / 100) * 20 * (i + 1) * 0.4)}px`,
                  }}
                ></div>
              ))}
            </div>
          )}

          <div
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
              participant.micEnabled ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <div
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
              participant.cameraEnabled ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>

          {participant.id !== "1" && (
            <button
              onClick={() => setShowVolume(!showVolume)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Volume2 size={isMobile ? 14 : 16} className="text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Volume Control */}
      <AnimatePresence>
        {showVolume && participant.id !== "1" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10"
          >
            <div className="p-3 flex items-center gap-3">
              <Volume2 size={16} className="text-gray-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={participant.volume}
                onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
              <span className="text-xs text-gray-400 w-10 text-right">{participant.volume}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Participant Video Card for Video Tab
function ParticipantVideoCard({
  participant,
  isMobile,
  onVolumeChange,
}: {
  participant: Participant;
  isMobile: boolean;
  onVolumeChange: (volume: number) => void;
}) {
  const [showVolume, setShowVolume] = useState(false);

  return (
    <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl overflow-hidden bg-white/5">
      <div
        className={`relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 ${
          participant.isSpeaking ? "ring-2 ring-green-500" : ""
        }`}
      >
        <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />

        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-lg">
          <p className="text-white text-xs sm:text-sm">{participant.name}</p>
        </div>

        {participant.isSpeaking && (
          <div className="absolute top-2 right-2 w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
        )}

        {/* Audio Level */}
        {participant.micEnabled && participant.audioLevel > 0 && (
          <div className="absolute top-2 left-2 flex items-end gap-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-1 rounded-lg">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-green-500 rounded-full transition-all"
                style={{
                  height: `${Math.min(12, (participant.audioLevel / 100) * 16 * (i + 1) * 0.5)}px`,
                }}
              ></div>
            ))}
          </div>
        )}
      </div>

      {participant.id !== "1" && (
        <div className="p-2 border-t border-white/10">
          <button
            onClick={() => setShowVolume(!showVolume)}
            className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Volume2 size={14} className="text-gray-400" />
              <span className="text-xs text-gray-400">Громкость</span>
            </div>
            <span className="text-xs text-white">{participant.volume}%</span>
          </button>

          <AnimatePresence>
            {showVolume && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={participant.volume}
                    onChange={(e) => onVolumeChange(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

// Settings Modal
function SettingsModal({
  show,
  onClose,
  micSensitivity,
  onMicSensitivityChange,
  masterVolume,
  onMasterVolumeChange,
}: {
  show: boolean;
  onClose: () => void;
  micSensitivity: number;
  onMicSensitivityChange: (value: number) => void;
  masterVolume: number;
  onMasterVolumeChange: (value: number) => void;
}) {
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

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Настройки аудио</h2>

              <div className="space-y-6">
                {/* Mic Sensitivity */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-gray-300 flex items-center gap-2">
                      <Mic size={16} />
                      Чувствительность микрофона
                    </label>
                    <span className="text-sm text-white font-semibold">{micSensitivity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={micSensitivity}
                    onChange={(e) => onMicSensitivityChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-600 [&::-webkit-slider-thumb]:to-purple-600"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-500">Низкая</span>
                    <span className="text-xs text-gray-500">Высокая</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Регулирует порог активации микрофона для определения речи
                  </p>
                </div>

                {/* Master Volume */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm text-gray-300 flex items-center gap-2">
                      <Volume2 size={16} />
                      Общая громкость
                    </label>
                    <span className="text-sm text-white font-semibold">{masterVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={masterVolume}
                    onChange={(e) => onMasterVolumeChange(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-600 [&::-webkit-slider-thumb]:to-purple-600"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-500">Тихо</span>
                    <span className="text-xs text-gray-500">Громко</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Общий уровень громкости для всех участников
                  </p>
                </div>

                {/* Visual Indicators */}
                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-white">Индикаторы</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-end gap-0.5 h-5">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-green-500 rounded-full"
                          style={{ height: `${4 * (i + 1)}px` }}
                        ></div>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">Уровень звука</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-gray-400">Активный говорящий</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-600/50 hover:shadow-blue-600/70 transition-all"
                >
                  Готово
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
