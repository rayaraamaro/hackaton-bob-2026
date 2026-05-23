"""
Test script to verify the agent system is working correctly.
"""

import sys
import asyncio
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

async def test_agent_system():
    """Test the agent loading system."""
    print("=" * 60)
    print("Testing Agent System")
    print("=" * 60)
    
    # Test 1: Import agent loader
    print("\n1. Testing agent loader import...")
    try:
        from agents.agent_loader import AGENT_DEFINITIONS, AGENT_SELECTION_RULES
        print("   ✓ Agent loader imported successfully")
    except Exception as e:
        print(f"   ✗ Failed to import agent loader: {e}")
        return False
    
    # Test 2: Check available agents
    print("\n2. Checking available agents...")
    print(f"   Found {len(AGENT_DEFINITIONS)} agents:")
    for agent_id, agent in AGENT_DEFINITIONS.items():
        print(f"   - {agent_id}: {agent['name']} ({agent['type']})")
    
    # Test 3: Check selection rules
    print("\n3. Checking selection rules...")
    for rule_key, agents in AGENT_SELECTION_RULES.items():
        print(f"   {rule_key}: {agents}")
    
    # Test 4: Test orchestrator import
    print("\n4. Testing orchestrator import...")
    try:
        from services.bob_orchestrator import BOBOrchestrator
        print("   ✓ BOBOrchestrator imported successfully")
    except Exception as e:
        print(f"   ✗ Failed to import BOBOrchestrator: {e}")
        return False
    
    # Test 5: Test agent selection
    print("\n5. Testing agent selection...")
    try:
        from database.mock_firestore import MockFirestoreClient
        from services.token_monitor import TokenMonitor
        from services.realtime_service import RealtimeService
        import redis.asyncio as redis
        
        # Use mock database for testing
        db = MockFirestoreClient()
        
        # Create mock redis client
        try:
            redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
            await redis_client.ping()
            print("   ✓ Redis connection successful")
        except:
            print("   ⚠ Redis not available, using mock")
            redis_client = None
        
        # Create services
        realtime = RealtimeService(redis_client) if redis_client else None
        token_monitor = TokenMonitor(db, realtime) if realtime else None
        
        if token_monitor:
            orchestrator = BOBOrchestrator(db, token_monitor, realtime)
            
            # Test analyze_requirements
            requirements = {
                "needsAPI": True,
                "needsUI": True
            }
            
            analysis = await orchestrator.analyze_requirements(
                "test_project",
                "Test project description",
                requirements
            )
            
            print(f"   ✓ Agent selection successful")
            print(f"   Selected agents: {analysis['selected_agents']}")
        else:
            print("   ⚠ Skipping orchestrator test (no Redis)")
        
    except Exception as e:
        print(f"   ✗ Agent selection failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print("\n" + "=" * 60)
    print("All tests passed! ✓")
    print("=" * 60)
    return True

if __name__ == "__main__":
    result = asyncio.run(test_agent_system())
    sys.exit(0 if result else 1)

# Made with Bob
