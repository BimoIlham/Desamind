export type Report = {
  id: string;
  user_id: string;
  author_name: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in_progress' | 'completed';
  lat: number | null;
  lng: number | null;
  image_url: string | null;
  upvotes: number;
  comments_count: number;
  created_at: string;
};

export type Product = {
  id: string;
  user_id: string;
  store_id?: string | null;
  seller_name: string;
  name: string;
  description: string | null;
  price: number;
  phone_number: string | null;
  whatsapp?: string | null;
  image_url: string | null;
  category: string;
  stock?: number;
  featured?: boolean;
  sales_count?: number;
  rating?: number;
  reviews_count?: number;
  created_at?: string;
};

export type Article = {
  id: string;
  title: string;
  excerpt: string | null;
  content?: string | null;
  image_url: string | null;
  author: string;
  category: string;
  is_published?: boolean;
  created_at: string;
};

export type Comment = {
  id: string;
  report_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

export type CommunityAction = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string | null;
  date: string | null;
  time: string | null;
  max_participants: number;
  current_participants: number;
  organizer: string;
  image_url: string | null;
  status: 'open' | 'full' | 'done';
  report_id?: string | null;
  created_at: string;
};

export type EmergencyAlert = {
  id: string;
  type: 'flood' | 'fire' | 'accident' | 'medical' | 'crime';
  description: string;
  location: string | null;
  lat: number | null;
  lng: number | null;
  status: 'active' | 'handled' | 'resolved';
  reporter_name: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  title: string;
  description: string | null;
  budget: number;
  spent: number;
  progress: number;
  status: 'planning' | 'ongoing' | 'completed' | 'paused';
  category: string;
  image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  contractor: string | null;
  created_at?: string;
};

export type Job = {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string | null;
  type: 'full_time' | 'part_time' | 'freelance' | 'volunteer';
  salary_range?: string | null;
  requirements: string[] | null;
  phone_number: string | null;
  deadline: string | null;
  created_at: string;
  category: string;
  is_active?: boolean;
};

export type TrainingModule = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  level: 'Pemula' | 'Menengah' | 'Lanjutan';
  duration_minutes: number;
  image_url: string | null;
  instructor: string;
  lessons: { title: string; duration: number }[];
  enrolled: number;
  rating: number;
  is_published?: boolean;
  created_at: string;
};

export type HealthScore = {
  overall: number;
  grade: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Perlu Perhatian' | 'Kritis';
  metrics: {
    cleanliness: number;
    infrastructure: number;
    safety: number;
    health: number;
    economy: number;
    community: number;
  };
  trend: 'naik' | 'turun' | 'stabil';
  ai_narrative: string;
  last_updated: string;
  source_stats?: {
    reports: {
      total: number;
      pending: number;
      in_progress: number;
      completed: number;
    };
    projects: {
      total: number;
      average_progress: number;
    };
    community: {
      actions: number;
      participants: number;
    };
    economy: {
      active_stores: number;
      paid_orders: number;
      active_jobs: number;
    };
    emergency: {
      active: number;
      resolved: number;
    };
  };
};

export type AIPrediction = {
  id: string;
  category: string;
  risk_level: 'Tinggi' | 'Sedang' | 'Rendah';
  confidence: number;
  title: string;
  description: string;
  recommendation: string;
  icon: string;
};

export type ReportHistory = {
  id: string;
  report_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  note: string;
  changed_by: string;
  created_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  category: 'Kesehatan' | 'Pemerintahan' | 'Umum' | 'Sosial' | string;
  content: string;
  date: string;
  is_important: boolean;
};

export type GalleryItem = {
  id: string;
  title: string;
  category: 'PKK' | 'Karang Taruna' | 'Posyandu' | 'Kerja Bakti' | 'Lainnya' | string;
  date: string;
  image_url: string;
};

export type APBDesProgram = {
  name: string;
  category: string;
  budget: number;
  status: 'Selesai' | 'Berjalan' | 'Direncanakan' | string;
};

export type APBDesa = {
  year: number;
  total_budget: number;
  realized: number;
  allocations: { category: string; amount: number; color: string }[];
  programs: APBDesProgram[];
};

export type DashboardStats = {
  totalReports: number;
  pendingReports: number;
  inProgressReports: number;
  completedReports: number;
  resolutionRate: number;
  activeUMKM: number;
  totalCitizens: number;
  categoryData: { category: string; count: number }[];
  trendData: { month: string; laporan: number; selesai: number }[];
};
