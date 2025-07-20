import subprocess
import json
import os
import re
from openai import OpenAI
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv  # ✅ added

# ✅ Load environment variables from .env
load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Run analyze_face.py and capture output
def run_face_analysis(image_path, undertone):
    result = subprocess.run(
        ['python', 'analyze_face.py', '--image', image_path, '--undertone', undertone],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print("Error running analyze_face.py:", result.stderr)
        return None
    try:
        return json.loads(result.stdout)
    except Exception as e:
        print("Error parsing analyze_face.py output:", e)
        return None

# 2. Build prompt for OpenAI API
def build_prompt(face_data):
    prompt = (
     f"""
Act as a professional color analyst and generate a complete seasonal color analysis report in strict JSON format. Analyze the following facial features:

- Undertone: {face_data.get('undertone','')}
- Lip color (BGR): {','.join(map(str, face_data.get('lip_rgb', [])))}
- Hair color (RGB): {','.join(map(str, face_data.get('hair_rgb', [])))}
- Skin tone (RGB): {','.join(map(str, face_data.get('skin_rgb', [])))}
- Dominant eye color: {face_data.get('dominant_eye_color','')}

Output must strictly follow this JSON structure:
{{
  "season": "[Spring|Summer|Autumn|Winter]",
  "season_description": "Detailed description of undertone and visual characteristics of the identified season.",
  "full_seasonal_color_palette_grid": [
    [{{"name": "Color Name", "hex": "#hex"}}],
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
1. The "full_seasonal_color_palette_grid" must reflect the correct season (e.g., Autumn → warm earthy tones), and must have exactly 8 rows and 5 colors per row. Each row must represent one color family from light to dark (e.g., pinks, blues, greens, etc.).
2. Use only real products with valid links from known sources (Sephora, Amazon, Nykaa, brand websites).
3. All `image_url` fields must point to real product or swatch images (no placeholders).
4. Every `hex` color must be a valid CSS-compatible hex code.
5. Return ONLY the JSON object. Do NOT include markdown, headers, text explanations, or extra notes.
6. Ensure the response is valid, parsable JSON (compatible with JSON.parse()).
"""
    )
    return prompt

# 3. Call OpenAI API and return parsed JSON
def call_openai_api(prompt):
    github_pat = os.getenv("GITHUB_PAT")  # ✅ now fetched from .env

    if not github_pat:
        raise EnvironmentError("❌ GITHUB_PAT is not set in environment variables.")

    client = OpenAI(
        base_url="https://models.github.ai/inference",
        api_key=github_pat,
    )
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
        match = re.search(r'{[\s\S]+}', raw)
        if match:
            return json.loads(match.group())
    except Exception as e:
        print("Final parse failed:", e)

    raise ValueError("OpenAI response was not valid JSON:\n" + raw)


# ✅ CLI testing (optional)
if __name__ == "__main__":
    IMAGE_PATH = input("Enter the path to your image file: ").strip()
    UNDERTONE = input("Enter undertone (Warm, Cool, Neutral): ").strip().capitalize()

    if UNDERTONE not in ["Warm", "Cool", "Neutral"]:
        print("Invalid undertone. Please enter Warm, Cool, or Neutral.")
        exit(1)

    face_data = run_face_analysis(IMAGE_PATH, UNDERTONE)
    if not face_data:
        print("Face analysis failed.")
        exit(1)

    print("Face Analysis Output:")
    print(json.dumps(face_data, indent=2))

    prompt = build_prompt(face_data)
    try:
        api_response = call_openai_api(prompt)
        print("\nParsed OpenAI API JSON:")
        print(json.dumps(api_response, indent=2))
    except Exception as e:
        print("OpenAI API response error:", e)
