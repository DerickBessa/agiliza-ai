export type Role = 'Tech' | 'CS' | 'Comercial'

export type Severity = 'bug' | 'melhoria' | 'sugestao'

export type CardStatus = 'a_fazer' | 'em_progresso' | 'concluido' | 'aprovado' | 'reprovado'

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
  video_url: string | null
  system_id: string
  kanban_id: string
  area: string
  type: 'Bug' | 'Inovação'
  severity: Severity
  status: CardStatus
  resolved_by: string | null
  parent_card_id: string | null
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
  type: 'aprovado' | 'reprovado'
  created_at: string
}
