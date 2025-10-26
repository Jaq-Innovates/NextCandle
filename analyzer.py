## analyzer.py is the main script that connects to Google’s Gemini 1.5 model, processes article text
## about a specific stock, and returns structured insights like sentiment, keywords, and a summary — it’s the core 
## logic you’ll hand off to the backend teammate.

import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# --- 1. Load API key safely ---
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# --- 2. Define main analysis function ---
def analyze_articles(data: dict) -> dict:

    ticker = data.get("ticker", "UNKNOWN")
    start_date = data.get("start_date", "N/A")
    end_date = data.get("end_date", "N/A")
    net_gain = data.get("net_gain", 0.0)
    articles = data.get("articles", [])

    # Combine articles into readable format
    combined_articles = [
        f"{i+1}. {a.get('title', '')} — {a.get('content', '')}"
        for i, a in enumerate(articles)
    ]

    joined_articles = "\n".join(combined_articles)

    model = genai.GenerativeModel("gemini-2.5-flash")

    # --- Prompt 1: Big Idea Summary ---
    prompt_summary = f"""
    You are analyzing several news articles about the company {ticker} from {start_date} to {end_date}.

    Write a short summary (3–4 sentences) that clearly explains what is happening with {ticker}
    and how these events might connect to the company’s stock. Use simple, everyday language
    so that someone who knows nothing about finance can understand.

    Avoid using financial or technical terms when possible. 
    If you must use a finance term (like “margins” or “earnings”), include a short explanation
    of what it means in plain English. Focus on what’s happening in the real world,
    why people might be excited or worried, and what that means for {ticker} as a company.

    Articles:{joined_articles}"""

    # --- Prompt 2: Stock Movement Prediction ---
    prompt_prediction = f"""
    You are analyzing recent news articles about the stock {ticker}. Do NOT use or assume any knowledge of the stock’s actual price movement.

    Based ONLY on the tone, language, and overall context of these articles, predict whether the stock should 
    logically **increase** or **decrease** in value if investors were reacting purely to this news. Respond with ONLY one word: "increase" or "decrease".
   
    Articles: {joined_articles}"""

    # --- Prompt 3: Keyword Extraction ---
    prompt_keywords = f"""
    Extract 10 important keywords or short phrases that best represent the main themes or topics from the following articles about {ticker}.
    These should highlight the key factors influencing the stock during this time, they should also include negative or positive connotation, not just general key words that could go either way.

    Return the result as a numbered list of 10 concise keywords or phrases.

    Articles:{joined_articles}"""

    # --- Run all three prompts ---
    try:
        summary_resp = model.generate_content(prompt_summary)
        prediction_resp = model.generate_content(prompt_prediction)
        keywords_resp = model.generate_content(prompt_keywords)

        # Try to parse keywords into list
        raw_keywords = keywords_resp.text.strip().splitlines()
        keywords = [k.strip(" -1234567890.").strip() for k in raw_keywords if k.strip()]

        result = {
            "summary": summary_resp.text.strip(),
            "prediction": prediction_resp.text.strip(),
            "keywords": keywords[:10]  # ensure max 10
        }

    except Exception as e:
        result = {"error": str(e)}

    return result


# --- 3. Stand-alone testing section ---
if __name__ == "__main__":
    # Load local test data
    with open("test_data.json") as f:
        sample_data = json.load(f)

    output = analyze_articles(sample_data)
    print(json.dumps(output, indent=2))
