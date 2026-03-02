import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TranslationRequest {
  original_text: string;
  language_pair: string;
  tone?: string;
}

interface TranslationResponse {
  original_text: string;
  translated_text: string;
  language_pair: string;
}

async function translateSubtitle(req: TranslationRequest): Promise<string> {
  const { original_text, language_pair, tone = "natural" } = req;

  const languagePairMap: Record<string, { base: string; secondary: string; rules: string }> = {
    "en-hi": {
      base: "Hindi",
      secondary: "English",
      rules:
        "Translate to Hinglish (Hindi base with English vocabulary blend). Use Hindi grammar with English words for modern/technical terms, pop culture, and idioms. Sound like a modern Indian speaker.",
    },
    "en-es": {
      base: "Spanish",
      secondary: "English",
      rules:
        "Translate to Spanglish (Spanish base with English vocabulary blend). Use Spanish grammar with English words for modern terms and idioms. Sound natural like a bilingual Hispanic speaker.",
    },
    "en-tl": {
      base: "Tagalog",
      secondary: "English",
      rules:
        "Translate to Taglish (Tagalog base with English vocabulary blend). Use Tagalog structure with English words seamlessly mixed in. Sound like a modern Filipino speaker.",
    },
    "en-ja": {
      base: "Japanese",
      secondary: "English",
      rules:
        "Translate to Janglish (Japanese base with English loanwords). Use natural Japanese with English katakana transliterations. Sound like a young urban Japanese speaker.",
    },
    "en-ko": {
      base: "Korean",
      secondary: "English",
      rules:
        "Translate to Konglish (Korean base with English blend). Use Korean grammar with English loanwords naturally integrated. Sound like a modern Korean speaker.",
    },
  };

  const config = languagePairMap[language_pair] || languagePairMap["en-hi"];

  const prompt = `You are an expert ${config.base}-${config.secondary} bilingual translator specializing in natural, culturally authentic code-switching.

${config.rules}

Tone: ${tone}

RULES FOR TRANSLATION:
1. Use ${config.base} grammar, verbs, prepositions, and sentence structure
2. Use ${config.secondary} for modern slang, technical terms, pop-culture references, and common idioms
3. Preserve all formatting tags (like <i>, <b>, or [Speaker:])
4. Do NOT translate word-for-word; sound natural and conversational
5. Keep dialogue concise for subtitle display
6. Maintain emotional tone and context

SUBTITLE TEXT TO TRANSLATE:
${original_text}

Respond ONLY with the translated text. No explanations, no quotes, no metadata. Just the pure translated subtitle.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY") || "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const translated =
      data.content[0].type === "text" ? data.content[0].text.trim() : "";

    return translated;
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Translation failed: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: TranslationRequest = await req.json();
    const { original_text, language_pair, tone } = body;

    if (!original_text || !language_pair) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: original_text, language_pair" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const translated_text = await translateSubtitle({
      original_text,
      language_pair,
      tone,
    });

    const response: TranslationResponse = {
      original_text,
      translated_text,
      language_pair,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Request error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});