#!/usr/bin/env python3
"""
FINNHUB-only hourly check:
- Load input JSON (same format as your msg file): must have ticker; ideally company, start/end.
- Fetch last-hour news via Finnhub for that ticker.
- Build top-level summary+keywords -> data/newsummary.json
- Compare input's summary+keywords to data/newsummary.json
  * If similar (keywords Jaccard OR summary cosine), write data/match_<TICKER>_<UTC>.json
  * If not similar, do nothing.
- Delete data/newsummary.json at the end to avoid disk use.

.env:
  FINNHUB_API_KEY=your_key_here

Requirements:
  pip install requests python-dotenv beautifulsoup4
"""

from __future__ import annotations
import os, json, re, argparse
from pathlib import Path
from datetime import datetime, timedelta, timezone
from collections import Counter
import math
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
load_dotenv()
api_key = os.getenv("FINNHUB_API_KEY", "").strip()
if not api_key:
    raise SystemExit("Missing FINNHUB_API_KEY in .env")

# ---------- config ----------
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

# similarity thresholds (tune as needed)
KEYWORD_JACCARD_MIN = float(os.getenv("KEYWORD_JACCARD_MIN", "0.30"))
SUMMARY_COSINE_MIN  = float(os.getenv("SUMMARY_COSINE_MIN",  "0.20"))

def _mask(k: str) -> str:
    if not k:
        return "NO-KEY"
    if len(k) >= 8:
        return f"{k[:4]}…{k[-4:]}"
    return "*" * len(k)
# ---------- input ----------

