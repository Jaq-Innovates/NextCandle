#!/usr/bin/env python3
import sys, time, subprocess, pathlib

HERE = pathlib.Path(__file__).resolve().parent

while True:
    print("\n[RUNNER] Starting daily check...")
    try:
        subprocess.run(
            [sys.executable, str(HERE / "similarity.py"),
             "--msg", str(HERE / "message.json"),
             "--lookback_min", "1440"],
            check=True,
            cwd=str(HERE)   # ensure working dir is the script folder
        )
        print("[RUNNER] Completed.")
    except subprocess.CalledProcessError as e:
        print(f"[RUNNER] similarity.py failed (exit {e.returncode})")
    except Exception as e:
        print(f"[RUNNER] Unexpected error: {e}")

    print("[RUNNER] Sleeping for 24h...")
    time.sleep(86400)  # 24 hours
