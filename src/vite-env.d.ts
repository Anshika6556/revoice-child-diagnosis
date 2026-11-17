/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** 'true' to save screening protocol results to the screening_results table */
  readonly VITE_SAVE_SCREENING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
