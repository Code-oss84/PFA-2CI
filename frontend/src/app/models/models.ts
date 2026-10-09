// ============================================
// Interfaces TypeScript pour les objets métier
// Reflètent la structure des tables PostgreSQL
// ============================================

// Modèle User
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  picture?: string;
  created_at?: string;
}

// Modèle Avatar
export interface Avatar {
  id: number;
  user_id: number;
  name: string;
  source_image: string;
  video_url?: string;
  status: 'pending' | 'processing' | 'ready' | 'error';
  created_at?: string;
}

// Modèle Course
export interface Course {
  id: number;
  title: string;
  description?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  image_url?: string;
  lesson_count?: number;
  progress?: number;
  created_at?: string;
}

// Modèle Lesson
export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  content?: string;
  video_url?: string;
  order_index: number;
}

// Modèle Conversation
export interface Conversation {
  id: number;
  user_id: number;
  avatar_id?: number;
  title?: string;
  message_count?: number;
  created_at?: string;
}

// Modèle Message
export interface Message {
  id: number;
  conversation_id: number;
  sender: 'user' | 'avatar';
  content: string;
  media_url?: string;
  created_at?: string;
}
