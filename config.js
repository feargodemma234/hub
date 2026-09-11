// MarketHub Supabase configuration

// Use only your publishable/anon key here.
// NEVER put a service_role/secret key in this file.

const SUPABASE_URL =
  "https://daytlsstxtbmkoleraxw.supabase.co";

const SUPABASE_ANON_KEY =
  "sb_publishable__hLbefb_3D8AgORL2AVG9w_r22Z4W6f";

let supabaseClient = null;
let supabaseConfigError = "";

try {

  if (!window.supabase) {

    supabaseConfigError =
      "Supabase library failed to load.";

  } else {

    supabaseClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      );

  }

} catch (error) {

  supabaseConfigError =
    error?.message ||
    "Supabase initialization failed.";

}