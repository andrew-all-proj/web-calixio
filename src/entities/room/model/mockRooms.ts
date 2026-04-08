export interface DashboardRoom {
  id: string
  name: string
  isPrivate: boolean
  status: 'live' | 'paused'
  currentMovie?: string
  participants: Array<{
    id: string
    name: string
  }>
}

export const mockRooms: DashboardRoom[] = [
  {
    id: 'public-1',
    name: 'Вечерний киносеанс',
    isPrivate: false,
    status: 'live',
    currentMovie: 'Интерстеллар',
    participants: [
      { id: 'u1', name: 'Анна' },
      { id: 'u2', name: 'Иван' },
      { id: 'u3', name: 'Мария' }
    ]
  },
  {
    id: 'private-1',
    name: 'Марафон Marvel',
    isPrivate: true,
    status: 'paused',
    currentMovie: 'Мстители: Финал',
    participants: [
      { id: 'u4', name: 'Петр' },
      { id: 'u5', name: 'Ольга' }
    ]
  },
  {
    id: 'public-2',
    name: 'Классика кино',
    isPrivate: false,
    status: 'live',
    currentMovie: 'Крестный отец',
    participants: [
      { id: 'u6', name: 'Дмитрий' },
      { id: 'u7', name: 'Елена' },
      { id: 'u8', name: 'Сергей' },
      { id: 'u9', name: 'Наталья' }
    ]
  }
]
