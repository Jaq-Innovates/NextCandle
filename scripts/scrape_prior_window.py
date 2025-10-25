#!/usr/bin/env python
"""
NextCandle - Prior Window Scraper (Finnhub-only)

- Input: --ticker, --start, --end (YYYY-MM-DD)
- Resolve company name from ticker (yfinance)
- Fetch all company news from Finnhub for the 31 days BEFORE --start
- Compute % change and UP/DOWN label over [start, end)
- Save:
    data/<ticker>_<start>_<end>_summary.json
"""

import argparse, json, os, re, time
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
import requests, yfinance as yf
from bs4 import BeautifulSoup

# ---------- config ----------
LOOKBACK_DAYS_DEFAULT = 31
DATA_DIR = "data"
UA = {"User-Agent": "Mozilla/5.0 (NextCandle/1.0)"}
os.makedirs(DATA_DIR, exist_ok=True)

# ---------- utilities ----------

def parse_date(d: str) -> datetime:
    # MM-DD-YYYY -> timezone-aware UTC datetime
    return datetime.strptime(d, "%m-%d-%Y").replace(tzinfo=timezone.utc)

def clean_company_name(name: str) -> str:
    return re.sub(r'\b(Inc\.?|Incorporated|Corp\.?|Corporation|Ltd\.?|Limited|PLC)\b', '', name, flags=re.I).strip()

def resolve_company_name_from_ticker(ticker: str) -> str:
    t = yf.Ticker(ticker)
    name = None
    try:
        info = t.info
        name = info.get("longName") or info.get("shortName")
    except Exception:
        pass
    return clean_company_name(name) if name else ticker

def validate_ticker_has_data(ticker: str) -> bool:
    try:
        hist = yf.Ticker(ticker).history(period="5d")
        return not hist.empty
    except Exception:
        return False

def fetch_article_text(url: str, timeout: int = 12) -> str:
    try:
        r = requests.get(url, headers=UA, timeout=timeout)
        r.raise_for_status()
    except Exception:
        return ""
    try:
        soup = BeautifulSoup(r.text, "lxml")
        for tag in soup(["script", "style", "noscript"]):
            tag.extract()
        nodes = soup.select("article") or soup.select("main") or [soup.body]
        text = " ".join(n.get_text(" ", strip=True) for n in nodes if n)
        if not text:
            text = soup.get_text(" ", strip=True)
        return text[:8000]
    except Exception:
        return ""

def within_prior_window(iso_ts: Optional[str], start_dt: datetime, lookback_days: int) -> bool:
    if not iso_ts:
        return False
    try:
        ts = datetime.fromisoformat(iso_ts)
    except Exception:
        return False
    lb = start_dt - timedelta(days=lookback_days)
    return lb <= ts < start_dt

def window_change(ticker: str, start: str, end: str):
    df = yf.download(ticker, start=start, end=end, progress=False, auto_adjust=True)
    if df.empty:
        return None, None, None, None
    s_close = float(df["Close"].iloc[0])
    e_close = float(df["Close"].iloc[-1])
    pct = (e_close - s_close) / max(s_close, 1e-9)
    label = "UP" if pct > 0 else "DOWN"
    return s_close, e_close, pct, label

def canonical_url(u: str) -> str:
    if not u:
        return u
    u = re.sub(r"[?&]utm_[^&]+", "", u)
    u = re.sub(r"&+$", "", u)
    return u

def finnhub_company_news(ticker: str, start_dt: datetime, lookback_days: int) -> List[Dict]:
    """
    Fetch company news from Finnhub for the prior window:
    [start_dt - lookback_days, start_dt)
    """
    api_key = "d3u7t89r01qvr0dlsiegd3u7t89r01qvr0dlsif0"  # your key here

    if not api_key:
        print("[WARN] FINNHUB_API_KEY not set; skipping Finnhub fetch.")
        return []

    from_date = (start_dt - timedelta(days=lookback_days)).date().isoformat()
    to_date   = (start_dt - timedelta(days=1)).date().isoformat()

    url = "https://finnhub.io/api/v1/company-news"
    params = {
        "symbol": ticker, 
        "from": from_date, 
        "to": to_date, 
        "token": api_key
    }

    try:
        r = requests.get(url, params=params, headers=UA, timeout=15)
        r.raise_for_status()
        data = r.json() or []
    except Exception as e:
        print(f"[WARN] Finnhub request failed: {e}")
        return []

    out = []
    for item in data:
        ts = None
        try:
            ts = datetime.fromtimestamp(int(item.get("datetime", 0)), tz=timezone.utc).isoformat()
        except Exception:
            ts = None
        out.append({
            "title": item.get("headline"),
            "url": item.get("url"),
            "published_at": ts,
            "source": item.get("source"),
            "text": item.get("summary") or ""
        })
    return out

