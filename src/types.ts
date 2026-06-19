export type Role = 'CS' | 'Comercial' | 'Tech'

export type CardType = 'Bug' | 'Inovação'
export type Severity = 'Blocker' | 'Major' | 'Minor'
export type CardStatus = 'a_fazer' | 'em_progresso' | 'concluido' | 'aprovado' | 'reprovado'
export type FeedbackType = 'aprovado' | 'reprovado'

export interface System {
  id: string
  name: string
  created_at: string
}

export interface Kanban {
  id: string
  name: string
  role: Role
  created_at: string
}

export interface Card {
  id: string
  role: Role
  title: string
  description: string
  photo_url: string | null
  system_id: string
  area: string
  type: CardType
  severity: Severity
  status: CardStatus
  parent_card_id: string | null
  kanban_id: string | null
  created_at: string
  updated_at: string
  system_name?: string
}

export interface Comment {
  id: string
  card_id: string
  role: Role
  content: string
  created_at: string
}

export interface Feedback {
  id: string
  card_id: string
  type: FeedbackType
  created_at: string
}