def read_msg_json(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        msg = json.load(f)
    if "ticker" not in msg:
        raise ValueError(f"Missing 'ticker' in {path}")
    # optional keys we try to pass through
    # 'company', 'startDate'/'start', 'endDate'/'end'
    return msg

def parse_args():
    ap = argparse.ArgumentParser()
    ap.add_argument("--msg", default="message.json", help="Path to input msg JSON.")
    ap.add_argument("--lookback_min", type=int, default=1440, help="Minutes to look back (default 24 hrs).")
    ap.add_argument("--timeout", type=int, default=15, help="HTTP timeout seconds for article fetch.")
    return ap.parse_args()

# ---------- finnhub fetch ----------
def fetch_company_news(api_key: str, symbol: str, dt_from: datetime, dt_to: datetime):
    url = "https://finnhub.io/api/v1/company-news"
    params = {
        "symbol": symbol.upper(),
        "from": dt_from.strftime("%Y-%m-%d"),
        "to": dt_to.strftime("%Y-%m-%d"),
        "token": api_key,
    }
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    items = r.json() or []
    out = []
    for it in items:
        title = it.get("headline") or it.get("title") or ""
        url_ = it.get("url") or ""
        src = it.get("source") or "finnhub"
        ts = it.get("datetime") or it.get("time")
        if not (title and url_ and ts):
            continue
        try:
            published_at = datetime.fromtimestamp(float(ts), tz=timezone.utc)
        except Exception:
            continue
        if dt_from <= published_at <= dt_to:
            out.append({
                "title": title,
                "url": url_,
                "source": src,
                "published_at": published_at.isoformat(),
            })
    print(f"[API] {symbol} raw_count={len(items)} (date range {params['from']}..{params['to']})  kept_last_hour={len(out)}")
    if out:
        print("[API] sample timestamps (UTC):", [e["published_at"] for e in out[:3]])

    return out

# ---------- page text (optional, for keywords) ----------
def fetch_page_text(url: str, timeout: int = 15, max_chars: int = 4000) -> str:
    try:
        resp = requests.get(url, timeout=timeout, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        html = resp.text
        soup = BeautifulSoup(html, "html.parser")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        article = soup.find("article")
        if article:
            paragraphs = [p.get_text(" ", strip=True) for p in article.find_all("p")]
            text = " ".join([t for t in paragraphs if t])
        else:
            paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
            text = " ".join([t for t in paragraphs if t])
        if not text:
            text = soup.get_text(" ", strip=True)
        text = re.sub(r"\s+", " ", text).strip()
        return text[:max_chars]
    except Exception:
        return ""

# ---------- cheap keywords + summary ----------
_STOPWORDS = {
    "the","a","an","and","or","of","in","on","to","for","with","at","by",
    "from","as","is","are","was","were","be","been","this","that","it",
    "its","into","their","your","our","you","we","they","he","she","his",
    "her","but","about","over","after","before","more","most","than","via",
}

def tokenize(text: str):
    return re.findall(r"[A-Za-z0-9][A-Za-z0-9\-]+", text.lower())

def top_keywords(texts, k=10):
    cnt = Counter()
    for t in texts:
        for w in tokenize(t):
            if w in _STOPWORDS or len(w) < 3:
                continue
            cnt[w] += 1
    return [w for w, _ in cnt.most_common(k)]

def synthesize_summary(ticker: str, n_articles: int, kw: list, src_counts: Counter) -> str:
    if n_articles == 0:
        return f"No new {ticker} articles were detected in the last hour."
    top_src = ", ".join([f"{s}({n})" for s, n in src_counts.most_common(3)])
    keyphrase = ", ".join(kw[:5]) if kw else "various topics"
    return (
        f"In the past hour, {n_articles} new {ticker} article(s) were published"
        + (f" across {top_src}. " if top_src else ". ")
        + f"Common themes include: {keyphrase}."
    )

# ---------- similarity ----------
def jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0

def bow_counts(text: str) -> Counter:
    c = Counter()
    for w in tokenize(text):
        if w in _STOPWORDS or len(w) < 3:
            continue
        c[w] += 1
    return c

def cosine_counts(c1: Counter, c2: Counter) -> float:
    if not c1 or not c2:
        return 0.0
    # dot
    dot = sum(c1[w] * c2.get(w, 0) for w in c1)
    # norms
    n1 = math.sqrt(sum(v*v for v in c1.values()))
    n2 = math.sqrt(sum(v*v for v in c2.values()))
    if n1 == 0 or n2 == 0:
        return 0.0
    return dot / (n1 * n2)

# ---------- main ----------
def main():
    args = parse_args()
    load_dotenv()
    api_key = os.getenv("FINNHUB_API_KEY", "").strip()
    if not api_key:
        raise SystemExit("Missing FINNHUB_API_KEY in .env")

    # Load original input JSON
    msg = read_msg_json(args.msg)
    ticker = (msg.get("ticker") or "").strip().upper()
    if not ticker:
        raise SystemExit("Need 'ticker' in the input JSON.")
    company = (msg.get("company") or "").strip()
    # start/end are optional; try both naming styles
    startDate = msg.get("startDate") or msg.get("start") or ""
    endDate   = msg.get("endDate")   or msg.get("end")   or ""

    # Fetch last-hour news and build newsummary.json
    now = datetime.now(timezone.utc)
    since = now - timedelta(minutes=args.lookback_min)
    print(f"[WIN] UTC since={since.isoformat()}  now={now.isoformat()}  lookback_min={args.lookback_min}")

    items = fetch_company_news(api_key, ticker, since, now)

    texts_for_kw = []
    src_counts = Counter()
    for a in items:
        src_counts[a.get("source","")] += 1
        page_text = fetch_page_text(a["url"], timeout=args.timeout)
        texts_for_kw.append((a["title"] + " " + page_text).strip())

    new_keywords = top_keywords(texts_for_kw, k=10) if items else []
    new_summary  = synthesize_summary(ticker, len(items), new_keywords, src_counts)

    new_top = {
        "ticker": ticker,
        "window": {"from": since.isoformat(), "to": now.isoformat(), "minutes": args.lookback_min},
        "summary": new_summary,
        "keywords": new_keywords
    }

    new_path = DATA_DIR / "newsummary.json"
    new_path.write_text(json.dumps(new_top, ensure_ascii=False, indent=2), encoding="utf-8")

    # ----- compare input JSON vs newsummary.json -----
    # Old (from input JSON)
    old_summary = (msg.get("summary") or "").strip()
    old_keywords_list = msg.get("keywords") or []
    old_keywords = set(w.lower() for w in old_keywords_list if isinstance(w, str))

    # New (we just built)
    new_keywords_set = set(w.lower() for w in new_keywords)
    kw_jacc = jaccard(old_keywords, new_keywords_set)

    sum_cos = cosine_counts(bow_counts(old_summary), bow_counts(new_summary))

    is_similar = (kw_jacc >= KEYWORD_JACCARD_MIN) or (sum_cos >= SUMMARY_COSINE_MIN)

    # If similar -> write match JSON with ticker, company, startDate, endDate
    if is_similar:
        stamp = now.strftime("%Y%m%dT%H%M%SZ")
        match = {
            "ticker": ticker,
            "company": company,
            "startDate": startDate,
            "endDate": endDate
        }
        out_match = DATA_DIR / f"match_{ticker}_{stamp}.json"
        out_match.write_text(json.dumps(match, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"[{ticker}] SIMILAR: kw_jacc={kw_jacc:.2f}, sum_cos={sum_cos:.2f} → wrote {out_match}")
    else:
        print(f"[{ticker}] NOT similar: kw_jacc={kw_jacc:.2f}, sum_cos={sum_cos:.2f} → no output")

    # Always delete newsummary.json to avoid disk growth
    try:
        new_path.unlink()
    except FileNotFoundError:
        pass

if __name__ == "__main__":
    main()
