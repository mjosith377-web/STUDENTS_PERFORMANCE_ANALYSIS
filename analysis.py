"""Offline analysis for study-habits survey CSV exports.
Usage: pip install -r requirements.txt
       python analysis.py study-habits-data.csv
"""
import sys
import pandas as pd
import numpy as np

NUMERIC = [
    "study_hours", "attendance", "revision", "study_days", "sleep_hours",
    "practice", "phone_distraction", "entertainment_hours", "cgpa"
]

def main(path):
    df = pd.read_csv(path)
    missing = [c for c in NUMERIC + ["study_method"] if c not in df.columns]
    if missing:
        raise SystemExit(f"CSV is missing required columns: {', '.join(missing)}")
    for col in NUMERIC:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    before = len(df)
    df = df.dropna(subset=NUMERIC + ["study_method"]).copy()
    df = df[df["cgpa"].between(0, 10) & df["study_hours"].between(0, 24)]
    print(f"Valid rows: {len(df)} of {before}")
    print("\nDescriptive statistics:")
    print(df[NUMERIC].describe().round(3).to_string())
    print("\nPearson correlation with CGPA:")
    print(df[NUMERIC].corr(numeric_only=True)["cgpa"].sort_values(ascending=False).round(3).to_string())
    print("\nMean CGPA by study method:")
    print(df.groupby("study_method")["cgpa"].agg(["count", "mean", "std"]).round(3).to_string())
    if df["study_hours"].nunique() >= 2 and len(df) >= 2:
        slope, intercept = np.polyfit(df["study_hours"], df["cgpa"], 1)
        print(f"\nExploratory regression: CGPA = {intercept:.3f} + {slope:.3f} * study_hours")
    else:
        print("\nRegression skipped: need at least two rows with different study-hour values.")
    print("\nInterpretation caution: observational survey associations do not establish causation.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python analysis.py <survey-export.csv>")
    main(sys.argv[1])
