# Kerala River Water Quality: Statistical Analysis and Predictive Modelling

Statistical analysis, missing-data handling and predictive modelling of surface water quality in Kerala, using the
Central Water Commission (CWC) manual chemical water-quality dataset (1980–2020) from the National Water Data Portal.

Course project for ES 225 – AI and Data Science, IIT Bombay (Autumn Semester 2026).

**What the project covers**
- Descriptive statistics, comparison with BIS/CPCB standards, and seasonal and spatial hypothesis tests (z-tests)
- Missing-data analysis and comparison of mean, median and mode imputation
- Simple linear, Ridge and Lasso regression, and principal component analysis
- Decision Tree (cross-validated complexity control) and Random Forest regression, with a leakage-safe train/test pipeline

## Report
- [`output/ES225_Assignment3_Group10_Report.pdf`](output/ES225_Assignment3_Group10_Report.pdf): final report
- [`output/ES225_Assignment3_Group10_Report.docx`](output/ES225_Assignment3_Group10_Report.docx): editable version

## Key results (held-out test set, n = 1,064; response: total hardness)

| Model | Test MSE | Test R² |
|---|---|---|
| Simple linear regression (TDS) | 884.52 | 0.212 |
| Ridge / Lasso, λ = 1 | – | 0.615 |
| Unrestricted Decision Tree | 482.54 | 0.570 |
| Controlled Decision Tree | 315.64 | 0.719 |
| Random Forest (100 trees) | 252.59 | 0.775 |

## Repository layout
```
analysis_code_and_data/   datasets and Python analysis scripts
  Original_CWC_dataset.csv  exported CWC dataset (5,433 samples, 21 stations)      – Q1
  cleaned_full.csv          shared cleaned dataset (5,433 rows, 14 parameters)     – Q2, Q3
  train.csv, test.csv       80/20 split of the 5,316 samples with observed hardness – Q4–Q8
  q1_analysis.py            Q1
  person_c_analysis.py      Q4–Q6
  es225_q7_q8_analysis.py   Q7–Q8
assets/figures/           figures used in the report, in report order
build/                    scripts that regenerate the report
reference/                assignment brief and Assignment 2 formatting reference
output/                   final report (PDF and DOCX)
```

## Data
Data source: Central Water Commission, *Surface water quality: Manual chemical parameters, Kerala, 1961 to 2020*,
National Water Data Portal, Government of India. Data folder:
https://drive.google.com/drive/folders/1Iy9n2XDmbHdw5mTXCZkmGpRbUS0Pes2e?usp=drive_link

## Running the analysis
```bash
python analysis_code_and_data/q1_analysis.py analysis_code_and_data/Original_CWC_dataset.csv q1_outputs
python analysis_code_and_data/es225_q7_q8_analysis.py analysis_code_and_data/train.csv analysis_code_and_data/test.csv q7_q8_outputs
```
`q1_analysis.py` needs pandas, NumPy, SciPy and Matplotlib; `es225_q7_q8_analysis.py` also needs scikit-learn.
`person_c_analysis.py` (pandas, NumPy, Pillow) expects `train.csv` and `test.csv` in a `data/` folder next to the script.

## Rebuilding the report
1. `node build/build_report.js`: writes the DOCX (needs the `docx` npm package)
2. `powershell -ExecutionPolicy Bypass -File build/finalize_word.ps1`: fills the contents and lists in Microsoft Word and exports the PDF
