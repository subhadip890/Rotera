/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOROBAN_CONTRACT_ID: string;
  readonly VITE_SOROBAN_RPC_URL: string;
  readonly VITE_SOROBAN_NETWORK_PASSPHRASE: string;
  readonly VITE_POSTHOG_KEY: string;
  readonly VITE_POSTHOG_HOST: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