# ---------- main ----------

def main():
    ap = argparse.ArgumentParser(description="Scrape prior 31 days of Finnhub news and label window UP/DOWN.")
    ap.add_argument("--ticker", required=True, help="Ticker symbol, e.g., NVDA")
    ap.add_argument("--start",  required=True, help="MM-DD-YYYY (window start)")
    ap.add_argument("--end",    required=True, help="MM-DD-YYYY (window end)")
    ap.add_argument("--lookback", type=int, default=LOOKBACK_DAYS_DEFAULT)
    ap.add_argument("--fetch-text", action="store_true", help="Fetch and store article text (slower).")
    args = ap.parse_args()

    print("[DEBUG] args:", args)

    ticker  = args.ticker.strip().upper()
    start_dt = parse_date(args.start)
    end_dt   = parse_date(args.end)

    if end_dt <= start_dt:
        raise SystemExit("ERROR: --end must be AFTER --start (exclusive).")

    MIN_DAYS = 7
    MAX_DAYS = 28
    delta_days = (end_dt - start_dt).days
    if delta_days < MIN_DAYS or delta_days > MAX_DAYS:
        raise SystemExit(f"ERROR: time frame must be between {MIN_DAYS} and {MAX_DAYS} days (got {delta_days} days).")

    if not validate_ticker_has_data(ticker):
        print(f"[WARN] No recent data for {ticker}. It may be invalid/delisted.")

    company = resolve_company_name_from_ticker(ticker)
    print(f"[INFO] {ticker} -> company: {company}")

    start_iso = start_dt.date().isoformat()
    end_iso   = end_dt.date().isoformat()
    s_close, e_close, pct, label = window_change(ticker, start_iso, end_iso)
    if pct is None:
        raise SystemExit("ERROR: No price data returned for that window (check ticker or dates).")
    print(f"[PRICE] {ticker} {start_iso} → {end_iso}  change={pct:.2%}  label={label}")

    print(f"[NEWS] Fetching prior {args.lookback} days of Finnhub news for {ticker} …")

    entries = finnhub_company_news(ticker, start_dt, args.lookback)
    print(f"[NEWS] Finnhub returned {len(entries)} items (before filtering)")

    seen = set()
    articles = []
    for e in entries:
        if not within_prior_window(e.get("published_at"), start_dt, args.lookback):
            continue
        url = canonical_url(e["url"])
        if url in seen:
            continue
        row = {
            "ticker": ticker,
            "company": company,
            "title": e.get("title"),
            "url": url,
            "published_at": e.get("published_at"),
            "source": e.get("source"),
        }
        if args.fetch_text:
            row["text"] = fetch_article_text(url)
        articles.append(row)
        seen.add(url)

    print(f"[NEWS] {len(articles)} articles within [{(start_dt - timedelta(days=args.lookback)).date()} .. {start_dt.date()})")

    tag = f"{ticker}_{args.start}_{args.end}"
    out_path = os.path.join(DATA_DIR, f"{tag}.json")

    net_gain = round(pct, 6)
    article_objs = [{"title": a.get("title", ""), "content": a.get("text", "") if "text" in a else ""} for a in articles]

    result = {
        "ticker": ticker,
        "start_date": datetime.strftime(start_dt, "%Y-%m-%d"),
        "end_date": datetime.strftime(end_dt, "%Y-%m-%d"),
        "net_gain": net_gain,
        "articles": article_objs
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"[DONE] wrote {out_path}")

if __name__ == "__main__":
    main()
