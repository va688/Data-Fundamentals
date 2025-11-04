import { serve } from "https://deno.land/std/http/server.ts";

const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("", { headers: cors() });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  if (!GEMINI_KEY) return json({ error: "Missing GEMINI_API_KEY" }, 500);

  try {
    const { courses = [], timetable = [], tasks = [], school } = await req.json();

    const prompt = `
You are StudyPal's planner. Return a JSON schedule array with entries:
{ title, start, duration_minutes, notes }.
Constraints:
- Use upcoming lectures (day/time) as anchors.
- Prioritize tasks by nearest due date; include prep blocks before deadlines.
- Space blocks in 25–50min lengths with short breaks.
Inputs:
Courses: ${JSON.stringify(courses)}
Timetable: ${JSON.stringify(timetable)}
Tasks: ${JSON.stringify(tasks)}
School: ${school ?? ""}
Return ONLY JSON: { "schedule": [ ... ] }`;

async function callGemini(prompt: string) {
      const makeReq = (ver: 'v1'|'v1beta', model: string) => fetch(`https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      });

      let resp = await makeReq('v1','gemini-1.5-flash-latest');
      if (resp.status === 404) resp = await makeReq('v1','gemini-1.5-flash');
      if (resp.status === 404) resp = await makeReq('v1beta','gemini-1.5-flash-latest');
      if (resp.status === 404) resp = await makeReq('v1beta','gemini-1.5-flash');
      if (!resp.ok) {
        let body = '';
        try { body = await resp.text(); } catch {}
        return { err: `Gemini HTTP ${resp.status}${body ? ` - ${body}` : ''}` } as const;
      }
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ?? "";
      try {
        const match = text.match(/\{[\s\S]*\}$/);
        const parsed = match ? JSON.parse(match[0]) : { schedule: [] };
        return { ok: parsed } as const;
      } catch (e) {
        return { err: `Parse error: ${e}` } as const;
      }
    }

    const out = await callGemini(prompt);
    if ('err' in out) return json({ error: out.err }, 500);
    return json(out.ok);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
}, { onListen: () => {} });

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization",
  };
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...cors() } });
}
