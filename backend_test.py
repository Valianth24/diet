#!/usr/bin/env python3
"""
CalorieDiet App Backend API Testing
Tests all endpoints with proper authentication and user session management.
"""

import asyncio
import httpx
import json
import base64
import os
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import uuid

# Configuration
BACKEND_URL = "https://caloridiet-app.preview.emergentagent.com/api"
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "test_database"

class CalorieDietTester:
    def __init__(self):
        self.client = None
        self.mongo_client = None
        self.db = None
        self.session_token = None
        self.user_id = None
        self.test_results = []
        
    async def setup(self):
        """Setup test environment"""
        print("🔧 Setting up test environment...")
        
        # Setup HTTP client
        self.client = httpx.AsyncClient(timeout=30.0)
        
        # Setup MongoDB client
        self.mongo_client = AsyncIOMotorClient(MONGO_URL)
        self.db = self.mongo_client[DB_NAME]
        
        # Create test user and session
        await self.create_test_user()
        
    async def cleanup(self):
        """Cleanup test environment"""
        print("🧹 Cleaning up test environment...")
        
        if self.client:
            await self.client.aclose()
            
        if self.mongo_client:
            # Clean up test data
            if self.user_id:
                await self.db.users.delete_one({"user_id": self.user_id})
                await self.db.user_sessions.delete_one({"user_id": self.user_id})
                await self.db.meals.delete_many({"user_id": self.user_id})
                await self.db.water_logs.delete_many({"user_id": self.user_id})
                await self.db.step_logs.delete_many({"user_id": self.user_id})
                await self.db.user_vitamins.delete_many({"user_id": self.user_id})
            
            self.mongo_client.close()
    
    async def create_test_user(self):
        """Create test user and session in MongoDB"""
        print("👤 Creating test user and session...")
        
        # Generate unique IDs
        timestamp = int(datetime.now().timestamp())
        self.user_id = f"user_{uuid.uuid4().hex[:12]}"
        self.session_token = f"test_session_{timestamp}"
        
        # Create user
        user_doc = {
            "user_id": self.user_id,
            "email": f"test.user.{timestamp}@example.com",
            "name": "Test User",
            "picture": "https://via.placeholder.com/150",
            "created_at": datetime.now(timezone.utc),
            "height": 175.0,
            "weight": 70.0,
            "age": 30,
            "gender": "male",
            "activity_level": "moderate",
            "daily_calorie_goal": 2200,
            "water_goal": 2500,
            "step_goal": 10000
        }
        
        await self.db.users.insert_one(user_doc)
        
        # Create session
        session_doc = {
            "user_id": self.user_id,
            "session_token": self.session_token,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "created_at": datetime.now(timezone.utc)
        }
        
        await self.db.user_sessions.insert_one(session_doc)
        
        print(f"✅ Created user: {self.user_id}")
        print(f"✅ Created session: {self.session_token}")
    
    def get_headers(self):
        """Get headers with authentication"""
        return {
            "Authorization": f"Bearer {self.session_token}",
            "Content-Type": "application/json"
        }
    
    async def log_test_result(self, endpoint, method, success, details="", response_data=None):
        """Log test result"""
        result = {
            "endpoint": endpoint,
            "method": method,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        print(f"{status} {method} {endpoint}: {details}")
    
    # ==================== AUTH ENDPOINTS ====================
    
    async def test_auth_me(self):
        """Test GET /api/auth/me"""
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/auth/me",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("user_id") == self.user_id:
                    await self.log_test_result("/auth/me", "GET", True, "User data retrieved successfully", data)
                else:
                    await self.log_test_result("/auth/me", "GET", False, f"User ID mismatch: expected {self.user_id}, got {data.get('user_id')}")
            else:
                await self.log_test_result("/auth/me", "GET", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/auth/me", "GET", False, f"Exception: {str(e)}")
    
    async def test_auth_logout(self):
        """Test POST /api/auth/logout"""
        try:
            response = await self.client.post(
                f"{BACKEND_URL}/auth/logout",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                await self.log_test_result("/auth/logout", "POST", True, "Logout successful")
                # Recreate session for further tests
                await self.create_test_user()
            else:
                await self.log_test_result("/auth/logout", "POST", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/auth/logout", "POST", False, f"Exception: {str(e)}")
    
    async def test_auth_profile_update(self):
        """Test PUT /api/auth/profile"""
        try:
            profile_data = {
                "height": 180.0,
                "weight": 75.0,
                "age": 32,
                "gender": "male",
                "activity_level": "active"
            }
            
            response = await self.client.put(
                f"{BACKEND_URL}/auth/profile",
                headers=self.get_headers(),
                json=profile_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("height") == 180.0 and data.get("daily_calorie_goal"):
                    await self.log_test_result("/auth/profile", "PUT", True, "Profile updated with calorie goal calculation", data)
                else:
                    await self.log_test_result("/auth/profile", "PUT", False, "Profile update incomplete or calorie goal not calculated")
            else:
                await self.log_test_result("/auth/profile", "PUT", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/auth/profile", "PUT", False, f"Exception: {str(e)}")
    
    # ==================== USER ENDPOINTS ====================
    
    async def test_user_profile(self):
        """Test GET /api/user/profile"""
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/user/profile",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("user_id") == self.user_id:
                    await self.log_test_result("/user/profile", "GET", True, "User profile retrieved successfully", data)
                else:
                    await self.log_test_result("/user/profile", "GET", False, "User profile data mismatch")
            else:
                await self.log_test_result("/user/profile", "GET", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/user/profile", "GET", False, f"Exception: {str(e)}")
    
    async def test_user_goals_update(self):
        """Test PUT /api/user/goals"""
        try:
            goals_data = {
                "daily_calorie_goal": 2500,
                "water_goal": 3000,
                "step_goal": 12000
            }
            
            response = await self.client.put(
                f"{BACKEND_URL}/user/goals",
                headers=self.get_headers(),
                json=goals_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("daily_calorie_goal") == 2500 and 
                    data.get("water_goal") == 3000 and 
                    data.get("step_goal") == 12000):
                    await self.log_test_result("/user/goals", "PUT", True, "Goals updated successfully", data)
                else:
                    await self.log_test_result("/user/goals", "PUT", False, "Goals update incomplete")
            else:
                await self.log_test_result("/user/goals", "PUT", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/user/goals", "PUT", False, f"Exception: {str(e)}")
    
    # ==================== FOOD ENDPOINTS ====================
    
    def get_sample_food_image_base64(self):
        """Get a sample food image in base64 format"""
        # A proper small JPEG image (10x10 pixels) in base64 - this should work with the LLM API
        return "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAKAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A"
    
    async def test_food_analyze(self):
        """Test POST /api/food/analyze"""
        try:
            analyze_data = {
                "image_base64": self.get_sample_food_image_base64()
            }
            
            response = await self.client.post(
                f"{BACKEND_URL}/food/analyze",
                headers=self.get_headers(),
                json=analyze_data
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["calories", "protein", "carbs", "fat", "description"]
                if all(field in data for field in required_fields):
                    await self.log_test_result("/food/analyze", "POST", True, "Food analysis successful", data)
                else:
                    await self.log_test_result("/food/analyze", "POST", False, f"Missing required fields in response: {data}")
            else:
                await self.log_test_result("/food/analyze", "POST", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/food/analyze", "POST", False, f"Exception: {str(e)}")
    
    async def test_food_add_meal(self):
        """Test POST /api/food/add-meal"""
        try:
            meal_data = {
                "name": "Grilled Chicken Breast",
                "calories": 165,
                "protein": 31.0,
                "carbs": 0.0,
                "fat": 3.6,
                "image_base64": self.get_sample_food_image_base64(),
                "meal_type": "lunch"
            }
            
            response = await self.client.post(
                f"{BACKEND_URL}/food/add-meal",
                headers=self.get_headers(),
                json=meal_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("name") == "Grilled Chicken Breast" and 
                    data.get("user_id") == self.user_id and
                    data.get("meal_id")):
                    await self.log_test_result("/food/add-meal", "POST", True, "Meal added successfully", data)
                else:
                    await self.log_test_result("/food/add-meal", "POST", False, "Meal data incomplete or incorrect")
            else:
                await self.log_test_result("/food/add-meal", "POST", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/food/add-meal", "POST", False, f"Exception: {str(e)}")
    
    async def test_food_today(self):
        """Test GET /api/food/today"""
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/food/today",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    await self.log_test_result("/food/today", "GET", True, f"Retrieved {len(data)} meals for today", data)
                else:
                    await self.log_test_result("/food/today", "GET", False, "Response is not a list")
            else:
                await self.log_test_result("/food/today", "GET", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/food/today", "GET", False, f"Exception: {str(e)}")
    
    async def test_food_daily_summary(self):
        """Test GET /api/food/daily-summary"""
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/food/daily-summary",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["date", "total_calories", "total_protein", "total_carbs", "total_fat", "meals"]
                if all(field in data for field in required_fields):
                    await self.log_test_result("/food/daily-summary", "GET", True, "Daily summary retrieved successfully", data)
                else:
                    await self.log_test_result("/food/daily-summary", "GET", False, f"Missing required fields in response: {data}")
            else:
                await self.log_test_result("/food/daily-summary", "GET", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/food/daily-summary", "GET", False, f"Exception: {str(e)}")
    
    async def test_food_database(self):
        """Test GET /api/food/database"""
        try:
            # Test Turkish (default)
            response = await self.client.get(
                f"{BACKEND_URL}/food/database",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check if first item has Turkish name
                    first_item = data[0]
                    if "Tavuk" in first_item.get("name", ""):
                        await self.log_test_result("/food/database", "GET", True, f"Turkish food database retrieved with {len(data)} items", {"count": len(data), "sample": first_item})
                    else:
                        await self.log_test_result("/food/database", "GET", False, "Turkish localization not working properly")
                else:
                    await self.log_test_result("/food/database", "GET", False, "Empty or invalid food database")
            else:
                await self.log_test_result("/food/database", "GET", False, f"Status: {response.status_code}, Response: {response.text}")
            
            # Test English
            response_en = await self.client.get(
                f"{BACKEND_URL}/food/database?lang=en",
                headers=self.get_headers()
            )
            
            if response_en.status_code == 200:
                data_en = response_en.json()
                if isinstance(data_en, list) and len(data_en) > 0:
                    first_item_en = data_en[0]
                    if "Chicken" in first_item_en.get("name", ""):
                        await self.log_test_result("/food/database?lang=en", "GET", True, f"English food database retrieved with {len(data_en)} items", {"count": len(data_en), "sample": first_item_en})
                    else:
                        await self.log_test_result("/food/database?lang=en", "GET", False, "English localization not working properly")
                else:
                    await self.log_test_result("/food/database?lang=en", "GET", False, "Empty or invalid English food database")
            else:
                await self.log_test_result("/food/database?lang=en", "GET", False, f"Status: {response_en.status_code}, Response: {response_en.text}")
                
        except Exception as e:
            await self.log_test_result("/food/database", "GET", False, f"Exception: {str(e)}")
    
    # ==================== WATER ENDPOINTS ====================
    
    async def test_water_add(self):
        """Test POST /api/water/add"""
        try:
            water_data = {
                "amount": 250
            }
            
            response = await self.client.post(
                f"{BACKEND_URL}/water/add",
                headers=self.get_headers(),
                json=water_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Water added successfully":
                    await self.log_test_result("/water/add", "POST", True, "Water intake added successfully", data)
                else:
                    await self.log_test_result("/water/add", "POST", False, "Unexpected response message")
            else:
                await self.log_test_result("/water/add", "POST", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/water/add", "POST", False, f"Exception: {str(e)}")
    
    async def test_water_today(self):
        """Test GET /api/water/today"""
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/water/today",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if "total_amount" in data and "logs" in data:
                    await self.log_test_result("/water/today", "GET", True, f"Today's water intake: {data.get('total_amount')}ml", data)
                else:
                    await self.log_test_result("/water/today", "GET", False, "Missing required fields in water response")
            else:
                await self.log_test_result("/water/today", "GET", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/water/today", "GET", False, f"Exception: {str(e)}")
    
    async def test_water_weekly(self):
        """Test GET /api/water/weekly"""
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/water/weekly",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) == 7:
                    await self.log_test_result("/water/weekly", "GET", True, f"Weekly water data retrieved with {len(data)} days", data)
                else:
                    await self.log_test_result("/water/weekly", "GET", False, f"Expected 7 days of data, got {len(data) if isinstance(data, list) else 'non-list'}")
            else:
                await self.log_test_result("/water/weekly", "GET", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/water/weekly", "GET", False, f"Exception: {str(e)}")
    
    # ==================== STEPS ENDPOINTS ====================
    
    async def test_steps_sync(self):
        """Test POST /api/steps/sync"""
        try:
            steps_data = {
                "steps": 8500,
                "source": "google_fit"
            }
            
            response = await self.client.post(
                f"{BACKEND_URL}/steps/sync",
                headers=self.get_headers(),
                json=steps_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Steps synced successfully":
                    await self.log_test_result("/steps/sync", "POST", True, "Steps synced successfully", data)
                else:
                    await self.log_test_result("/steps/sync", "POST", False, "Unexpected response message")
            else:
                await self.log_test_result("/steps/sync", "POST", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/steps/sync", "POST", False, f"Exception: {str(e)}")
    
    async def test_steps_today(self):
        """Test GET /api/steps/today"""
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/steps/today",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if "steps" in data and "source" in data:
                    await self.log_test_result("/steps/today", "GET", True, f"Today's steps: {data.get('steps')} from {data.get('source')}", data)
                else:
                    await self.log_test_result("/steps/today", "GET", False, "Missing required fields in steps response")
            else:
                await self.log_test_result("/steps/today", "GET", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/steps/today", "GET", False, f"Exception: {str(e)}")
    
    async def test_steps_manual(self):
        """Test POST /api/steps/manual"""
        try:
            steps_data = {
                "steps": 12000
            }
            
            response = await self.client.post(
                f"{BACKEND_URL}/steps/manual",
                headers=self.get_headers(),
                json=steps_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "Steps added successfully":
                    await self.log_test_result("/steps/manual", "POST", True, "Manual steps added successfully", data)
                else:
                    await self.log_test_result("/steps/manual", "POST", False, "Unexpected response message")
            else:
                await self.log_test_result("/steps/manual", "POST", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/steps/manual", "POST", False, f"Exception: {str(e)}")
    
    # ==================== VITAMINS ENDPOINTS ====================
    
    async def test_vitamins_templates(self):
        """Test GET /api/vitamins/templates"""
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/vitamins/templates"
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    await self.log_test_result("/vitamins/templates", "GET", True, f"Retrieved {len(data)} vitamin templates", data)
                else:
                    await self.log_test_result("/vitamins/templates", "GET", False, "Empty or invalid vitamin templates")
            else:
                await self.log_test_result("/vitamins/templates", "GET", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/vitamins/templates", "GET", False, f"Exception: {str(e)}")
    
    async def test_vitamins_user(self):
        """Test GET /api/vitamins/user"""
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/vitamins/user",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    await self.log_test_result("/vitamins/user", "GET", True, f"Retrieved {len(data)} user vitamins", data)
                else:
                    await self.log_test_result("/vitamins/user", "GET", False, "Response is not a list")
            else:
                await self.log_test_result("/vitamins/user", "GET", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/vitamins/user", "GET", False, f"Exception: {str(e)}")
    
    async def test_vitamins_add(self):
        """Test POST /api/vitamins/add"""
        try:
            vitamin_data = {
                "name": "B12 Vitamini",
                "time": "Her Sabah"
            }
            
            response = await self.client.post(
                f"{BACKEND_URL}/vitamins/add",
                headers=self.get_headers(),
                json=vitamin_data
            )
            
            if response.status_code == 200:
                data = response.json()
                if (data.get("name") == "B12 Vitamini" and 
                    data.get("user_id") == self.user_id and
                    data.get("vitamin_id")):
                    await self.log_test_result("/vitamins/add", "POST", True, "Vitamin added successfully", data)
                    # Store vitamin_id for toggle test
                    self.test_vitamin_id = data.get("vitamin_id")
                else:
                    await self.log_test_result("/vitamins/add", "POST", False, "Vitamin data incomplete or incorrect")
            else:
                await self.log_test_result("/vitamins/add", "POST", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/vitamins/add", "POST", False, f"Exception: {str(e)}")
    
    async def test_vitamins_toggle(self):
        """Test PUT /api/vitamins/toggle"""
        try:
            # First add a vitamin if we don't have one
            if not hasattr(self, 'test_vitamin_id'):
                await self.test_vitamins_add()
            
            if hasattr(self, 'test_vitamin_id'):
                toggle_data = {
                    "vitamin_id": self.test_vitamin_id
                }
                
                response = await self.client.put(
                    f"{BACKEND_URL}/vitamins/toggle",
                    headers=self.get_headers(),
                    json=toggle_data
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "message" in data and "is_taken" in data:
                        await self.log_test_result("/vitamins/toggle", "PUT", True, f"Vitamin toggled: {data.get('is_taken')}", data)
                    else:
                        await self.log_test_result("/vitamins/toggle", "PUT", False, "Missing required fields in toggle response")
                else:
                    await self.log_test_result("/vitamins/toggle", "PUT", False, f"Status: {response.status_code}, Response: {response.text}")
            else:
                await self.log_test_result("/vitamins/toggle", "PUT", False, "No vitamin ID available for toggle test")
                
        except Exception as e:
            await self.log_test_result("/vitamins/toggle", "PUT", False, f"Exception: {str(e)}")
    
    async def test_vitamins_today(self):
        """Test GET /api/vitamins/today"""
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/vitamins/today",
                headers=self.get_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    await self.log_test_result("/vitamins/today", "GET", True, f"Retrieved {len(data)} vitamins for today (with daily reset logic)", data)
                else:
                    await self.log_test_result("/vitamins/today", "GET", False, "Response is not a list")
            else:
                await self.log_test_result("/vitamins/today", "GET", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            await self.log_test_result("/vitamins/today", "GET", False, f"Exception: {str(e)}")
    
    # ==================== MAIN TEST RUNNER ====================
    
    async def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting CalorieDiet Backend API Tests")
        print("=" * 60)
        
        await self.setup()
        
        try:
            # Auth endpoints
            print("\n📋 Testing Auth Endpoints...")
            await self.test_auth_me()
            await self.test_auth_profile_update()
            await self.test_auth_logout()  # This will recreate session
            
            # User endpoints
            print("\n👤 Testing User Endpoints...")
            await self.test_user_profile()
            await self.test_user_goals_update()
            
            # Food endpoints
            print("\n🍽️ Testing Food Endpoints...")
            await self.test_food_analyze()
            await self.test_food_add_meal()
            await self.test_food_today()
            await self.test_food_daily_summary()
            await self.test_food_database()
            
            # Water endpoints
            print("\n💧 Testing Water Endpoints...")
            await self.test_water_add()
            await self.test_water_today()
            await self.test_water_weekly()
            
            # Steps endpoints
            print("\n👟 Testing Steps Endpoints...")
            await self.test_steps_sync()
            await self.test_steps_today()
            await self.test_steps_manual()
            
            # Vitamins endpoints
            print("\n💊 Testing Vitamins Endpoints...")
            await self.test_vitamins_templates()
            await self.test_vitamins_user()
            await self.test_vitamins_add()
            await self.test_vitamins_toggle()
            await self.test_vitamins_today()
            
        finally:
            await self.cleanup()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  ❌ {result['method']} {result['endpoint']}: {result['details']}")
        
        print("\n" + "=" * 60)

async def main():
    """Main test function"""
    tester = CalorieDietTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())