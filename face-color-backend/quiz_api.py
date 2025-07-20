import json
import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Quiz questions for seasonal color analysis
QUIZ_QUESTIONS = [
    {
        "id": "skin_tone",
        "question": "What is your natural skin tone?",
        "options": [
            "Very fair / porcelain",
            "Light", 
            "Medium / olive",
            "Tan",
            "Deep / dark"
        ],
        "type": "choice"
    },
    {
        "id": "undertone",
        "question": "What undertone does your skin have?",
        "options": [
            "Cool (pink, rosy, or blue undertones)",
            "Warm (yellow, peachy, or golden undertones)",
            "Neutral (a mix of cool and warm)",
            "Not sure"
        ],
        "type": "choice"
    },
    {
        "id": "sun_reaction",
        "question": "How does your skin react to sun exposure?",
        "options": [
            "Burns easily, rarely tans",
            "Burns at first, then tans gradually",
            "Tans easily, rarely burns",
            "Never burns, tans deeply"
        ],
        "type": "choice"
    },
    {
        "id": "vein_color",
        "question": "What color are the veins on your wrist (in natural light)?",
        "options": [
            "Blue or purple",
            "Green or olive",
            "Hard to tell / mix of both"
        ],
        "type": "choice"
    },
    {
        "id": "jewelry_preference",
        "question": "Which jewelry suits you best?",
        "options": [
            "Silver",
            "Gold",
            "Both equally"
        ],
        "type": "choice"
    },
    {
        "id": "hair_color",
        "question": "What is your natural hair color (not dyed)?",
        "options": [
            "Light blonde or platinum",
            "Golden blonde or strawberry blonde",
            "Ash blonde or light brown",
            "Medium to dark brown",
            "Red, auburn, or copper",
            "Black or very dark brown",
            "Gray or white"
        ],
        "type": "choice"
    },
    {
        "id": "hair_tone",
        "question": "What tone does your hair naturally have?",
        "options": [
            "Cool (ash, silver, bluish tones)",
            "Warm (golden, red, copper tones)",
            "Neutral or hard to tell"
        ],
        "type": "choice"
    },
    {
        "id": "eye_color",
        "question": "What is your eye color?",
        "options": [
            "Light blue, icy blue, gray",
            "Bright blue or green",
            "Warm green, hazel with gold, amber",
            "Light to medium brown",
            "Dark brown or black"
        ],
        "type": "choice"
    },
    {
        "id": "eye_contrast",
        "question": "Do your eyes look more…",
        "options": [
            "Bright, vivid, and high contrast",
            "Soft, muted, and blended with your coloring"
        ],
        "type": "choice"
    },
    {
        "id": "glow_colors",
        "question": "Which colors make your face \"glow\" or get compliments?",
        "options": [
            "Bright jewel tones (royal blue, emerald, fuchsia)",
            "Soft, cool tones (pastel pink, lavender, powder blue)",
            "Warm, earthy tones (mustard, olive, terracotta)",
            "Light, warm tones (peach, coral, golden yellow)"
        ],
        "type": "choice"
    },
    {
        "id": "washout_colors",
        "question": "Which colors wash you out or make you look tired?",
        "options": [
            "Warm tones like orange, mustard, or olive",
            "Cool tones like gray, lavender, or icy blue",
            "Bold or bright colors",
            "Pastel or muted colors"
        ],
        "type": "choice"
    },
    {
        "id": "white_preference",
        "question": "Which type of white looks better on you?",
        "options": [
            "Pure white",
            "Cream / off-white / ivory",
            "Both look fine"
        ],
        "type": "choice"
    },
    {
        "id": "color_preference",
        "question": "Which type of colors do you prefer or get complimented in?",
        "options": [
            "Bold jewel tones (sapphire, ruby, emerald)",
            "Soft pastels (baby blue, mint, rose)",
            "Muted earthy tones (rust, moss, camel)",
            "Warm and bright colors (apricot, coral, sunflower)"
        ],
        "type": "choice"
    }
]

