"""
Test script to verify server can start correctly
"""
import sys
import asyncio

print("=" * 60)
print("Testing Backend Server Initialization")
print("=" * 60)

# Test 1: Import database
print("\n1. Testing database import...")
try:
    from database import db_client, init_db
    print("   [OK] Database module imported successfully")
    print(f"   [OK] Using: {type(db_client).__name__}")
except Exception as e:
    print(f"   [FAIL] Failed to import database: {e}")
    sys.exit(1)

# Test 2: Initialize database
print("\n2. Testing database initialization...")
try:
    asyncio.run(init_db())
    print("   [OK] Database initialized successfully")
except Exception as e:
    print(f"   [FAIL] Failed to initialize database: {e}")
    sys.exit(1)

# Test 3: Import agents
print("\n3. Testing agents import...")
try:
    from agents.agent_loader import AGENT_DEFINITIONS
    print(f"   [OK] Agents loaded: {len(AGENT_DEFINITIONS)} agents")
    print(f"   [OK] Agent IDs: {list(AGENT_DEFINITIONS.keys())}")
except Exception as e:
    print(f"   [FAIL] Failed to load agents: {e}")
    sys.exit(1)

# Test 4: Import FastAPI app
print("\n4. Testing FastAPI app import...")
try:
    from main import app
    print("   [OK] FastAPI app imported successfully")
except Exception as e:
    print(f"   [FAIL] Failed to import app: {e}")
    sys.exit(1)

# Test 5: Test agents endpoint
print("\n5. Testing agents endpoint...")
try:
    from fastapi.testclient import TestClient
    client = TestClient(app)
    response = client.get('/api/agents')
    if response.status_code == 200:
        data = response.json()
        print(f"   [OK] Agents endpoint working: {data['total']} agents returned")
    else:
        print(f"   [FAIL] Agents endpoint failed with status {response.status_code}")
        sys.exit(1)
except Exception as e:
    print(f"   [FAIL] Failed to test endpoint: {e}")
    sys.exit(1)

print("\n" + "=" * 60)
print("[SUCCESS] ALL TESTS PASSED!")
print("=" * 60)
print("\nYou can now start the server with:")
print("  python main.py")
print("\nOr:")
print("  uvicorn main:app --reload --host 127.0.0.1 --port 8000")
print("=" * 60)

# Made with Bob
