import { Role } from "@/types/types";

// formatted env variables
export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'TODO',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    route: process.env.NEXT_PUBLIC_DEFAULT_ROUTE || '',
    url_route: (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + (process.env.NEXT_PUBLIC_DEFAULT_ROUTE || ''),
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
  },
  google: {
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
  },
  openai: {
    prod_model: process.env.NEXT_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini',
    dev_model: process.env.NEXT_PUBLIC_OPENAI_DEV_MODEL || 'gpt-4o-mini',
    temperature: process.env.NEXT_PUBLIC_OPENAI_TEMPERATURE || 0.7,
  },
};

export const privateRoutes: Record<string, Role> = {
  '/api': 'USER',
  '/': 'USER',
  '/developer': 'ADMIN',
  '/developer_kevin': 'ADMIN',
};