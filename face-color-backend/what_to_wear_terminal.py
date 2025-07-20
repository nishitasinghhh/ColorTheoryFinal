import os
import json
import requests
from openai import OpenAI
from serpapi import GoogleSearch

# === Step 1: Load feature extraction data ===
FEATURE_FILE = 'feature_data.json'
if not os.path.exists(FEATURE_FILE):
    print(f"❌ Feature extraction file '{FEATURE_FILE}' not found. Please run feature extraction first.")
    exit(1)

with open(FEATURE_FILE, 'r') as f:
    feature_data = json.load(f)

print("\nLoaded feature extraction data:")
print(json.dumps(feature_data, indent=2))

proceed = input("\nProceed to answer questions for personalized recommendations? (yes/no): ").strip().lower()
if proceed != 'yes':
    print("Exiting.")
    exit(0)

# === Step 2: Ask user for additional inputs ===
def ask_input(prompt, valid=None, optional=False):
    while True:
        val = input(prompt).strip()
        if optional and val == '':
            return None
        if valid and val.lower() not in valid:
            print(f"Please enter one of: {', '.join(valid)}")
        else:
            return val

user = {}
user["gender"] = ask_input("Gender (female/male/other): ", valid=["female", "male", "other"])
user["body_type"] = ask_input("Body Type (e.g. mesomorph, ectomorph, endomorph): ")
user["mood"] = ask_input("Current Mood (e.g. Happy, Bold, Neutral, Romantic): ")
user["city"] = ask_input("City you live in: ")
user["occasion"] = ask_input("Occasion (e.g. Office, Date, Wedding, Casual Outing, Festival): ")
user["accessorize"] = ask_input("Willingness to Accessorize (Yes/No): ", valid=["yes", "no"])
user["cultural_preferences"] = ask_input("Cultural/Religious Preferences (optional, press Enter to skip): ", optional=True)
user["comfort_level"] = ask_input("Comfort Level (Light/Medium/Heavy, optional, press Enter to skip): ", valid=["light", "medium", "heavy"], optional=True)

print("\nCollected user profile:")
print(json.dumps(user, indent=2))
proceed = input("\nProceed to fetch live weather and generate recommendations? (yes/no): ").strip().lower()
if proceed != 'yes':
    print("Exiting.")
    exit(0)

# === Step 3: Fetch live weather ===
def fetch_weather(city):
    key = os.environ.get('OPENWEATHER_API_KEY')
    if not key:
        print("OPENWEATHER_API_KEY not set in environment. Using default weather.")
        return "clear", 25
    try:
        r = requests.get(
            "http://api.openweathermap.org/data/2.5/weather",
            params={"q": city, "appid": key, "units": "metric"}
        ).json()
        return r["weather"][0]["description"], r["main"]["temp"]
    except Exception as e:
        print("Weather fetch failed:", e)
        return "clear", 25

weather_desc, temp_c = fetch_weather(user["city"])
user.update({"weather_desc": weather_desc, "temp_c": temp_c})

print(f"\nWeather in {user['city']}: {weather_desc}, {temp_c}°C")
proceed = input("\nProceed to generate recommendations? (yes/no): ").strip().lower()
if proceed != 'yes':
    print("Exiting.")
    exit(0)

# === Step 4: Build prompt ===
prompt = f"""
You are a professional fashion and color stylist.
Profile:
Gender: {user["gender"]}
Body Type: {user["body_type"]}
Undertone: {feature_data.get('undertone', '-')}
Season: {feature_data.get('season', '-')}
Lip RGB: {feature_data.get('lip_rgb', '-')}
Hair RGB: {feature_data.get('hair_rgb', '-')}
Skin RGB: {feature_data.get('skin_rgb', '-')}
Eye Color: {feature_data.get('dominant_eye_color', '-')}
Mood: {user["mood"]}
City: {user["city"]}
Weather: {weather_desc}, {temp_c}°C
Occasion: {user["occasion"]}
Likes Accessories: {user["accessorize"]}
Cultural/Religious Preferences: {user.get('cultural_preferences', '-')}
Comfort Level: {user.get('comfort_level', '-')}

Recommend 3 items each of:
- Clothing
- Footwear
- Accessories (if suitable)
- Makeup products (foundation, lipstick, blush)
- Fragrance

Return as JSON array only:
[
  {{
    "category": "...",
    "product": "...",
    "description": "...",
    "query": "search keywords only for finding the product"
  }},
  ...
]
No extra commentary.
"""

# === Step 5: Get GPT Recommendation ===
openai_key = os.environ.get('GITHUB_PAT')
if not openai_key:
    print("GITHUB_PAT not set in environment. Please set it for OpenAI API access.")
    exit(1)
openai_client = OpenAI(
    base_url="https://models.github.ai/inference",
    api_key=openai_key
)

resp = openai_client.chat.completions.create(
    model="openai/gpt-4o",
    messages=[{"role": "user", "content": prompt}],
    temperature=1, max_tokens=2048
)

print("\n=== Raw Model Output ===")
raw_output = resp.choices[0].message.content.strip()
print(raw_output)
print("==========================")

# Remove triple backticks if present
if raw_output.startswith("```"):
    raw_output = raw_output.split("```")[1].strip()
    if raw_output.startswith("json"):
        raw_output = raw_output[len("json"):].strip()

try:
    items = json.loads(raw_output)
except Exception as e:
    print("❌ Error parsing GPT response:", e)
    items = []

proceed = input("\nProceed to fetch real-time shopping links? (yes/no): ").strip().lower()
if proceed != 'yes':
    print("Exiting.")
    exit(0)

# === Step 6: Get Real-Time Shopping Links ===
def fetch_link(search_query):
    key = os.environ.get('SERPAPI_KEY')
    if not key:
        print("SERPAPI_KEY not set in environment. Skipping shopping links.")
        return None
    try:
        params = {
            "q": search_query,
            "api_key": key,
            "engine": "google_shopping"
        }
        search = GoogleSearch(params)
        result = search.get_dict()
        if "shopping_results" in result:
            item = result["shopping_results"][0]
            return {
                "title": item.get("title"),
                "price": item.get("price"),
                "url": item.get("link"),
                "image": item.get("thumbnail")
            }
        else:
            print(f"🕵️ No shopping results for '{search_query}', falling back to web search.")
            result = GoogleSearch({
                "q": search_query,
                "api_key": key,
                "engine": "google"
            }).get_dict()
            if "organic_results" in result:
                first = result["organic_results"][0]
                return {
                    "title": first.get("title"),
                    "price": None,
                    "url": first.get("link"),
                    "image": first.get("thumbnail") if "thumbnail" in first else None
                }
    except Exception as e:
        print(f"❌ Search failed for '{search_query}': {e}")
    return None

for itm in items:
    full_query = f"{itm['query']} {itm['product']}".strip()
    clean_query = full_query.replace("and name of sites where they can be found", "").strip()
    print(f"🔍 Searching: {clean_query}")
    itm["result"] = fetch_link(clean_query)

# === Step 7: Final Output ===
print("\n=== Final Recommendations ===")
print(json.dumps(items, indent=2))
