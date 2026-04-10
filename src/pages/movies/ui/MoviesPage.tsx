import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Hls from 'hls.js'
import {
  Clock,
  Film,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X
} from 'lucide-react'
import { mediaApi, MediaItem, resolvePlaybackManifestURL } from '@/entities/media'
import { useAuthStore } from '@/features/auth'
import styles from './MoviesPage.module.css'

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

const formatDuration = (durationSec?: number | null) => {
  if (!durationSec || durationSec <= 0) {
    return '00:00'
  }
  const hours = Math.floor(durationSec / 3600)
  const minutes = Math.floor((durationSec % 3600) / 60)
  const seconds = durationSec % 60
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      seconds
    ).padStart(2, '0')}`
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const isDisplayableMovieStatus = (status: string) => {
  const normalized = status.trim().toLowerCase()
  return (
    normalized === 'ready' ||
    normalized === 'processing' ||
    normalized === 'failed' ||
    normalized === 'uploaded' ||
    normalized === 'uploading'
  )
}

const getStatusBadgeLabel = (status: string) => {
  const normalized = status.trim().toLowerCase()
  if (normalized === 'ready') {
    return 'Ready'
  }
  if (normalized === 'uploaded') {
    return 'Uploaded'
  }
  if (normalized === 'processing' || normalized === 'uploading') {
    return normalized === 'processing' ? 'Processing' : 'Uploading'
  }
  if (normalized === 'failed') {
    return 'Failed'
  }
  return status
}

const getStatusBadgeClassName = (status: string) => {
  const normalized = status.trim().toLowerCase()
  if (normalized === 'ready' || normalized === 'uploaded') {
    return styles.statusReady
  }
  if (normalized === 'processing' || normalized === 'uploading') {
    return styles.statusProcessing
  }
  if (normalized === 'failed') {
    return styles.statusFailed
  }
  return styles.statusProcessing
}

const detectIOS = () => {
  if (typeof window === 'undefined') {
    return false
  }

  const ua = window.navigator.userAgent || ''
  const platform = window.navigator.platform || ''
  const maxTouchPoints = window.navigator.maxTouchPoints || 0

  return /iPad|iPhone|iPod/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

const MoviesPage = () => {
  const accessToken = useAuthStore((state) => state.accessToken)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [movies, setMovies] = useState<MediaItem[]>([])
  const [isLoadingMovies, setIsLoadingMovies] = useState(false)
  const [moviesError, setMoviesError] = useState('')
  const [activeMovie, setActiveMovie] = useState<MediaItem | null>(null)
  const [movieToDelete, setMovieToDelete] = useState<MediaItem | null>(null)
  const [isDeletingMovie, setIsDeletingMovie] = useState(false)
  const [deleteMovieError, setDeleteMovieError] = useState('')
  const [completingMovieId, setCompletingMovieId] = useState<string | null>(null)
  const [completeMovieError, setCompleteMovieError] = useState('')

  const loadMovies = async () => {
    if (!accessToken) {
      setMovies([])
      return
    }
    setIsLoadingMovies(true)
    setMoviesError('')
    try {
      const data = await mediaApi.listMyMedia(accessToken)
      setMovies(data)
    } catch {
      setMoviesError('Не удалось загрузить список фильмов')
    } finally {
      setIsLoadingMovies(false)
    }
  }

  useEffect(() => {
    void loadMovies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  const filteredMovies = useMemo(
    () =>
      movies.filter((movie) =>
        isDisplayableMovieStatus(movie.status) &&
        movie.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [movies, searchQuery]
  )

  const handleConfirmDeleteMovie = async () => {
    if (!movieToDelete || isDeletingMovie) {
      return
    }
    if (!accessToken) {
      setDeleteMovieError('Нужна авторизация для удаления файла')
      return
    }

    setIsDeletingMovie(true)
    setDeleteMovieError('')
    try {
      await mediaApi.deleteMedia(accessToken, movieToDelete.id)
      setMovies((prev) => prev.filter((item) => item.id !== movieToDelete.id))
      if (activeMovie?.id === movieToDelete.id) {
        setActiveMovie(null)
      }
      setMovieToDelete(null)
    } catch {
      setDeleteMovieError('Не удалось удалить файл. Повторите попытку.')
    } finally {
      setIsDeletingMovie(false)
    }
  }

  const handleCompleteUpload = async (movie: MediaItem) => {
    if (completingMovieId) {
      return
    }
    if (!accessToken) {
      setCompleteMovieError('Нужна авторизация для завершения загрузки файла')
      return
    }

    setCompletingMovieId(movie.id)
    setCompleteMovieError('')
    try {
      const response = await mediaApi.completeUpload(accessToken, { mediaId: movie.id })

      setMovies((prev) =>
        prev.map((item) =>
          item.id === movie.id
            ? {
                ...item,
                status: response.status
              }
            : item
        )
      )

      await loadMovies()
    } catch {
      setCompleteMovieError('Не удалось завершить загрузку файла. Повторите попытку.')
    } finally {
      setCompletingMovieId(null)
    }
  }

  return (
    <>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1>Мои фильмы</h1>
          </div>

          <div className={styles.actions}>
            <div className={styles.searchWrap}>
              <Search size={18} className={styles.searchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Поиск фильмов..."
                className={`glass-input ${styles.searchInput}`}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              className={`brand-button ${styles.addButton}`}
              onClick={() => setShowUploadModal(true)}
            >
              <Plus size={18} />
              <span>Добавить фильм</span>
            </motion.button>
          </div>
        </header>

        {moviesError ? <p className={styles.error}>{moviesError}</p> : null}
        {completeMovieError ? <p className={styles.error}>{completeMovieError}</p> : null}

        {isLoadingMovies ? (
          <section className={styles.empty}>
            <Film size={56} />
            <h2>Загрузка фильмов...</h2>
          </section>
        ) : null}

        {!isLoadingMovies && filteredMovies.length ? (
          <section className={styles.grid}>
            {filteredMovies.map((movie, index) => (
              <motion.article
                key={movie.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -6 }}
                className={styles.card}
                onClick={() => setActiveMovie(movie)}
              >
                  <div className={styles.thumbWrap}>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClassName(movie.status)}`}>
                      {getStatusBadgeLabel(movie.status)}
                    </span>
                    <img
                      src={
                        movie.previewUrl ||
                        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=450&fit=crop'
                      }
                      alt={movie.title}
                      className={styles.thumb}
                    />

                    <div className={styles.playOverlay}>
                      <button
                        type="button"
                        className={styles.playButton}
                        onClick={(event) => {
                          event.stopPropagation()
                          setActiveMovie(movie)
                        }}
                      >
                        <Play size={20} />
                      </button>
                    </div>

                    <div className={styles.duration}>
                      <Clock size={12} />
                      <span>{formatDuration(movie.durationSec)}</span>
                    </div>
                  </div>

                  <div className={styles.meta}>
                    <div className={styles.metaTop}>
                      <div className={styles.metaText}>
                        <h3>{movie.title}</h3>
                        <p>
                          {(movie.mimeType?.split('/')[1] || movie.mimeType || 'video').toUpperCase()} •{' '}
                          {formatFileSize(movie.fileSizeBytes)}
                        </p>
                      </div>
                    </div>

                    <small>
                      Загружен {new Date(movie.createdAt).toLocaleDateString('ru-RU')}
                    </small>
                  </div>

                  <button
                    type="button"
                    className={styles.deleteButton}
                    onClick={(event) => {
                      event.stopPropagation()
                      setDeleteMovieError('')
                      setMovieToDelete(movie)
                    }}
                    aria-label={`Удалить фильм ${movie.title}`}
                  >
                    <Trash2 size={15} />
                  </button>

                  {['uploading', 'failed'].includes(movie.status.trim().toLowerCase()) ? (
                    <button
                      type="button"
                      className={styles.completeButton}
                      onClick={(event) => {
                        event.stopPropagation()
                        void handleCompleteUpload(movie)
                      }}
                      disabled={completingMovieId === movie.id}
                      aria-label={`Завершить загрузку фильма ${movie.title}`}
                    >
                      {completingMovieId === movie.id ? (
                        <Loader2 size={15} className={styles.spin} />
                      ) : (
                        <RefreshCw size={15} />
                      )}
                    </button>
                  ) : null}
              </motion.article>
            ))}
          </section>
        ) : !isLoadingMovies ? (
          <section className={styles.empty}>
            <Film size={56} />
            <h2>Фильмы не найдены</h2>
            <p>Попробуйте изменить параметры поиска</p>
          </section>
        ) : null}
      </main>

      <UploadMovieModal
        show={showUploadModal}
        accessToken={accessToken}
        onClose={() => setShowUploadModal(false)}
        onUploaded={() => {
          setShowUploadModal(false)
          void loadMovies()
        }}
      />

      <MoviePlayerModal
        movie={activeMovie}
        accessToken={accessToken}
        onClose={() => setActiveMovie(null)}
      />

      <DeleteMovieConfirmModal
        movie={movieToDelete}
        isDeleting={isDeletingMovie}
        error={deleteMovieError}
        onConfirm={handleConfirmDeleteMovie}
        onClose={() => {
          if (isDeletingMovie) {
            return
          }
          setDeleteMovieError('')
          setMovieToDelete(null)
        }}
      />
    </>
  )
}

