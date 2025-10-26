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
from pathlib import Path
from dotenv import load_dotenv

# load the .env that sits in the same folder as this script, and override any existing vars
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env", override=True)
import math
import argparse, json, os, re, time
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
import requests, yfinance as yf
from bs4 import BeautifulSoup

# ---------- config ----------
LOOKBACK_DAYS_DEFAULT = 1
DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(exist_ok=True)
UA = {"User-Agent": "Mozilla/5.0 (NextCandle/1.0)"}
# os.makedirs(DATA_DIR, exist_ok=True)

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

def finnhub_company_news(ticker: str, start_dt: datetime, end_dt: datetime) -> List[Dict]:
    """
    Fetch company news from Finnhub between [start_dt, end_dt].
    """
    api_key = (os.getenv("finn_key") or "").strip()
    if not api_key:
        print("[WARN] finn_key not set; skipping Finnhub fetch.")
        return []

    symbol = (ticker or "").upper()
    from_date = start_dt.date().isoformat()
    to_date   = end_dt.date().isoformat()

    url = "https://finnhub.io/api/v1/company-news"
    params = {"symbol": symbol, "from": from_date, "to": to_date, "token": api_key}

    print(f"[DEBUG] Finnhub fetch: {symbol} {from_date} → {to_date}")

    try:
        r = requests.get(url, params=params, headers=UA, timeout=15)
        if r.status_code in (429, 502, 503, 504):
            time.sleep(1.5)
            r = requests.get(url, params=params, headers=UA, timeout=15)
        r.raise_for_status()

        data = r.json()
        if isinstance(data, dict):
            print(f"[WARN] Finnhub returned error JSON: {data}")
            return []
        if not isinstance(data, list):
            print(f"[WARN] Unexpected Finnhub payload type: {type(data)}")
            return []

    except Exception as e:
        print(f"[WARN] Finnhub request failed: {e}")
        return []

    out: List[Dict] = []
    for item in data:
        ts_iso = None
        try:
            ts_val = float(item.get("datetime", 0))
            if ts_val > 0:
                ts_iso = datetime.fromtimestamp(ts_val, tz=timezone.utc).isoformat()
        except Exception:
            ts_iso = None

        out.append({
            "title": item.get("headline"),
            "url": item.get("url") or "",
            "published_at": ts_iso,
            "source": item.get("source"),
            "text": item.get("summary") or ""
        })

    return out

def finnhub_company_news_limited(
    ticker: str,
    start_dt: datetime,
    lookback_days: int,
    max_articles: int = 100,
    chunk_days: int = 3,
) -> List[Dict]:
    """
    Fetch up to `max_articles` articles spread across the prior window.
    We chunk the window to avoid Finnhub per-request caps and to enforce even coverage.
    """
    lookback_days = min(30, lookback_days)  # free-tier safety
    begin = start_dt - timedelta(days=lookback_days)
    end = start_dt

    total_days = (end - begin).days
    if total_days <= 0:
        return []

    num_chunks = max(1, math.ceil(total_days / chunk_days))
    # Even allocation per chunk (distribute remainder to the most recent chunks)
    base = max_articles // num_chunks
    rem = max_articles % num_chunks

    seen = set()
    collected: List[Dict] = []

    # Walk from most recent chunk backward (prioritize recent news)
    cursor_end = end
    for i in range(num_chunks):
        if len(collected) >= max_articles:
            break

        cursor_start = max(begin, cursor_end - timedelta(days=chunk_days))

        # Allocate per-chunk budget (recent chunks get the remainder first)
        # i=0 is most recent chunk
        alloc = base + (1 if i < rem else 0)
        if alloc <= 0:
            cursor_end = cursor_start
            continue

        # Reuse your existing per-window fetch (end-exclusive semantics already handled)
        part = finnhub_company_news(ticker, cursor_end, (cursor_end - cursor_start).days)

        # Sort inside chunk oldest->newest so we pick evenly later
        part = sorted(
            part,
            key=lambda x: x.get("published_at") or "",
        )

        # Evenly sample up to `alloc` from this chunk
        if len(part) > alloc and alloc > 1:
            picks = []
            for k in range(alloc):
                idx = int(round(k * (len(part) - 1) / (alloc - 1)))
                picks.append(part[idx])
        else:
            picks = part[:alloc]

        # Dedup and add
        for e in picks:
            if len(collected) >= max_articles:
                break
            url = canonical_url(e.get("url") or "")
            if not url or url in seen:
                continue
            seen.add(url)
            collected.append(e)

        cursor_end = cursor_start  # move to next (older) chunk

    # Final ordering: oldest->newest (change if you prefer newest-first)
    collected.sort(key=lambda x: x.get("published_at") or "")
    return collected




