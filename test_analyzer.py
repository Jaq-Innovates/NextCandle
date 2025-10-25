## test_analyzer.py is an optional script that lets you test your analyzer in isolation,
## either by running it directly from the command line or by simulating API calls through a small Flask server.

# test_analyzer.py
import json
from analyzer import analyze_articles

# Load your test JSON file
with open("test_data.json") as f:
    data = json.load(f)

# Run your analyzer function
result = analyze_articles(data)

# Pretty-print the output
print(json.dumps(result, indent=2))
