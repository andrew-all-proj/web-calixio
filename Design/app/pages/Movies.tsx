import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Home,
  Video,
  Film,
  Settings,
  Search,
  Plus,
  Upload,
  X,
  Play,
  Clock,
  Trash2,
  MoreVertical,
  Download,
  Share2,
  Loader2,
} from "lucide-react";

interface Movie {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  uploadDate: Date;
  fileSize: string;
  format: string;
}

const mockMovies: Movie[] = [
  {
    id: "1",
    title: "Интерстеллар",
    duration: "2:49:00",
    thumbnail: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=450&fit=crop",
    uploadDate: new Date(2026, 2, 15),
    fileSize: "4.2 GB",
    format: "MP4",
  },
  {
    id: "2",
    title: "Мстители: Финал",
    duration: "3:01:00",
    thumbnail: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&h=450&fit=crop",
    uploadDate: new Date(2026, 2, 20),
    fileSize: "5.8 GB",
    format: "MKV",
  },
  {
    id: "3",
    title: "Крёстный отец",
    duration: "2:55:00",
    thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800&h=450&fit=crop",
    uploadDate: new Date(2026, 3, 1),
    fileSize: "3.9 GB",
    format: "MP4",
  },
  {
    id: "4",
    title: "Начало",
    duration: "2:28:00",
    thumbnail: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&h=450&fit=crop",
    uploadDate: new Date(2026, 3, 2),
    fileSize: "4.5 GB",
    format: "MP4",
  },
];

export function Movies() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState("movies");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [movies] = useState<Movie[]>(mockMovies);

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
                <h2 className="text-3xl font-bold text-white mb-2">Мои фильмы</h2>
                <p className="text-gray-400">Управляйте своей библиотекой фильмов</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:flex-initial">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск фильмов..."
                    className="w-full lg:w-64 bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-600/50 hover:shadow-blue-600/70 transition-all"
                >
                  <Plus size={20} />
                  <span>Добавить фильм</span>
                </motion.button>
              </div>
            </div>

            {/* Movies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {movies
                .filter((movie) => movie.title.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((movie, index) => (
                  <motion.div
                    key={movie.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="relative group cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>

                    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                      {/* Thumbnail */}
                      <div className="relative aspect-video overflow-hidden bg-gray-900">
                        <img
                          src={movie.thumbnail}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                          >
                            <Play size={24} className="ml-1" />
                          </motion.button>
                        </div>

                        {/* Duration badge */}
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                          <Clock size={12} className="text-white" />
                          <span className="text-xs text-white">{movie.duration}</span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white truncate">{movie.title}</h3>
                            <p className="text-sm text-gray-400">
                              {movie.format} • {movie.fileSize}
                            </p>
                          </div>

                          <div className="relative group/menu">
                            <button className="text-gray-400 hover:text-white transition-colors p-1">
                              <MoreVertical size={18} />
                            </button>

                            {/* Dropdown menu */}
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10">
                              <button className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-all rounded-t-xl">
                                <Share2 size={16} />
                                <span className="text-sm">Поделиться</span>
                              </button>
                              <button className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 transition-all">
                                <Download size={16} />
                                <span className="text-sm">Скачать</span>
                              </button>
                              <button className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-all rounded-b-xl">
                                <Trash2 size={16} />
                                <span className="text-sm">Удалить</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500">
                          Загружен {movie.uploadDate.toLocaleDateString("ru-RU")}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>

            {/* Empty state */}
            {movies.filter((movie) => movie.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <Film size={64} className="text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Фильмы не найдены</h3>
                <p className="text-gray-400 mb-6">Попробуйте изменить параметры поиска</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <UploadMovieModal show={showUploadModal} onClose={() => setShowUploadModal(false)} />
    </div>
  );
}

function UploadMovieModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [movieTitle, setMovieTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!movieTitle) {
      // Auto-fill title from filename
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setMovieTitle(nameWithoutExt);
    }
    setIsUploading(true);

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
      }
    }, 300);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = () => {
    // Mock upload completion
    setTimeout(() => {
      onClose();
      setMovieTitle("");
      setSelectedFile(null);
      setUploadProgress(0);
    }, 500);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
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
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-bold text-white mb-6">Добавить фильм</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Название фильма</label>
                  <input
                    type="text"
                    value={movieTitle}
                    onChange={(e) => setMovieTitle(e.target.value)}
                    placeholder="Введите название..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Файл фильма</label>
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                      isDragging
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-white/20 hover:border-blue-500/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="movie-file-upload"
                    />
                    <label htmlFor="movie-file-upload" className="cursor-pointer">
                      {selectedFile ? (
                        <div>
                          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                            <Film className="text-white" size={32} />
                          </div>
                          <p className="text-white font-semibold mb-1">{selectedFile.name}</p>
                          <p className="text-sm text-gray-400 mb-4">
                            {formatFileSize(selectedFile.size)}
                          </p>
                          {isUploading && (
                            <div className="space-y-2">
                              <div className="w-full bg-white/10 rounded-full h-2">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${uploadProgress}%` }}
                                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                                ></motion.div>
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                <Loader2 size={16} className="text-blue-400 animate-spin" />
                                <p className="text-sm text-gray-400">Загрузка: {uploadProgress}%</p>
                              </div>
                            </div>
                          )}
                          {!isUploading && (
                            <p className="text-sm text-green-400 flex items-center justify-center gap-2">
                              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                              Файл готов к загрузке
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          <Upload className="mx-auto mb-4 text-gray-400" size={40} />
                          <p className="text-white mb-1">
                            Перетащите файл сюда или нажмите для выбора
                          </p>
                          <p className="text-sm text-gray-400">MP4, MKV, AVI, MOV до 10GB</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  disabled={!movieTitle || !selectedFile || isUploading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold shadow-lg shadow-blue-600/50 hover:shadow-blue-600/70 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={20} className="animate-spin" />
                      Обработка...
                    </span>
                  ) : (
                    "Добавить в библиотеку"
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
