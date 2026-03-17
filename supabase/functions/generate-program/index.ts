import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user from the JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user from the token
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token invalide" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Fetch latest force evaluation
    const { data: forceEval, error: forceErr } = await supabase
      .from("force_evaluations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (forceErr) {
      throw new Error(`Erreur force_evaluations: ${forceErr.message}`);
    }

    // Fetch latest mobility evaluation
    const { data: mobilityEval, error: mobilityErr } = await supabase
      .from("mobility_evaluations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (mobilityErr) {
      throw new Error(`Erreur mobility_evaluations: ${mobilityErr.message}`);
    }

    if (!forceEval && !mobilityEval) {
      return new Response(
        JSON.stringify({
          error: "Aucune évaluation trouvée. Complétez d'abord les diagnostics Force et Mobilité.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ──────────────────────────────────────────────
    // TODO: COLLER LE CONTENU DES MARKDOWN ICI DEPUIS SUPABASE
    // Ce systemPrompt sera utilisé pour appeler un LLM afin de
    // générer un programme d'entraînement personnalisé.
    // ──────────────────────────────────────────────
    const systemPrompt = `
Tu es un coach expert en callisthénie. Génère un programme hebdomadaire de 4 séances.
Données force: ${JSON.stringify(forceEval)}
Données mobilité: ${JSON.stringify(mobilityEval)}
`;

    // For now, return a structured mock program based on evaluations
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() + 1); // Monday

    const program = {
      week_number: 1,
      theme: "Fondations & Adaptation",
      start_date: startDate.toISOString().split("T")[0],
      days: [
        {
          day: "Lundi",
          title: "Upper Push",
          phases: [
            {
              name: "Échauffement",
              exercises: [
                { name: "Circles d'épaules", sets: 2, reps: "15", rest: "30s" },
                { name: "Pompes inclinées", sets: 2, reps: "10", rest: "30s" },
              ],
            },
            {
              name: "Force Principale",
              exercises: [
                {
                  name: "Push-ups",
                  sets: 4,
                  reps: String(Math.max(5, (forceEval?.push_ups ?? 5) - 2)),
                  rest: "90s",
                },
                {
                  name: "Dips",
                  sets: 3,
                  reps: String(Math.max(3, (forceEval?.dips ?? 3) - 2)),
                  rest: "120s",
                },
              ],
            },
            {
              name: "Cool-down",
              exercises: [
                { name: "Étirement pectoraux", sets: 2, reps: "30s", rest: "—" },
              ],
            },
          ],
        },
        {
          day: "Mercredi",
          title: "Upper Pull",
          phases: [
            {
              name: "Échauffement",
              exercises: [
                { name: "Dead hangs", sets: 2, reps: "20s", rest: "30s" },
                { name: "Scapular pulls", sets: 2, reps: "8", rest: "30s" },
              ],
            },
            {
              name: "Force Principale",
              exercises: [
                {
                  name: "Pull-ups",
                  sets: 4,
                  reps: String(Math.max(2, (forceEval?.pull_ups ?? 2) - 2)),
                  rest: "120s",
                },
                { name: "Rows inversés", sets: 3, reps: "8", rest: "90s" },
              ],
            },
            {
              name: "Cool-down",
              exercises: [
                { name: "Étirement dorsaux", sets: 2, reps: "30s", rest: "—" },
              ],
            },
          ],
        },
        {
          day: "Vendredi",
          title: "Skill & Core",
          phases: [
            {
              name: "Skill Work",
              exercises: [
                { name: "Handstand au mur", sets: 5, reps: "20s", rest: "60s" },
                {
                  name: "L-Sit",
                  sets: 4,
                  reps: String(Math.max(5, (forceEval?.l_sit ?? 5)) + "s"),
                  rest: "60s",
                },
              ],
            },
            {
              name: "Force Principale",
              exercises: [
                {
                  name: "Hollow body hold",
                  sets: 4,
                  reps: String(Math.max(10, (forceEval?.hollow ?? 10)) + "s"),
                  rest: "60s",
                },
                { name: "Planche lean", sets: 3, reps: "15s", rest: "60s" },
              ],
            },
            {
              name: "Cool-down",
              exercises: [
                { name: "Mobilité poignets", sets: 2, reps: "10", rest: "—" },
              ],
            },
          ],
        },
        {
          day: "Samedi",
          title: "Mobilité & Récupération",
          phases: [
            {
              name: "Mobilité",
              exercises: [
                { name: "Routine épaules", sets: 3, reps: "10", rest: "30s" },
                { name: "Ouverture hanches", sets: 3, reps: "30s", rest: "30s" },
                { name: "Flexion thoracique", sets: 2, reps: "10", rest: "30s" },
                { name: "Étirement ischio-jambiers", sets: 2, reps: "30s", rest: "—" },
              ],
            },
          ],
        },
      ],
    };

    return new Response(JSON.stringify({ program }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message ?? "Erreur interne" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
