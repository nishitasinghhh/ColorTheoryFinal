from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import uuid
import os
import subprocess
import json
from face_color_api import build_prompt, call_openai_api  # Must return parsed JSON
from openai import OpenAI
from quiz_api import QUIZ_QUESTIONS, call_openai_for_quiz, save_quiz_results

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change to ["http://localhost:3001"] in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze/")
async def analyze(
    image: UploadFile = File(...),
    undertone: str = Form(...)
):
    # 1. Save uploaded image temporarily
    temp_filename = f"temp_{uuid.uuid4().hex}.jpg"
    with open(temp_filename, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    try:
        # 2. Run analyze_face.py
        result = subprocess.run(
            ['python', 'analyze_face.py', '--image', temp_filename, '--undertone', undertone],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            raise Exception(result.stderr)

        face_data = json.loads(result.stdout)

        # Save feature analysis result to JSON file
        with open("feature_data.json", "w") as f:
            json.dump(face_data, f, indent=2)

        # 3. Build OpenAI prompt & call API
        prompt = build_prompt(face_data)
        ai_result = call_openai_api(prompt)  # Already returns JSON, not string

        # Save recommendations to JSON file
        with open("latest_recommendations.json", "w") as f:
            json.dump(ai_result, f, indent=2)

        # 4. Clean up
        os.remove(temp_filename)

        return {
            "feature_extraction": face_data,
            "api_result": ai_result
        }

    except json.JSONDecodeError as je:
        os.remove(temp_filename)
        return JSONResponse(status_code=500, content={
            "error": "Invalid JSON from face analysis script.",
            "details": str(je),
            "raw_output": result.stdout
        })

    except Exception as e:
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
        return JSONResponse(status_code=500, content={
            "error": "Server Error",
            "details": str(e)
        })

# New endpoint to serve latest recommendations
@app.get("/recommendations")
def get_recommendations():
    try:
        with open("latest_recommendations.json", "r") as f:
            data = json.load(f)
        return data
    except FileNotFoundError:
        return JSONResponse(status_code=404, content={"error": "No recommendations found."})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# Chatbot endpoint for Q&A flow
@app.post("/chat")
async def chat_endpoint(request: dict):
    try:
        # Define all questions in order
        questions = [
            {
                "id": "gender",
                "question": "What's your gender?",
                "options": ["female", "male", "other"],
                "type": "choice"
            },
            {
                "id": "body_type", 
                "question": "What's your body type?",
                "options": [],  # Will be populated based on gender
                "type": "choice",
                "dynamic_options": True
            },
            {
                "id": "mood",
                "question": "What's your current mood?",
                "options": ["Happy", "Bold", "Neutral", "Romantic", "Confident", "Relaxed"],
                "type": "choice"
            },
            {
                "id": "city",
                "question": "What city do you live in?",
                "type": "text"
            },
            {
                "id": "occasion",
                "question": "What's the occasion?",
                "options": ["Office", "Date", "Wedding", "Casual Outing", "Festival", "Party", "Travel"],
                "type": "choice"
            },
            {
                "id": "accessorize",
                "question": "Are you willing to accessorize?",
                "options": ["yes", "no"],
                "type": "choice"
            },
            {
                "id": "cultural_preferences",
                "question": "Any cultural/religious preferences? (optional)",
                "type": "text",
                "optional": True
            },
            {
                "id": "comfort_level",
                "question": "What's your comfort level preference?",
                "options": ["light", "medium", "heavy"],
                "type": "choice",
                "optional": True
            }
        ]
        
        # Load existing user responses or create new
        try:
            with open("user_responses.json", "r") as f:
                user_responses = json.load(f)
        except FileNotFoundError:
            user_responses = {}
        
        # Handle user response if provided
        if "answer" in request and "question_id" in request:
            question_id = request["question_id"]
            answer = request["answer"]
            
            # Store the answer
            user_responses[question_id] = answer
            
            # Save updated responses
            with open("user_responses.json", "w") as f:
                json.dump(user_responses, f, indent=2)
            
            # If city was just answered, return a special status
            if question_id == "city":
                # Fetch weather data immediately
                weather_desc, temp_c = fetch_weather(answer)
                return {
                    "status": "calculating_weather",
                    "message": f"Calculating temperature for your city...",
                    "weather_info": f"Current weather in {answer}: {weather_desc}, {temp_c}°C",
                    "city": answer,
                    "weather_desc": weather_desc,
                    "temperature": temp_c
                }
        
        # Find next unanswered question
        next_question = None
        for q in questions:
            if q["id"] not in user_responses:
                next_question = q
                break
        
        # Handle dynamic options for body type based on gender
        if next_question and next_question["id"] == "body_type" and next_question.get("dynamic_options"):
            gender = user_responses.get("gender", "female")
            if gender == "female":
                next_question["options"] = ["hourglass", "pear", "apple", "rectangle", "inverted triangle"]
            elif gender == "male":
                next_question["options"] = ["rectangle", "triangle", "inverted triangle", "oval", "trapezoid"]
            else:
                next_question["options"] = ["hourglass", "pear", "apple", "rectangle", "inverted triangle", "triangle", "oval", "trapezoid"]
        
        # If all questions answered, return completion status
        if next_question is None:
            return {
                "status": "completed",
                "message": "All questions answered! Ready to generate recommendations.",
                "user_responses": user_responses
            }
        
        # Return next question
        return {
            "status": "question",
            "next_question": next_question,
            "progress": f"{len(user_responses)}/{len(questions)} questions answered"
        }
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# Reset chatbot responses (for testing)
@app.post("/chat/reset")
async def reset_chat():
    try:
        if os.path.exists("user_responses.json"):
            os.remove("user_responses.json")
        return {"message": "Chat responses reset successfully"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# Generate personalized recommendations using feature data + user responses
@app.post("/generate-recommendations")
async def generate_recommendations():
    try:
        # Load feature data
        try:
            with open("feature_data.json", "r") as f:
                feature_data = json.load(f)
        except FileNotFoundError:
            return JSONResponse(status_code=404, content={"error": "Feature data not found. Please upload an image first."})
        
        # Load user responses
        try:
            with open("user_responses.json", "r") as f:
                user_responses = json.load(f)
        except FileNotFoundError:
            return JSONResponse(status_code=404, content={"error": "User responses not found. Please complete the chatbot questions first."})
        
        # Check if all required questions are answered
        required_questions = ["gender", "body_type", "mood", "city", "occasion", "accessorize"]
        missing_questions = [q for q in required_questions if q not in user_responses]
        
        if missing_questions:
            return JSONResponse(status_code=400, content={
                "error": f"Missing required questions: {', '.join(missing_questions)}"
            })
        
        # Fetch weather data
        weather_desc, temp_c = fetch_weather(user_responses["city"])
        
        # Determine gender-specific care category
        gender = user_responses["gender"]
        gender_specific_care = "Skincare products (cleanser, moisturizer, sunscreen)" if gender == "male" else "Makeup products (foundation, lipstick, blush)"
        
        # Build prompt for recommendations
        prompt = f"""
You are a professional fashion and color stylist.
Profile:
Gender: {user_responses["gender"]}
Body Type: {user_responses["body_type"]}
Undertone: {feature_data.get('undertone', '-')}
Season: {feature_data.get('season', '-')}
Lip RGB: {feature_data.get('lip_rgb', '-')}
Hair RGB: {feature_data.get('hair_rgb', '-')}
Skin RGB: {feature_data.get('skin_rgb', '-')}
Eye Color: {feature_data.get('dominant_eye_color', '-')}
Mood: {user_responses["mood"]}
City: {user_responses["city"]}
Weather: {weather_desc}, {temp_c}°C
Occasion: {user_responses["occasion"]}
Likes Accessories: {user_responses["accessorize"]}
Cultural/Religious Preferences: {user_responses.get('cultural_preferences', '-')}
Comfort Level: {user_responses.get('comfort_level', '-')}

Recommend 3 items each of:
- Clothing
- Footwear
- Accessories (if suitable)
- {gender_specific_care}
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
        
        # Call OpenAI for recommendations
        openai_key = os.environ.get('GITHUB_PAT')
        if not openai_key:
            return JSONResponse(status_code=500, content={"error": "OpenAI API key not configured"})
        
        openai_client = OpenAI(
            base_url="https://models.github.ai/inference",
            api_key=openai_key
        )
        
        resp = openai_client.chat.completions.create(
            model="openai/gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=1, max_tokens=2048
        )
        
        raw_output = resp.choices[0].message.content.strip()
        
        # Clean response
        if raw_output.startswith("```"):
            raw_output = raw_output.split("```")[1].strip()
            if raw_output.startswith("json"):
                raw_output = raw_output[len("json"):].strip()
        
        try:
            items = json.loads(raw_output)
        except Exception as e:
            return JSONResponse(status_code=500, content={"error": f"Error parsing OpenAI response: {str(e)}"})
        
        # Fetch shopping links using SerpAPI
        for item in items:
            full_query = f"{item['query']} {item['product']}".strip()
            clean_query = full_query.replace("and name of sites where they can be found", "").strip()
            item["shopping_result"] = fetch_shopping_link(clean_query)
        
        # Save final recommendations
        with open("latest_recommendations.json", "w") as f:
            json.dump(items, f, indent=2)
        
        return {
            "message": "Recommendations generated successfully!",
            "recommendations": items,
            "weather": {"description": weather_desc, "temperature": temp_c}
        }
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# Helper function to fetch weather data
def fetch_weather(city):
    key = os.environ.get('OPENWEATHER_API_KEY')
    if not key:
        return "clear", 25
    try:
        import requests
        r = requests.get(
            "http://api.openweathermap.org/data/2.5/weather",
            params={"q": city, "appid": key, "units": "metric"}
        ).json()
        return r["weather"][0]["description"], r["main"]["temp"]
    except Exception as e:
        return "clear", 25

# Helper function to fetch shopping links using SerpAPI
def fetch_shopping_link(search_query):
    key = os.environ.get('SERPAPI_KEY')
    if not key:
        return None
    try:
        from serpapi import GoogleSearch
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
            # Fallback to web search
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
        return None
    return None

# Quiz endpoints
@app.get("/quiz/questions")
def get_quiz_questions():
    """Get all quiz questions"""
    return {"questions": QUIZ_QUESTIONS}

@app.post("/quiz/submit")
async def submit_quiz(request: dict):
    """Submit quiz responses and generate seasonal analysis"""
    try:
        quiz_responses = request.get("responses", {})
        
        # Validate that all questions are answered
        required_questions = [q["id"] for q in QUIZ_QUESTIONS]
        missing_questions = [q for q in required_questions if q not in quiz_responses]
        
        if missing_questions:
            return JSONResponse(status_code=400, content={
                "error": f"Missing questions: {', '.join(missing_questions)}"
            })
        
        # Call OpenAI to analyze quiz responses
        ai_result = call_openai_for_quiz(quiz_responses)
        
        # Save results in the same format as image analysis
        result = save_quiz_results(quiz_responses, ai_result)
        
        return result
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/quiz/reset")
async def reset_quiz():
    """Reset quiz responses"""
    try:
        # Clear any existing quiz data
        if os.path.exists("feature_data.json"):
            os.remove("feature_data.json")
        if os.path.exists("latest_recommendations.json"):
            os.remove("latest_recommendations.json")
        return {"message": "Quiz data reset successfully"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
