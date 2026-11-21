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
  /** km/h; 0 = not spreading. Added by supabase/05_simulation.sql. */
  spread_kmh: number;
  /** Set while "Simulate" is running (server time). */
  sim_started_at: string | null;
  /** Radius before the first Simulate; "Reset demo" puts it back (06_demo_reset.sql). */
  sim_base_radius_km: number | null;
  /** Made by a demo button; only these are deleted by "Reset demo". */
  created_by_demo: boolean;
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
  /** Made by "Add NGO" on a disaster row; deleted by "Reset demo". */
  created_by_demo: boolean;
};

/** One row of list_admins(): an admin, or a pending invite (user_id null). */
export type AdminEntry = {
  user_id: string | null;
  email: string;
  added_at: string;
  is_you: boolean;
  pending: boolean;
};

// sim_started_at is only changed through start_simulation / stop_simulation.
type Server = 'id' | 'created_at' | 'updated_at' | 'sim_started_at';
// Columns with a database default can be left out when adding a row.
type WithDefault = 'is_demo' | 'source' | 'created_by_demo' | 'sim_base_radius_km';
type Insert<T> = Omit<T, Server | WithDefault> & Partial<Pick<T, WithDefault & keyof T>>;

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
      // supabase/05_simulation.sql
      start_simulation: { Args: { p_id: string }; Returns: 'started' | 'already' };
      stop_simulation: { Args: { p_id: string }; Returns: 'stopped' | 'not_running' };
      // supabase/06_demo_reset.sql
      reset_demo: {
        Args: Record<string, never>;
        Returns: { simulations_stopped: number; radii_restored: number; ngos_deleted: number; disasters_deleted: number };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
