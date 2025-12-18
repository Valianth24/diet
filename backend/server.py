from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime
    # Profile data
    height: Optional[float] = None  # cm
    weight: Optional[float] = None  # kg
    age: Optional[int] = None
    gender: Optional[str] = None  # "male" or "female"
    activity_level: Optional[str] = None  # "sedentary", "light", "moderate", "active", "very_active"
    # Goals
    daily_calorie_goal: Optional[int] = None
    water_goal: Optional[int] = 2500  # ml
    step_goal: Optional[int] = 10000
    # Premium
    is_premium: Optional[bool] = False
    premium_expires_at: Optional[datetime] = None
    ads_watched: Optional[int] = 0

class SessionDataResponse(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

class ProfileData(BaseModel):
    height: Optional[float] = None
    weight: Optional[float] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    activity_level: Optional[str] = None

class UpdateGoals(BaseModel):
    daily_calorie_goal: Optional[int] = None
    water_goal: Optional[int] = None
    step_goal: Optional[int] = None

class AnalyzeFoodRequest(BaseModel):
    image_base64: str

class AnalyzeFoodResponse(BaseModel):
    calories: int
    protein: float
    carbs: float
    fat: float
    description: str

class AddMealRequest(BaseModel):
    name: str
    calories: int
    protein: float
    carbs: float
    fat: float
    image_base64: str
    meal_type: str  # "breakfast", "lunch", "dinner", "snack"

class Meal(BaseModel):
    meal_id: str
    user_id: str
    name: str
    calories: int
    protein: float
    carbs: float
    fat: float
    image_base64: str
    meal_type: str
    timestamp: datetime

class DailySummary(BaseModel):
    date: str
    total_calories: int
    total_protein: float
    total_carbs: float
    total_fat: float
    meals: List[Meal]

class AddWaterRequest(BaseModel):
    amount: int  # ml

class WaterLog(BaseModel):
    user_id: str
    date: str
    total_amount: int
    logs: List[Dict[str, Any]]

class StepLog(BaseModel):
    user_id: str
    date: str
    steps: int
    source: str

class SyncStepsRequest(BaseModel):
    steps: int
    source: str  # "google_fit" or "apple_health"

class ManualStepsRequest(BaseModel):
    steps: int

class WatchAdRequest(BaseModel):
    ad_count: int = 1  # Number of ads watched

class VitaminTemplate(BaseModel):
    vitamin_id: str
    name: str
    default_time: str

class UserVitamin(BaseModel):
    vitamin_id: str
    user_id: str
    name: str
    time: str
    is_taken: bool
    date: str

class DietPlan(BaseModel):
    diet_id: str
    name: str
    description: str
    duration_days: int
    daily_calories: int
    meals: List[Dict[str, Any]]  # List of meals per day
    is_premium: bool
    category: str  # "weight_loss", "muscle_gain", "balanced", "keto", etc.
    image_url: Optional[str] = None

class UserDiet(BaseModel):
    user_diet_id: str
    user_id: str
    diet_id: Optional[str] = None  # None if custom
    name: str
    description: str
    start_date: str
    end_date: Optional[str] = None
    is_active: bool
    is_custom: bool
    meals: List[Dict[str, Any]]
    created_at: datetime

class AddVitaminRequest(BaseModel):
    name: str
    time: str

class ToggleVitaminRequest(BaseModel):
    vitamin_id: str

# ==================== HELPER FUNCTIONS ====================

def calculate_calorie_goal(height: float, weight: float, age: int, gender: str, activity_level: str) -> int:
    """Calculate daily calorie goal using Harris-Benedict formula"""
    # BMR calculation
    if gender == "male":
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    else:
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
    
    # Activity factor
    activity_factors = {
        "sedentary": 1.2,
        "light": 1.375,
        "moderate": 1.55,
        "active": 1.725,
        "very_active": 1.9
    }
    
    factor = activity_factors.get(activity_level, 1.2)
    return int(bmr * factor)

async def get_current_user(request: Request) -> Optional[User]:
    """Get current user from session token"""
    # Try to get token from cookie first
    session_token = request.cookies.get("session_token")
    
    # If not in cookie, try Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        return None
    
    # Find session
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        return None
    
    # Check if session is expired
    expires_at = session.get("expires_at")
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            return None
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        return None
    
    return User(**user_doc)

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/session", response_model=SessionDataResponse)
async def exchange_session(request: Request):
    """Exchange session_id for session_token"""
    session_id = request.headers.get("X-Session-ID")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="X-Session-ID header required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            )
            response.raise_for_status()
            user_data = response.json()
        except Exception as e:
            logger.error(f"Error exchanging session: {e}")
            raise HTTPException(status_code=400, detail="Invalid session ID")
    
    # Check if user exists
    existing_user = await db.users.find_one(
        {"email": user_data["email"]},
        {"_id": 0}
    )
    
    if existing_user:
        user_id = existing_user["user_id"]
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "created_at": datetime.now(timezone.utc),
            "water_goal": 2500,
            "step_goal": 10000
        })
    
    # Create session
    session_token = user_data["session_token"]
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Create response
    response = JSONResponse(content={
        "user_id": user_id,
        "email": user_data["email"],
        "name": user_data["name"],
        "picture": user_data.get("picture"),
        "session_token": session_token
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return response

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: Optional[User] = Depends(get_current_user)):
    """Get current user"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user

@api_router.post("/auth/logout")
async def logout(request: Request, current_user: Optional[User] = Depends(get_current_user)):
    """Logout user"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("session_token")
    return response

@api_router.put("/auth/profile", response_model=User)
async def update_profile(
    profile_data: ProfileData,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Update user profile and calculate calorie goal"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    update_data = profile_data.dict(exclude_none=True)
    
    # Calculate calorie goal if all required data is present
    if all([
        profile_data.height,
        profile_data.weight,
        profile_data.age,
        profile_data.gender,
        profile_data.activity_level
    ]):
        calorie_goal = calculate_calorie_goal(
            profile_data.height,
            profile_data.weight,
            profile_data.age,
            profile_data.gender,
            profile_data.activity_level
        )
        update_data["daily_calorie_goal"] = calorie_goal
    
    # Update user
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": update_data}
    )
    
    # Get updated user
    user_doc = await db.users.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    return User(**user_doc)

# ==================== USER ENDPOINTS ====================

@api_router.get("/user/profile", response_model=User)
async def get_profile(current_user: Optional[User] = Depends(get_current_user)):
    """Get user profile"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return current_user

@api_router.put("/user/goals", response_model=User)
async def update_goals(
    goals: UpdateGoals,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Update user goals"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    update_data = goals.dict(exclude_none=True)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": update_data}
    )
    
    user_doc = await db.users.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    return User(**user_doc)

# ==================== FOOD ENDPOINTS ====================

@api_router.post("/food/analyze", response_model=AnalyzeFoodResponse)
async def analyze_food(
    request_data: AnalyzeFoodRequest,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Analyze food image using GPT-4 Vision"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        # Create LLM chat instance
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"food_analysis_{current_user.user_id}_{datetime.now().timestamp()}",
            system_message="You are a nutrition expert. Analyze food images and provide accurate calorie and macronutrient information."
        ).with_model("openai", "gpt-4o")
        
        # Create image content
        image_content = ImageContent(image_base64=request_data.image_base64)
        
        # Create message
        message = UserMessage(
            text="""Analyze this food image and provide:
1. Total calories (kcal)
2. Protein (grams)
3. Carbohydrates (grams)
4. Fat (grams)
5. Brief description of the food

Respond in this exact JSON format:
{
  "calories": <number>,
  "protein": <number>,
  "carbs": <number>,
  "fat": <number>,
  "description": "<text>"
}""",
            file_contents=[image_content]
        )
        
        # Get response
        response = await chat.send_message(message)
        
        # Parse response
        import json
        response_text = response.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        data = json.loads(response_text)
        
        return AnalyzeFoodResponse(
            calories=int(data["calories"]),
            protein=float(data["protein"]),
            carbs=float(data["carbs"]),
            fat=float(data["fat"]),
            description=data["description"]
        )
    
    except Exception as e:
        logger.error(f"Error analyzing food: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing food: {str(e)}")

@api_router.post("/food/add-meal", response_model=Meal)
async def add_meal(
    meal_data: AddMealRequest,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Add meal to daily intake"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    meal_id = f"meal_{uuid.uuid4().hex[:12]}"
    meal = {
        "meal_id": meal_id,
        "user_id": current_user.user_id,
        "name": meal_data.name,
        "calories": meal_data.calories,
        "protein": meal_data.protein,
        "carbs": meal_data.carbs,
        "fat": meal_data.fat,
        "image_base64": meal_data.image_base64,
        "meal_type": meal_data.meal_type,
        "timestamp": datetime.now(timezone.utc)
    }
    
    await db.meals.insert_one(meal)
    
    return Meal(**meal)

@api_router.get("/food/today", response_model=List[Meal])
async def get_today_meals(current_user: Optional[User] = Depends(get_current_user)):
    """Get today's meals"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    today = datetime.now(timezone.utc).date()
    tomorrow = today + timedelta(days=1)
    
    meals = await db.meals.find({
        "user_id": current_user.user_id,
        "timestamp": {
            "$gte": datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc),
            "$lt": datetime.combine(tomorrow, datetime.min.time()).replace(tzinfo=timezone.utc)
        }
    }, {"_id": 0}).sort("timestamp", 1).to_list(1000)
    
    return [Meal(**meal) for meal in meals]

