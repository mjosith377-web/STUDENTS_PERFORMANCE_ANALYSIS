# Student Study Habits and Academic Performance Analyzer

A beginner-friendly research project that collects a 10-question student survey and analyzes associations between study routines and CGPA using mathematical and statistical methods.

## Features

- Responsive survey website (HTML, CSS, JavaScript)
- Browser-local storage works immediately without accounts
- Optional Supabase storage for shared survey data
- Dashboard with mean CGPA, mean study hours and population standard deviation
- Scatter plot: study hours vs CGPA
- Pearson correlation and simple linear regression
- Mean CGPA grouped by main study method
- CSV export and a Python analysis script
- Demo dataset to test the dashboard

## Research workflow

1. Data collection
2. Data cleaning and validation
3. Descriptive statistics
4. Visualization
5. Correlation
6. Regression
7. Hypothesis testing (extend with a justified statistical test)
8. Stochastic/Markov analysis (requires repeated observations over time)
9. Interpretation
10. Recommendations and conclusion

## Run locally

Open `index.html` in a browser. For the easiest local server, run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages

1. Create a new GitHub repository named `student-study-habits-prediction`.
2. Upload `index.html`, `style.css`, `app.js`, `analysis.py`, `requirements.txt`, `supabase_schema.sql`, and this README.
3. Open **Settings → Pages**.
4. Under build and deployment, select **Deploy from a branch**, choose `main` and `/(root)`, then save.
5. Wait for the Pages deployment and open the URL shown in Settings → Pages.

## Optional: connect Supabase

1. Create a Supabase project.
2. Open SQL Editor and run `supabase_schema.sql`.
3. In Project Settings / API, copy the project URL and anon/publishable key.
4. Put those values into `SUPABASE_URL` and `SUPABASE_ANON_KEY` at the top of `app.js`.
5. Commit and redeploy.

Only use the anon/publishable key in the browser. **Never put a service-role key or database password in GitHub.** The example SQL policy allows anonymous users to read and insert all survey records, which is convenient for a classroom prototype but not appropriate for confidential data. Get consent, avoid names and sensitive information, and tighten access policies before collecting real student data.

## Run the Python analysis

Export the survey as CSV from the website, then run:

```bash
pip install -r requirements.txt
python analysis.py study-habits-data.csv
```

The script prints descriptive statistics, correlations, group averages, and a simple linear regression.

## Important limitations

- Correlation does not prove causation.
- A prediction from one variable is exploratory and should not be treated as a student's guaranteed result.
- A one-time survey cannot estimate Markov transition probabilities. Collect repeated weekly observations if you want to study transitions between study-routine states.
- For a credible project report, state the sample size, sampling method, missing-data handling, assumptions, and limitations.