# ---------- main ----------

def main():
    ap = argparse.ArgumentParser(description="Scrape prior 31 days of Finnhub news and label window UP/DOWN.")
    ap.add_argument("--ticker", required=True, help="Ticker symbol, e.g., NVDA")
    ap.add_argument("--start",  required=True, help="MM-DD-YYYY (window start)")
    ap.add_argument("--end",    required=True, help="MM-DD-YYYY (window end)")
    ap.add_argument("--lookback", type=int, default=LOOKBACK_DAYS_DEFAULT)
    ap.add_argument("--fetch-text", action="store_true", help="Fetch and store article text (slower).")
    args = ap.parse_args()
    # Enforce Finnhub's 30-day limit
    if args.lookback > 30:
        print("[INFO] Finnhub free tier only supports 30 days of news — limiting lookback to 30.")
        args.lookback = 30


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

    entries = finnhub_company_news_limited(ticker, start_dt, args.lookback, max_articles=100, chunk_days=3)
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

def parse_date(d: str) -> datetime:
    # Try both ISO (YYYY-MM-DD) and US (MM-DD-YYYY) formats
    for fmt in ("%Y-%m-%d", "%m-%d-%Y"):
        try:
            return datetime.strptime(d, fmt).replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    raise ValueError(f"Unrecognized date format: {d}")

def run_scraper(ticker: str, start: str, end: str, fetch_text: bool = True) -> dict:
    """
    Runs the scraper and returns the analysis result as a Python dict
    instead of writing to a file.
    """
    print(f"[API CALL] Running scraper for {ticker} {start}->{end}")
    start_dt = parse_date(start)
    end_dt = parse_date(end)

    company = resolve_company_name_from_ticker(ticker)
    s_close, e_close, pct, label = window_change(ticker, start_dt.date().isoformat(), end_dt.date().isoformat())
    if pct is None:
        raise ValueError("No price data returned for that window (check ticker or dates).")

    entries = finnhub_company_news(ticker, start_dt, end_dt)

    articles = []
    for e in entries:
        pub_iso = e.get("published_at")
        if not pub_iso:
            continue

        try:
            # Normalize to UTC regardless of timezone format
            pub_dt = datetime.fromisoformat(pub_iso.replace("Z", "+00:00"))
        except Exception:
            continue

        # Convert everything to naive UTC for consistent comparison
        pub_dt = pub_dt.replace(tzinfo=None)
        s_dt = start_dt.replace(tzinfo=None)
        e_dt = end_dt.replace(tzinfo=None)

        # ✅ Include articles published within a few days around the window
        # (to prevent small timezone or API timing mismatches)
        buffer = timedelta(days=1)
        if not (s_dt - buffer <= pub_dt <= e_dt + buffer):
            continue

        url = e.get("url")
        full_text = fetch_article_text(url) if fetch_text else e.get("text", "")

        articles.append({
            "title": e.get("title"),
            "url": url,
            "published_at": pub_iso,
            "source": e.get("source"),
            "text": full_text
        })


    result = {
        "ticker": ticker,
        "company": company,
        "start_date": start_dt.strftime("%Y-%m-%d"),
        "end_date": end_dt.strftime("%Y-%m-%d"),
        "net_gain": round(pct, 6),
        "label": label,
        "articles": articles,
    }

    print(f"[✅ DONE] Scraper finished for {ticker}")
    return result


if __name__ == "__main__":
    main()
