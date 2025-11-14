// Shared Role and Permission types

export interface Permission {
  id: number | string;
  name: string;
  content_type?: {
    app_label: string;
    model: string;
  };
  codename?: string;
  description?: string;
  category?: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Permission[];
  is_system_role: boolean;
  user_count: number;
  created_at: string;
  updated_at: string;
}