# FOOD DATABASE - Uygulama sahipleri tarafından eklenen yemekler
FOOD_DATABASE = [
    {"food_id": "food_001", "name": "Tavuk Göğsü (100g)", "calories": 165, "protein": 31, "carbs": 0, "fat": 3.6, "name_en": "Chicken Breast (100g)"},
    {"food_id": "food_002", "name": "Pirinç Pilavı (1 Porsiyon)", "calories": 206, "protein": 4.3, "carbs": 45, "fat": 0.4, "name_en": "Rice Pilaf (1 Serving)"},
    {"food_id": "food_003", "name": "Makarna (1 Porsiyon)", "calories": 221, "protein": 8, "carbs": 43, "fat": 1.3, "name_en": "Pasta (1 Serving)"},
    {"food_id": "food_004", "name": "Yumurta (1 Adet)", "calories": 78, "protein": 6.3, "carbs": 0.6, "fat": 5.3, "name_en": "Egg (1 Piece)"},
    {"food_id": "food_005", "name": "Peynir (100g)", "calories": 402, "protein": 25, "carbs": 1.3, "fat": 33, "name_en": "Cheese (100g)"},
    {"food_id": "food_006", "name": "Ekmek (1 Dilim)", "calories": 79, "protein": 2.6, "carbs": 15, "fat": 1, "name_en": "Bread (1 Slice)"},
    {"food_id": "food_007", "name": "Salata (1 Porsiyon)", "calories": 33, "protein": 1.4, "carbs": 6.3, "fat": 0.2, "name_en": "Salad (1 Serving)"},
    {"food_id": "food_008", "name": "Köfte (1 Porsiyon)", "calories": 250, "protein": 20, "carbs": 5, "fat": 17, "name_en": "Meatballs (1 Serving)"},
    {"food_id": "food_009", "name": "Balık (150g)", "calories": 165, "protein": 30, "carbs": 0, "fat": 4, "name_en": "Fish (150g)"},
    {"food_id": "food_010", "name": "Meyve (1 Porsiyon)", "calories": 60, "protein": 0.5, "carbs": 15, "fat": 0.2, "name_en": "Fruit (1 Serving)"},
    {"food_id": "food_011", "name": "Yoğurt (200g)", "calories": 122, "protein": 7, "carbs": 9, "fat": 6.4, "name_en": "Yogurt (200g)"},
    {"food_id": "food_012", "name": "Mercimek Çorbası (1 Kase)", "calories": 180, "protein": 12, "carbs": 30, "fat": 2, "name_en": "Lentil Soup (1 Bowl)"},
    {"food_id": "food_013", "name": "Patates (1 Adet)", "calories": 130, "protein": 3, "carbs": 30, "fat": 0.1, "name_en": "Potato (1 Piece)"},
    {"food_id": "food_014", "name": "Domates (1 Adet)", "calories": 22, "protein": 1, "carbs": 4.8, "fat": 0.2, "name_en": "Tomato (1 Piece)"},
    {"food_id": "food_015", "name": "Elma (1 Adet)", "calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3, "name_en": "Apple (1 Piece)"},
]

@api_router.get("/food/daily-summary", response_model=DailySummary)
async def get_daily_summary(current_user: Optional[User] = Depends(get_current_user)):
    """Get daily nutrition summary"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    meals = await get_today_meals(current_user)
    
    total_calories = sum(meal.calories for meal in meals)
    total_protein = sum(meal.protein for meal in meals)
    total_carbs = sum(meal.carbs for meal in meals)
    total_fat = sum(meal.fat for meal in meals)
    
    return DailySummary(
        date=datetime.now(timezone.utc).date().isoformat(),
        total_calories=total_calories,
        total_protein=total_protein,
        total_carbs=total_carbs,
        total_fat=total_fat,
        meals=meals
    )

@api_router.get("/food/database")
async def get_food_database(lang: str = "tr", current_user: Optional[User] = Depends(get_current_user)):
    """Get food database for manual entry"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Return localized food names
    if lang == "en":
        return [{"food_id": f["food_id"], "name": f["name_en"], "calories": f["calories"], 
                 "protein": f["protein"], "carbs": f["carbs"], "fat": f["fat"]} for f in FOOD_DATABASE]
    else:
        return [{"food_id": f["food_id"], "name": f["name"], "calories": f["calories"], 
                 "protein": f["protein"], "carbs": f["carbs"], "fat": f["fat"]} for f in FOOD_DATABASE]

# ==================== WATER ENDPOINTS ====================

@api_router.post("/water/add")
async def add_water(
    water_data: AddWaterRequest,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Add water intake"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Get today's water log
    water_log = await db.water_logs.find_one({
        "user_id": current_user.user_id,
        "date": today
    }, {"_id": 0})
    
    if water_log:
        # Update existing log
        await db.water_logs.update_one(
            {"user_id": current_user.user_id, "date": today},
            {
                "$inc": {"total_amount": water_data.amount},
                "$push": {
                    "logs": {
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "amount": water_data.amount
                    }
                }
            }
        )
    else:
        # Create new log
        await db.water_logs.insert_one({
            "user_id": current_user.user_id,
            "date": today,
            "total_amount": water_data.amount,
            "logs": [{
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "amount": water_data.amount
            }]
        })
    
    return {"message": "Water added successfully"}

@api_router.get("/water/today")
async def get_today_water(current_user: Optional[User] = Depends(get_current_user)):
    """Get today's water intake"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    today = datetime.now(timezone.utc).date().isoformat()
    
    water_log = await db.water_logs.find_one({
        "user_id": current_user.user_id,
        "date": today
    }, {"_id": 0})
    
    if not water_log:
        return {"total_amount": 0, "logs": []}
    
    return water_log

@api_router.get("/water/weekly")
async def get_weekly_water(current_user: Optional[User] = Depends(get_current_user)):
    """Get weekly water data for chart"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get last 7 days
    today = datetime.now(timezone.utc).date()
    dates = [(today - timedelta(days=i)).isoformat() for i in range(6, -1, -1)]
    
    water_logs = await db.water_logs.find({
        "user_id": current_user.user_id,
        "date": {"$in": dates}
    }, {"_id": 0}).to_list(1000)
    
    # Create map for easy lookup
    log_map = {log["date"]: log["total_amount"] for log in water_logs}
    
    # Create response with all dates
    result = []
    for date in dates:
        result.append({
            "date": date,
            "amount": log_map.get(date, 0)
        })
    
    return result

# ==================== STEPS ENDPOINTS ====================

@api_router.post("/steps/sync")
async def sync_steps(
    step_data: SyncStepsRequest,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Sync steps from health app"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    today = datetime.now(timezone.utc).date().isoformat()
    
    await db.step_logs.update_one(
        {"user_id": current_user.user_id, "date": today},
        {
            "$set": {
                "steps": step_data.steps,
                "source": step_data.source,
                "updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    return {"message": "Steps synced successfully"}

@api_router.get("/steps/today")
async def get_today_steps(current_user: Optional[User] = Depends(get_current_user)):
    """Get today's steps"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    today = datetime.now(timezone.utc).date().isoformat()
    
    step_log = await db.step_logs.find_one({
        "user_id": current_user.user_id,
        "date": today
    }, {"_id": 0})
    
    if not step_log:
        return {"steps": 0, "source": "none"}
    
    return step_log

@api_router.post("/steps/manual")
async def add_manual_steps(
    step_data: ManualStepsRequest,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Manually add steps"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    today = datetime.now(timezone.utc).date().isoformat()
    
    await db.step_logs.update_one(
        {"user_id": current_user.user_id, "date": today},
        {
            "$set": {
                "steps": step_data.steps,
                "source": "manual",
                "updated_at": datetime.now(timezone.utc)
            }
        },
        upsert=True
    )
    
    return {"message": "Steps added successfully"}

# ==================== VITAMINS ENDPOINTS ====================

# Default vitamin templates
DEFAULT_VITAMINS = [
    {"vitamin_id": "vit_c", "name": "C Vitamini", "default_time": "Her Sabah"},
    {"vitamin_id": "vit_d", "name": "D Vitamini", "default_time": "Her Sabah"},
    {"vitamin_id": "vit_omega3", "name": "Omega-3", "default_time": "Akşam Yemeği"},
    {"vitamin_id": "vit_magnesium", "name": "Magnezyum", "default_time": "Her Sabah"},
    {"vitamin_id": "vit_zinc", "name": "Çinko", "default_time": "Her Sabah"},
]

@api_router.get("/vitamins/templates", response_model=List[VitaminTemplate])
async def get_vitamin_templates():
    """Get default vitamin templates"""
    return [VitaminTemplate(**vit) for vit in DEFAULT_VITAMINS]

# Duplicate endpoint removed - using the one with localization support above

@api_router.get("/vitamins/user", response_model=List[UserVitamin])
async def get_user_vitamins(current_user: Optional[User] = Depends(get_current_user)):
    """Get user's vitamins"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    vitamins = await db.user_vitamins.find({
        "user_id": current_user.user_id
    }, {"_id": 0}).to_list(1000)
    
    return [UserVitamin(**vit) for vit in vitamins]

@api_router.post("/vitamins/add", response_model=UserVitamin)
async def add_vitamin(
    vitamin_data: AddVitaminRequest,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Add custom vitamin"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    vitamin_id = f"vit_{uuid.uuid4().hex[:8]}"
    today = datetime.now(timezone.utc).date().isoformat()
    
    vitamin = {
        "vitamin_id": vitamin_id,
        "user_id": current_user.user_id,
        "name": vitamin_data.name,
        "time": vitamin_data.time,
        "is_taken": False,
        "date": today
    }
    
    await db.user_vitamins.insert_one(vitamin)
    
    return UserVitamin(**vitamin)

@api_router.put("/vitamins/toggle")
async def toggle_vitamin(
    toggle_data: ToggleVitaminRequest,
    current_user: Optional[User] = Depends(get_current_user)
):
    """Toggle vitamin taken status"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    today = datetime.now(timezone.utc).date().isoformat()
    
    vitamin = await db.user_vitamins.find_one({
        "vitamin_id": toggle_data.vitamin_id,
        "user_id": current_user.user_id
    }, {"_id": 0})
    
    if not vitamin:
        raise HTTPException(status_code=404, detail="Vitamin not found")
    
    new_status = not vitamin.get("is_taken", False)
    
    await db.user_vitamins.update_one(
        {"vitamin_id": toggle_data.vitamin_id, "user_id": current_user.user_id},
        {"$set": {"is_taken": new_status, "date": today}}
    )
    
    return {"message": "Vitamin status updated", "is_taken": new_status}

@api_router.get("/vitamins/today", response_model=List[UserVitamin])
async def get_today_vitamins(current_user: Optional[User] = Depends(get_current_user)):
    """Get today's vitamin status - auto resets daily"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    today = datetime.now(timezone.utc).date().isoformat()
    
    # Get all user vitamins
    all_vitamins = await db.user_vitamins.find({
        "user_id": current_user.user_id
    }, {"_id": 0}).to_list(1000)
    
    # Reset vitamins if date changed
    result_vitamins = []
    for vitamin in all_vitamins:
        if vitamin.get("date") != today:
            # Reset for new day
            await db.user_vitamins.update_one(
                {"vitamin_id": vitamin["vitamin_id"], "user_id": current_user.user_id},
                {"$set": {"is_taken": False, "date": today}}
            )
            vitamin["is_taken"] = False
            vitamin["date"] = today
        result_vitamins.append(vitamin)
    
    return [UserVitamin(**vit) for vit in result_vitamins]

# ==================== DIET MANAGEMENT ====================

@api_router.get("/diets/premium", response_model=List[DietPlan])
async def get_premium_diets(current_user: User = Depends(get_current_user)):
    """Get all premium diet plans"""
    diets = await db.diet_plans.find({"is_premium": True}).to_list(100)
    return [DietPlan(**diet) for diet in diets]

@api_router.get("/diets/user", response_model=List[UserDiet])
async def get_user_diets(current_user: User = Depends(get_current_user)):
    """Get user's diet plans (both premium and custom)"""
    diets = await db.user_diets.find({"user_id": current_user.user_id}).to_list(100)
    return [UserDiet(**diet) for diet in diets]

@api_router.post("/diets/user")
async def create_user_diet(
    name: str,
    description: str,
    is_custom: bool = True,
    diet_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Create a custom diet or activate a premium diet"""
    user_diet_id = str(uuid.uuid4())
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    
    diet_data = {
        "user_diet_id": user_diet_id,
        "user_id": current_user.user_id,
        "diet_id": diet_id,
        "name": name,
        "description": description,
        "start_date": today,
        "end_date": None,
        "is_active": True,
        "is_custom": is_custom,
        "meals": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    # Deactivate other active diets
    await db.user_diets.update_many(
        {"user_id": current_user.user_id, "is_active": True},
        {"$set": {"is_active": False}}
    )
    
    await db.user_diets.insert_one(diet_data)
    return {"user_diet_id": user_diet_id, "message": "Diet created successfully"}

@api_router.delete("/diets/user/{user_diet_id}")
async def delete_user_diet(
    user_diet_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a user diet"""
    result = await db.user_diets.delete_one({
        "user_diet_id": user_diet_id,
        "user_id": current_user.user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Diet not found")
    
    return {"message": "Diet deleted successfully"}

@api_router.post("/diets/user/{user_diet_id}/activate")
async def activate_diet(
    user_diet_id: str,
    current_user: User = Depends(get_current_user)
):
    """Activate a specific diet"""
    # Deactivate all other diets
    await db.user_diets.update_many(
        {"user_id": current_user.user_id, "is_active": True},
        {"$set": {"is_active": False}}
    )
    
    # Activate the selected diet
    result = await db.user_diets.update_one(
        {"user_diet_id": user_diet_id, "user_id": current_user.user_id},
        {"$set": {"is_active": True, "start_date": datetime.now(timezone.utc).strftime('%Y-%m-%d')}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Diet not found")
    
    return {"message": "Diet activated successfully"}

# ==================== PREMIUM MANAGEMENT ====================

@api_router.post("/premium/activate")
async def activate_premium(
    current_user: User = Depends(get_current_user)
):
    """Activate premium subscription - FREE (no payment required)"""
    # Set premium expiry to 30 days from now
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {
            "is_premium": True,
            "premium_expires_at": expires_at
        }}
    )
    
    return {
        "message": "Premium activated successfully",
        "expires_at": expires_at.isoformat()
    }

@api_router.post("/ads/watch")
async def watch_ad(
    ad_data: WatchAdRequest,
    current_user: User = Depends(get_current_user)
):
    """User watched an ad - grant 24 hour premium for every 3 ads"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get current ad count from user
    user_doc = await db.users.find_one({"user_id": current_user.user_id})
    current_ad_count = user_doc.get("ads_watched", 0)
    new_ad_count = current_ad_count + ad_data.ad_count
    
    # Check if user should get premium (every 3 ads = 24 hours)
    ads_for_premium = 3
    if new_ad_count >= ads_for_premium and current_ad_count < ads_for_premium:
        # Grant 24 hour premium
        expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$set": {
                "is_premium": True,
                "premium_expires_at": expires_at,
                "ads_watched": new_ad_count
            }}
        )
        
        return {
            "message": "Congratulations! You've earned 24 hours of premium",
            "is_premium": True,
            "premium_expires_at": expires_at.isoformat(),
            "ads_watched": new_ad_count,
            "ads_needed_for_next": ads_for_premium
        }
    else:
        # Update ad count only
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$set": {"ads_watched": new_ad_count}}
        )
        
        ads_remaining = ads_for_premium - (new_ad_count % ads_for_premium)
        
        return {
            "message": "Ad watched successfully",
            "is_premium": user_doc.get("is_premium", False),
            "ads_watched": new_ad_count,
            "ads_needed_for_next": ads_remaining
        }

@api_router.get("/premium/status")
async def get_premium_status(current_user: User = Depends(get_current_user)):
    """Check premium status"""
    user_doc = await db.users.find_one({"user_id": current_user.user_id})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    is_premium = user_doc.get("is_premium", False)
    premium_expires_at = user_doc.get("premium_expires_at")
    
    # Check if premium expired
    if is_premium and premium_expires_at:
        if premium_expires_at < datetime.now(timezone.utc):
            is_premium = False
            await db.users.update_one(
                {"user_id": current_user.user_id},
                {"$set": {"is_premium": False}}
            )
    
    return {
        "is_premium": is_premium,
        "premium_expires_at": premium_expires_at.isoformat() if premium_expires_at else None
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
