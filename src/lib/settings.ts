import { supabase } from "./supabase";

export type UserSettings = {
  id: string;
  user_id: string;
  email_notifications: boolean;
  default_date_range: 'week' | 'month' | 'quarter' | 'year' | 'all';
  default_page_size: number;
  currency_format: string;
  date_format: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
};

export type UserSettingsInput = Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

const DEFAULT_SETTINGS: Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  email_notifications: true,
  default_date_range: 'month',
  default_page_size: 25,
  currency_format: 'USD',
  date_format: 'MM/DD/YYYY',
  timezone: 'America/New_York',
  theme: 'light',
};

function formatError(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export async function getUserSettings(userId: string) {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { data: null as UserSettings | null, error: formatError(error) };
  }

  // Return default settings if none exist
  if (!data) {
    return { 
      data: { 
        ...DEFAULT_SETTINGS,
        id: '',
        user_id: userId,
        created_at: '',
        updated_at: '',
      } as UserSettings, 
      error: null 
    };
  }

  return { data: data as UserSettings, error: null };
}

export async function upsertUserSettings(userId: string, settings: UserSettingsInput) {
  // Check if settings exist
  const { data: existing } = await supabase
    .from("user_settings")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from("user_settings")
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      return { data: null as UserSettings | null, error: formatError(error) };
    }

    return { data: data as UserSettings, error: null };
  } else {
    // Insert new
    const { data, error } = await supabase
      .from("user_settings")
      .insert({ 
        ...DEFAULT_SETTINGS,
        ...settings,
        user_id: userId,
      })
      .select("*")
      .single();

    if (error) {
      return { data: null as UserSettings | null, error: formatError(error) };
    }

    return { data: data as UserSettings, error: null };
  }
}

export const DATE_RANGE_OPTIONS = [
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'quarter', label: 'Last 90 Days' },
  { value: 'year', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
];

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];

export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'UTC', label: 'UTC' },
];
