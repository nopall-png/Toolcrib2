import requests

BASE_URL = "http://localhost:8000/api/ai"

endpoints = [
    "/dashboard-summary",
    "/minmax",
    "/inventory-optimization",
    "/critical-spares",
    "/duplicates",
]

def run_tests():
    print("🚀 Memulai Automated Test untuk API AI Prediction...\n")
    all_passed = True
    
    for endpoint in endpoints:
        url = f"{BASE_URL}{endpoint}"
        try:
            print(f"Testing {url} ...", end=" ")
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                data = res.json()
                if "error" in data:
                    print(f"❌ FAILED (API returned error: {data['error'][:100]})")
                    all_passed = False
                else:
                    print("✅ PASSED")
            else:
                print(f"❌ FAILED (Status: {res.status_code})")
                all_passed = False
        except Exception as e:
            print(f"❌ ERROR: {e}")
            all_passed = False

    # Test Forecast Endpoint explicitly
    print(f"Testing {BASE_URL}/forecast/BRG-CUT-015 ...", end=" ")
    try:
        res = requests.get(f"{BASE_URL}/forecast/BRG-CUT-015", timeout=10)
        if res.status_code == 200 or res.status_code == 404:
            print("✅ PASSED")
        else:
            print(f"❌ FAILED (Status: {res.status_code})")
            all_passed = False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        all_passed = False

    print("\n===================================")
    if all_passed:
        print("✅ SEMUA ENDPOINT LULUS TESTING!")
    else:
        print("❌ ADA ENDPOINT YANG GAGAL TESTING!")

if __name__ == "__main__":
    run_tests()
