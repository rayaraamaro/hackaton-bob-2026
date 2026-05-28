import requests
import json

# Test Gemini health
print("=" * 80)
print("Testing Gemini Health Endpoint")
print("=" * 80)
response = requests.get("http://localhost:8000/api/gemini/health")
print(f"Status: {response.status_code}")
print(json.dumps(response.json(), indent=2))

# Test Gemini analysis
print("\n" + "=" * 80)
print("Testing Gemini Project Analysis")
print("=" * 80)
data = {
    "description": "Create a simple todo list app with a database",
    "requirements": {
        "needsDatabase": True,
        "needsAuth": False,
        "needsPayment": False,
        "needsFAQ": False
    }
}
print(f"Request: {json.dumps(data, indent=2)}")
print("\nSending request to Gemini...")
response = requests.post("http://localhost:8000/api/gemini/analyze-project", json=data)
print(f"\nStatus: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    print("\nSUCCESS! Gemini Analysis Result:")
    print(json.dumps(result, indent=2))
    
    if result.get("success"):
        print("\nSummary:")
        print(f"  - Suggested Agents: {len(result.get('suggested_agents', []))}")
        print(f"  - Estimated Tokens: {result.get('total_estimated_tokens', 0)}")
        print(f"  - Estimated Cost: ${result.get('total_estimated_cost', 0):.4f}")
        print("\nAgents:")
        for agent in result.get('suggested_agents', []):
            print(f"  - {agent['agent_name']} ({agent['agent_id']})")
            print(f"    Reason: {agent['reason']}")
            print(f"    Tokens: {agent['estimated_tokens']}")
else:
    print(f"ERROR: {response.text}")

print("\n" + "=" * 80)
print("Test Complete!")
print("=" * 80)

# Made with Bob