interface UploadMovieModalProps {
  show: boolean
  accessToken: string | null
  onClose: () => void
  onUploaded: () => void
}

const UploadMovieModal = ({ show, accessToken, onClose, onUploaded }: UploadMovieModalProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [movieTitle, setMovieTitle] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    if (!movieTitle.trim()) {
      setMovieTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
    setUploadError('')
    setUploadProgress(0)
  }

  const handleClose = () => {
    if (isUploading) {
      return
    }
    setMovieTitle('')
    setSelectedFile(null)
    setUploadProgress(0)
    setIsUploading(false)
    setIsDragging(false)
    setUploadError('')
    onClose()
  }

  const handleUpload = async () => {
    if (!movieTitle.trim() || !selectedFile || isUploading) {
      return
    }

    if (!accessToken) {
      setUploadError('Нужна авторизация для загрузки файла')
      return
    }

    const normalizedType = selectedFile.type.trim().toLowerCase()
    if (!normalizedType.startsWith('video/')) {
      setUploadError('Поддерживаются только видеофайлы')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError('')
    try {
      const init = await mediaApi.initUpload(accessToken, {
        fileName: selectedFile.name,
        contentType: normalizedType,
        sizeBytes: selectedFile.size
      })

      await mediaApi.uploadToPresignedUrl(
        init.uploadUrl,
        selectedFile,
        normalizedType,
        (percent) => setUploadProgress(percent)
      )

      await mediaApi.completeUpload(accessToken, { mediaId: init.mediaId })

      setMovieTitle('')
      setSelectedFile(null)
      setUploadProgress(0)
      setIsUploading(false)
      setIsDragging(false)
      setUploadError('')
      onUploaded()
    } catch {
      setUploadError('Не удалось загрузить файл. Повторите попытку.')
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  return (
    <AnimatePresence>
      {show ? (
        <>
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          <motion.div
            className={styles.modalContainer}
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 18 }}
          >
            <div className={styles.modalCard}>
              <button type="button" className={styles.modalClose} onClick={handleClose}>
                <X size={22} />
              </button>

              <h2>Добавить фильм</h2>

              <div className={styles.modalContent}>
                <div>
                  <label className={styles.label} htmlFor="movie-title">
                    Название фильма
                  </label>
                  <input
                    id="movie-title"
                    type="text"
                    className={`glass-input ${styles.modalInput}`}
                    value={movieTitle}
                    onChange={(event) => setMovieTitle(event.target.value)}
                    placeholder="Введите название..."
                  />
                </div>

                <div>
                  <label className={styles.label} htmlFor="movie-file-upload">
                    Файл фильма
                  </label>
                  <div
                    className={`${styles.dropzone} ${isDragging ? styles.dragging : ''}`}
                    onDrop={(event) => {
                      event.preventDefault()
                      setIsDragging(false)
                      if (event.dataTransfer.files?.[0]) {
                        handleFileSelect(event.dataTransfer.files[0])
                      }
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                  >
                    <input
                      ref={fileInputRef}
                      id="movie-file-upload"
                      type="file"
                      hidden
                      accept=".mp4,.mkv,.avi,.mov,video/*"
                      onChange={(event) => {
                        if (event.target.files?.[0]) {
                          handleFileSelect(event.target.files[0])
                        }
                      }}
                    />
                    <label htmlFor="movie-file-upload" className={styles.dropzoneLabel}>
                      {selectedFile ? (
                        <div className={styles.selectedFile}>
                          <div className={styles.selectedFileIcon}>
                            <Film size={28} />
                          </div>
                          <p>{selectedFile.name}</p>
                          <small>{formatFileSize(selectedFile.size)}</small>

                          {isUploading ? (
                            <div className={styles.progress}>
                              <div className={styles.progressTrack}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${uploadProgress}%` }}
                                  className={styles.progressFill}
                                />
                              </div>
                              <span>
                                <Loader2 size={14} className={styles.spin} />
                                Загрузка: {uploadProgress}%
                              </span>
                            </div>
                          ) : (
                            <span className={styles.readyState}>Файл готов к загрузке</span>
                          )}
                        </div>
                      ) : (
                        <div className={styles.uploadPrompt}>
                          <Upload size={40} />
                          <p>Перетащите файл сюда или нажмите для выбора</p>
                          <small>MP4, MKV, AVI, MOV до 10GB</small>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {uploadError ? <p className={styles.modalError}>{uploadError}</p> : null}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleUpload}
                  disabled={!movieTitle.trim() || !selectedFile || isUploading}
                  className={`brand-button ${styles.modalSubmit}`}
                >
                  {isUploading ? (
                    <span className={styles.submitLoading}>
                      <Loader2 size={16} className={styles.spin} />
                      Обработка...
                    </span>
                  ) : (
                    'Добавить в библиотеку'
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

interface DeleteMovieConfirmModalProps {
  movie: MediaItem | null
  isDeleting: boolean
  error: string
  onConfirm: () => void
  onClose: () => void
}

const DeleteMovieConfirmModal = ({
  movie,
  isDeleting,
  error,
  onConfirm,
  onClose
}: DeleteMovieConfirmModalProps) => {
  return (
    <AnimatePresence>
      {movie ? (
        <>
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.modalContainer}
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 18 }}
          >
            <div className={`${styles.modalCard} ${styles.deleteModal}`}>
              <button type="button" className={styles.modalClose} onClick={onClose} disabled={isDeleting}>
                <X size={22} />
              </button>

              <h2>Удалить файл?</h2>
              <p className={styles.deleteDescription}>
                Фильм <strong>{movie.title}</strong> будет удалён без возможности восстановления.
              </p>
              {error ? <p className={styles.modalError}>{error}</p> : null}

              <div className={styles.deleteActions}>
                <button
                  type="button"
                  className={`glass-input ${styles.deleteCancel}`}
                  onClick={onClose}
                  disabled={isDeleting}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className={`brand-button ${styles.deleteConfirm}`}
                  onClick={onConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <span className={styles.submitLoading}>
                      <Loader2 size={16} className={styles.spin} />
                      Удаление...
                    </span>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Удалить
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

interface MoviePlayerModalProps {
  movie: MediaItem | null
  accessToken: string | null
  onClose: () => void
}

const MoviePlayerModal = ({ movie, accessToken, onClose }: MoviePlayerModalProps) => {
  const [playbackSrc, setPlaybackSrc] = useState('')
  const [playbackPoster, setPlaybackPoster] = useState<string | undefined>(undefined)
  const [isLoadingPlayback, setIsLoadingPlayback] = useState(false)
  const [playbackError, setPlaybackError] = useState('')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isIOS] = useState(() => detectIOS())

  useEffect(() => {
    if (!movie) {
      setPlaybackSrc('')
      setPlaybackPoster(undefined)
      setPlaybackError('')
      setIsLoadingPlayback(false)
      return
    }

    let isMounted = true
    let manifestBlobURL: string | null = null

    const loadPlayback = async () => {
      if (!accessToken) {
        if (isMounted) {
          setPlaybackError('Требуется авторизация для воспроизведения')
        }
        return
      }

      setIsLoadingPlayback(true)
      setPlaybackError('')
      setPlaybackSrc('')
      setPlaybackPoster(movie.previewUrl ?? undefined)

      try {
        const payload = await mediaApi.getPlayback(accessToken, movie.id)
        const manifestURL = resolvePlaybackManifestURL(payload.manifestUrl)

        if (isIOS && manifestURL) {
          if (isMounted) {
            setPlaybackSrc(manifestURL)
            setPlaybackPoster(payload.previewUrl ?? movie.previewUrl ?? undefined)
          }
        } else {
          const nextBlobURL = URL.createObjectURL(
            new Blob([payload.manifest], { type: 'application/vnd.apple.mpegurl' })
          )
          manifestBlobURL = nextBlobURL

          if (isMounted) {
            setPlaybackSrc(nextBlobURL)
            setPlaybackPoster(payload.previewUrl ?? movie.previewUrl ?? undefined)
          } else {
            URL.revokeObjectURL(nextBlobURL)
          }
        }
      } catch {
        if (isMounted) {
          setPlaybackSrc('')
          setPlaybackPoster(movie.previewUrl ?? undefined)
          setPlaybackError('Фильм пока недоступен для воспроизведения')
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlayback(false)
        }
      }
    }

    void loadPlayback()

    return () => {
      isMounted = false
      if (manifestBlobURL) {
        URL.revokeObjectURL(manifestBlobURL)
      }
    }
  }, [accessToken, isIOS, movie])

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      return
    }

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    if (!playbackSrc) {
      video.removeAttribute('src')
      video.load()
      return
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = playbackSrc
      return
    }

    if (Hls.isSupported()) {
      const hls = new Hls()
      hlsRef.current = hls
      hls.attachMedia(video)
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.loadSource(playbackSrc)
      })
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data?.fatal) {
          setPlaybackError('Ошибка воспроизведения HLS потока')
        }
      })
      return
    }

    setPlaybackError('Ваш браузер не поддерживает HLS воспроизведение')
  }, [playbackSrc])

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [])

  return (
    <AnimatePresence>
      {movie ? (
        <>
          <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={styles.modalContainer}
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 18 }}
          >
            <div className={`${styles.modalCard} ${styles.playerModal}`}>
              <button type="button" className={styles.modalClose} onClick={onClose}>
                <X size={22} />
              </button>
              <h2>{movie.title}</h2>
              <div className={styles.playerWrap}>
                {isLoadingPlayback ? (
                  <div className={styles.playerState}>Подготовка воспроизведения...</div>
                ) : null}
                {playbackError ? (
                  <div className={styles.playerStateError}>{playbackError}</div>
                ) : null}
                <video
                  ref={videoRef}
                  className={styles.player}
                  controls
                  preload="metadata"
                  playsInline
                  poster={playbackPoster}
                />
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

export default MoviesPage
