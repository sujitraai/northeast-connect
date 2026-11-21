// Row types for the Supabase tables (see supabase/01_schema.sql).
// Keep in sync with the SQL when columns change.

export type DisasterType = 'flood' | 'landslide' | 'earthquake' | 'other';
export type Severity = 'low' | 'moderate' | 'high' | 'severe';
export type RiskZoneType = 'flood' | 'landslide';
export type RiskLevel = 'moderate' | 'high';
export type ContactCategory =
  | 'emergency'
  | 'police'
  | 'ambulance'
  | 'fire'
  | 'control_room'
  | 'hospital';
export type ShelterType = 'relief_camp' | 'hospital' | 'shelter';

/** Columns every data table has. `is_demo` rows must be labelled "Demo data". */
type Common = {
  id: string;
  is_demo: boolean;
  source: string | null;
  created_at: string;
  updated_at: string;
};

export type Disaster = Common & {
  type: DisasterType;
  severity: Severity;
  title: string;
  description: string | null;
  district: string | null;
  state: string | null;
  lat: number;
  lng: number;
  radius_km: number;
  active: boolean;
};

export type RiskZone = Common & {
  name: string;
  type: RiskZoneType;
  level: RiskLevel;
  district: string | null;
  state: string | null;
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
  description: string | null;
};

export type Contact = Common & {
  name: string;
  phone: string;
  category: ContactCategory;
  district: string | null; // null = works everywhere
  state: string | null;
};

export type Shelter = Common & {
  name: string;
  type: ShelterType;
  lat: number;
  lng: number;
  capacity: number | null;
  district: string | null;
  state: string | null;
  phone: string | null;
};

export type Ngo = Common & {
  name: string;
  phone: string | null;
  focus: string | null;
  lat: number | null;
  lng: number | null;
  disaster_id: string | null;
  active: boolean;
};

/** One row of list_admins(): an admin, or a pending invite (user_id null). */
export type AdminEntry = {
  user_id: string | null;
  email: string;
  added_at: string;
  is_you: boolean;
  pending: boolean;
};

type Server = 'id' | 'created_at' | 'updated_at';
type Insert<T> = Omit<T, Server | 'is_demo' | 'source'> &
  Partial<Pick<Common, 'is_demo' | 'source'>>;

type Table<T> = {
  Row: T;
  Insert: Insert<T>;
  Update: Partial<Insert<T>>;
  Relationships: [];
};

/** Shape expected by createClient<Database>() for typed queries. */
export type Database = {
  public: {
    Tables: {
      disasters: Table<Disaster>;
      risk_zones: Table<RiskZone>;
      contacts: Table<Contact>;
      shelters: Table<Shelter>;
      ngos: Table<Ngo>;
      admins: {
        Row: { user_id: string; created_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      // supabase/04_admin_tools.sql
      list_admins: { Args: Record<string, never>; Returns: AdminEntry[] };
      add_admin: { Args: { p_email: string }; Returns: 'added' | 'already' | 'invited' };
      remove_admin: { Args: { p_email: string }; Returns: 'removed' | 'not_found' };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