def build_quiz_prompt(quiz_responses):
    """Build prompt for seasonal analysis based on quiz responses"""
    
    # Map quiz responses to analysis parameters
    skin_tone_mapping = {
        "Very fair / porcelain": "very fair",
        "Light": "light",
        "Medium / olive": "medium olive",
        "Tan": "tan",
        "Deep / dark": "deep dark"
    }
    
    undertone_mapping = {
        "Cool (pink, rosy, or blue undertones)": "cool",
        "Warm (yellow, peachy, or golden undertones)": "warm",
        "Neutral (a mix of cool and warm)": "neutral",
        "Not sure": "neutral"
    }
    
    hair_color_mapping = {
        "Light blonde or platinum": "light blonde",
        "Golden blonde or strawberry blonde": "golden blonde",
        "Ash blonde or light brown": "ash blonde",
        "Medium to dark brown": "medium brown",
        "Red, auburn, or copper": "red auburn",
        "Black or very dark brown": "black",
        "Gray or white": "gray white"
    }
    
    eye_color_mapping = {
        "Light blue, icy blue, gray": "light blue",
        "Bright blue or green": "bright blue green",
        "Warm green, hazel with gold, amber": "warm green hazel",
        "Light to medium brown": "light brown",
        "Dark brown or black": "dark brown"
    }
    
    prompt = f"""
Act as a professional color analyst and generate a complete seasonal color analysis report in strict JSON format. Analyze the following characteristics from a detailed quiz:

- Skin Tone: {skin_tone_mapping.get(quiz_responses.get('skin_tone', ''), 'medium')}
- Undertone: {undertone_mapping.get(quiz_responses.get('undertone', ''), 'neutral')}
- Sun Reaction: {quiz_responses.get('sun_reaction', '')}
- Vein Color: {quiz_responses.get('vein_color', '')}
- Jewelry Preference: {quiz_responses.get('jewelry_preference', '')}
- Hair Color: {hair_color_mapping.get(quiz_responses.get('hair_color', ''), 'medium brown')}
- Hair Tone: {quiz_responses.get('hair_tone', '')}
- Eye Color: {eye_color_mapping.get(quiz_responses.get('eye_color', ''), 'brown')}
- Eye Contrast: {quiz_responses.get('eye_contrast', '')}
- Glow Colors: {quiz_responses.get('glow_colors', '')}
- Washout Colors: {quiz_responses.get('washout_colors', '')}
- White Preference: {quiz_responses.get('white_preference', '')}
- Color Preference: {quiz_responses.get('color_preference', '')}

Based on these characteristics, determine the seasonal color type and generate recommendations.

Output must strictly follow this JSON structure:
{{
  "season": "[Spring|Summer|Autumn|Winter]",
  "season_description": "Detailed description of undertone and visual characteristics of the identified season.",
  "full_seasonal_color_palette_grid": [
    [{{"name": "Color Name", "hex": "#hex"}}],
    ...
  ],
  "clothing_color_recommendations": [
    {{
      "name": "Color Name",
      "hex": "#hex",
      "image_url": "https://..."
    }}
  ],
  "foundation_recommendations": [
    {{
      "brand": "Brand Name",
      "product": "Product Line",
      "shade": "Shade Name",
      "hex": "#hex",
      "image_url": "https://...",
      "buy_link": "https://..."
    }}
  ],
  "lipstick_recommendations": [
    {{
      "brand": "Brand Name",
      "product": "Product Line",
      "shade": "Shade Name",
      "hex": "#hex",
      "image_url": "https://...",
      "buy_link": "https://..."
    }}
  ],
  "blush_recommendations": [
    {{
      "brand": "Brand Name",
      "product": "Product Line",
      "shade": "Shade Name",
      "hex": "#hex",
      "image_url": "https://...",
      "buy_link": "https://..."
    }}
  ],
  "clothing_style_recommendations": {{
    "styles_to_wear": ["list of flattering clothing styles"],
    "styles_to_avoid": ["list of styles to avoid for this season"]
  }}
}}

Strict Requirements:
1. The "full_seasonal_color_palette_grid" must reflect the correct season and must have exactly 8 rows and 5 colors per row.
2. Use only real products with valid links from known sources (Sephora, Amazon, Nykaa, brand websites).
3. All `image_url` fields must point to real product or swatch images.
4. Every `hex` color must be a valid CSS-compatible hex code.
5. Return ONLY the JSON object. Do NOT include markdown, headers, text explanations, or extra notes.
6. Ensure the response is valid, parsable JSON (compatible with JSON.parse()).
"""

    return prompt

def call_openai_for_quiz(quiz_responses):
    """Call OpenAI API to analyze quiz responses and generate seasonal recommendations"""
    
    client = OpenAI(
        base_url="https://models.github.ai/inference",
        api_key=os.getenv("GITHUB_PAT"),
    )
    
    prompt = build_quiz_prompt(quiz_responses)
    
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="openai/gpt-4o",
        temperature=1,
        max_tokens=4096,
        top_p=1
    )

    raw = response.choices[0].message.content.strip()

    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.startswith("json"):
            raw = raw[len("json"):].strip()

    try:
        return json.loads(raw)
    except Exception:
        pass

    try:
        import re
        match = re.search(r'{[\s\S]+}', raw)
        if match:
            return json.loads(match.group())
    except Exception as e:
        print("Final parse failed:", e)

    raise ValueError("OpenAI response was not valid JSON:\n" + raw)

def save_quiz_results(quiz_responses, ai_result):
    """Save quiz results in the same format as image analysis"""
    
    feature_data = {
        "undertone": quiz_responses.get("undertone", "").split(" ")[0].lower(),
        "lip_rgb": [200, 120, 130],
        "hair_rgb": [60, 50, 40],
        "skin_rgb": [220, 180, 160],
        "left_eye_color": quiz_responses.get("eye_color", "").split(",")[0],
        "right_eye_color": quiz_responses.get("eye_color", "").split(",")[0],
        "dominant_eye_color": quiz_responses.get("eye_color", "").split(",")[0]
    }
    
    with open("feature_data.json", "w") as f:
        json.dump(feature_data, f, indent=2)
    
    with open("latest_recommendations.json", "w") as f:
        json.dump(ai_result, f, indent=2)
    
    return {
        "feature_extraction": feature_data,
        "api_result": ai_result
    }
