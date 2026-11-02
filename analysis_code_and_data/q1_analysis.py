"""
ES 225 - Assignment 3, Question 1
Kerala river water quality (CWC manual chemical sampling, 1980-2020)

Reproduces every table, test and figure in the Q1 report:
  Q1(a) descriptive statistics and comparison with BIS / CPCB standards
  Q1(b) pre-monsoon vs monsoon two-sample z-tests
  Q1(c) Neeleeswaram vs Arangali (Periyar) two-sample z-tests

Usage:
    python q1_analysis.py [path/to/swq_manual_chemical_parameters_cwc_kl_1961_2020.csv] [output_dir]
"""
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from scipy import stats

CSV = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("swq_manual_chemical_parameters_cwc_kl_1961_2020.csv")
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("q1_outputs")
OUT.mkdir(parents=True, exist_ok=True)

# ----------------------------------------------------------------------------
# 1. Load and prepare
# ----------------------------------------------------------------------------
df = pd.read_csv(CSV)
df["Station"] = df["Station"].str.strip().str.title()   # names are upper-case with stray spaces in the file
df["River"] = df["River"].str.strip().str.title()
df["date"] = pd.to_datetime(df["Data Acquisition Time"], dayfirst=True, errors="coerce")
df["year"] = df["date"].dt.year
df["month"] = df["date"].dt.month

# Kerala seasons: pre-monsoon Mar-May, southwest monsoon Jun-Sep, post-monsoon Oct-Feb
df["season"] = np.select(
    [df["month"].isin([3, 4, 5]), df["month"].isin([6, 7, 8, 9])],
    ["pre", "mon"], default="post")

# parameter label -> (column, unit, standard text, test function giving "outside")
COL = {
    "pH": "Potential of Hydrogen (pH)",
    "DO": "Dissolved oxygen (mg/L)",
    "TDS": "Total Dissolved Solids (mg/L)",
    "Chloride": "Chloride (mg/L)",
    "Sulphate": "Sulphate (mg/L)",
    "Total hardness": "Total Hardness (mgCaCO3/L)",
    "Total alkalinity": "Total Alkalinity (mg/L as CaCO3)",
    "Calcium": "Calcium (mg/L)",
    "Magnesium": "Mangnesium (mg/L)" if "Mangnesium (mg/L)" in df.columns else "Magnesium (mg/L)",
    "Sodium": "Sodium (mg/L)",
    "Bicarbonate": "Bicarbonate (mg/L)",
    "Carbonate": "Carbonate (mg/L)",
    "Nitrate-N": "Nitrate N (mgN/L)",
    "Nitrite+nitrate-N": "Nitrite N+Nitrate N (mgN/L)",
    "Ammonia-N": "Amonia N (mgN/L)",
    "Total phosphorus": "Total Phosphorus (mgP/L)",
    "Iron": "Iron(mg/L)",
    "SAR": "Sodium Adsorption Ratio (%)",
    "Arsenic": "Arsenic (mg/L)",
    "Cadmium": "Cadmium (mg/L)",
    "Chromium": "Chromium (mg/L)",
    "Copper": "Copper (mg/L)",
    "Lead": "Lead (mg/L)",
    "Mercury": "Mercury(mg/L)",
    "Nickel": "Nickel (mg/L)",
    "Zinc": "Zinc (mg/L)",
}
# Magnesium column name differs between portal exports; fall back to a fuzzy match
if COL["Magnesium"] not in df.columns:
    COL["Magnesium"] = [c for c in df.columns if c.lower().startswith(("magnesium", "mangnesium")) and "hardness" not in c.lower()][0]

# One physically implausible DO reading (27 mg/L) is removed
do_col = COL["DO"]
n_bad_do = int((df[do_col] > 20).sum())
df.loc[df[do_col] > 20, do_col] = np.nan

# Metal columns are labelled mg/L in the file but behave like ug/L (see report)
METALS = ["Arsenic", "Cadmium", "Chromium", "Copper", "Lead", "Mercury", "Nickel", "Zinc"]

# Standards: BIS IS 10500:2012 acceptable limits, CPCB Class A for pH and DO
STANDARDS = {
    "pH": ("BIS 6.5-8.5", lambda s: (s < 6.5) | (s > 8.5)),
    "DO": ("CPCB Class A >= 6", lambda s: s < 6),
    "TDS": ("BIS 500", lambda s: s > 500),
    "Chloride": ("BIS 250", lambda s: s > 250),
    "Sulphate": ("BIS 200", lambda s: s > 200),
    "Total hardness": ("BIS 200", lambda s: s > 200),
    "Total alkalinity": ("BIS 200", lambda s: s > 200),
    "Calcium": ("BIS 75", lambda s: s > 75),
    "Magnesium": ("BIS 30", lambda s: s > 30),
    "Nitrate-N": ("BIS 45 mg/L as NO3 (10.2 mg N/L)", lambda s: s > 45 * 14.007 / 62.004),
    "Ammonia-N": ("BIS 0.5", lambda s: s > 0.5),
    "Iron": ("BIS 0.3", lambda s: s > 0.3),
    "Arsenic": ("BIS 10 ug/L", lambda s: s > 10),
    "Cadmium": ("BIS 3 ug/L", lambda s: s > 3),
    "Chromium": ("BIS 50 ug/L", lambda s: s > 50),
    "Copper": ("BIS 50 ug/L", lambda s: s > 50),
    "Lead": ("BIS 10 ug/L", lambda s: s > 10),
    "Mercury": ("BIS 1 ug/L", lambda s: s > 1),
    "Nickel": ("BIS 20 ug/L", lambda s: s > 20),
    "Zinc": ("BIS 5000 ug/L", lambda s: s > 5000),
}

# ----------------------------------------------------------------------------
# 2. Data and scope
# ----------------------------------------------------------------------------
print("=== DATA AND SCOPE ===")
print(f"Samples: {len(df)}  Stations: {df['Station'].nunique()}  Rivers: {df['River'].nunique()}")
print(f"First / last sample: {df['date'].min().date()} / {df['date'].max().date()}")
print(f"Share of samples in 1986-2017: {df['year'].between(1986, 2017).mean():.1%};  samples in 2018-2020: {int((df['year'] >= 2018).sum())}")
print(f"DO readings removed (>20 mg/L): {n_bad_do}")
print("Season counts:", df["season"].value_counts().to_dict())

stations = (df.groupby(["Station", "River", "District"])
              .agg(lat=("Latitude", "first"), lon=("Longitude", "first"),
                   y0=("year", "min"), y1=("year", "max"), n=("SlNo", "count"))
              .reset_index().sort_values(["River", "Station"]))
stations.to_csv(OUT / "table1_stations.csv", index=False)

# ----------------------------------------------------------------------------
# 3. Q1(a) descriptive statistics and exceedances
# ----------------------------------------------------------------------------
rows = []
for name, col in COL.items():
    s = df[col].dropna()
    row = dict(Parameter=name, N=len(s), Mean=s.mean(), Median=s.median(), SD=s.std(),
               Min=s.min(), Max=s.max(), Standard="none", Outside_pct=np.nan, Outside_n=np.nan)
    if name in STANDARDS:
        txt, test = STANDARDS[name]
        out = test(s)
        row.update(Standard=txt, Outside_pct=100 * out.mean(), Outside_n=int(out.sum()))
    rows.append(row)
desc = pd.DataFrame(rows)
desc.to_csv(OUT / "table2_descriptive.csv", index=False)
print("\n=== Q1(a) DESCRIPTIVE STATISTICS ===")
print(desc.to_string(index=False, float_format=lambda v: f"{v:.4g}"))

ph = df[COL["pH"]].dropna()
print(f"\npH < 6.5: {int((ph < 6.5).sum())}  pH > 8.5: {int((ph > 8.5).sum())}  both: {int(((ph < 6.5) | (ph > 8.5)).sum())}  of {len(ph)}")

# Iron timing
fe = df[["year", "Station", COL["Iron"]]].dropna()
fe_ex = fe[fe[COL["Iron"]] > 0.3]
yrs = fe.year
print(f"Iron measured {int(yrs.min())}-{int(yrs.max())}; exceedances {len(fe_ex)}; in 2010-2012: {int(fe_ex.year.between(2010, 2012).sum())}; "
      f"stations with exceedance: {fe_ex.Station.nunique()}")
a, b = fe[fe.year.between(2010, 2012)], fe[fe.year >= 2013]
print(f"  2010-2012: {(a[COL['Iron']] > 0.3).mean():.1%} of {len(a)};  2013+: {(b[COL['Iron']] > 0.3).mean():.1%} of {len(b)}")

# Trace metals by year
print("\nTrace-metal exceedances by year")
for m, lim in [("Arsenic", 10), ("Cadmium", 3), ("Lead", 10)]:
    t = df[["year", "Station", COL[m]]].dropna()
    ex = t[t[COL[m]] > lim]
    print(f"  {m}: {len(ex)} of {len(t)}; by year {ex.year.astype(int).value_counts().sort_index().to_dict()}")
    if m == "Arsenic":
        y12 = t[t.year == 2012]
        print(f"    2012: {int((y12[COL[m]] > lim).sum())} of {len(y12)}, stations {y12[y12[COL[m]] > lim].Station.nunique()}, median {y12[COL[m]].median():.2f}")
    if m == "Cadmium":
        print(f"    2005-2006: {int(ex.year.isin([2005, 2006]).sum())}; 2007+: {int((ex.year >= 2007).sum())} of {int((t.year >= 2007).sum())}")

# Zeros in metal columns
print("\nZero share in metal columns:", {m: f"{(df[COL[m]].dropna() == 0).mean():.1%}" for m in ["Mercury", "Cadmium", "Nickel"]})

# Station medians
med = df.groupby("Station")[[COL["TDS"], COL["Chloride"], COL["DO"]]].median()
med.columns = ["TDS", "Chloride", "DO"]
print("\nStation median TDS (top 4):", med["TDS"].dropna().sort_values(ascending=False).head(4).round(0).to_dict())
print("Station median TDS range excl. Bharathapuzha trio:",
      med.loc[~med.index.isin(["Mankara", "Pudur", "Kumbidi"]), "TDS"].dropna().agg(["min", "max"]).round(0).to_dict())
print("Lowest DO medians:", med["DO"].dropna().sort_values().head(3).round(2).to_dict())

# ----------------------------------------------------------------------------
# 4. Two-sample z-test helper
# ----------------------------------------------------------------------------
def ztest(x, y):
    x, y = pd.Series(x).dropna(), pd.Series(y).dropna()
    d = x.mean() - y.mean()
    se = np.sqrt(x.var(ddof=1) / len(x) + y.var(ddof=1) / len(y))
    z = d / se
    p = 2 * stats.norm.sf(abs(z))
    return dict(n1=len(x), m1=x.mean(), s1=x.std(ddof=1), n2=len(y), m2=y.mean(), s2=y.std(ddof=1),
                diff=d, lo=d - 1.96 * se, hi=d + 1.96 * se, z=z, p=p,
                decision="Reject H0" if p < 0.05 else "Do not reject H0")

# DO decadal comparison (stated in Q1(a))
d90 = df[df.year.between(1990, 1999)][do_col]
d10 = df[df.year.between(2010, 2019)][do_col]
r = ztest(d90, d10)
print(f"\nDO 1990s vs 2010s: n={r['n1']} vs {r['n2']}, means {r['m1']:.2f} vs {r['m2']:.2f}, diff {r['diff']:.2f} "
      f"(95% CI {r['lo']:.2f} to {r['hi']:.2f}), z={r['z']:.2f}, p={r['p']:.2g}")
print("DO mean by decade:", {k: round(v, 2) for k, v in df.groupby((df.year // 10) * 10)[do_col].mean().items() if k in (1990, 2000, 2010)})
# stations with at least 30 DO readings in each decade
cnt90 = df[df.year.between(1990, 1999)].dropna(subset=[do_col]).groupby("Station").size()
cnt10 = df[df.year.between(2010, 2019)].dropna(subset=[do_col]).groupby("Station").size()
both = set(cnt90[cnt90 >= 30].index) & set(cnt10[cnt10 >= 30].index)
sub = df[df.Station.isin(both)]
r2 = ztest(sub[sub.year.between(1990, 1999)][do_col], sub[sub.year.between(2010, 2019)][do_col])
print(f"  stations in both decades: {len(both)}; diff {r2['diff']:.2f}, z={r2['z']:.2f}")
for lab, lo, hi in [("1990s", 1990, 1999), ("2010s", 2010, 2019)]:
    t = df[df.year.between(lo, hi)].dropna(subset=[do_col])
    print(f"  pre-monsoon share of DO samples in {lab}: {(t.season == 'pre').mean():.0%}")

# ----------------------------------------------------------------------------
# 5. Q1(b) pre-monsoon vs monsoon
# ----------------------------------------------------------------------------
SEAS = ["DO", "pH", "TDS", "Chloride", "Total hardness", "Nitrate-N"]
rows = []
for name in SEAS:
    col = COL[name]
    r = ztest(df.loc[df.season == "pre", col], df.loc[df.season == "mon", col])
    r["Parameter"] = name
    rows.append(r)
seas = pd.DataFrame(rows)[["Parameter", "n1", "m1", "s1", "n2", "m2", "s2", "diff", "lo", "hi", "z", "p", "decision"]]
seas.to_csv(OUT / "table3_seasonal_ztests.csv", index=False)
print("\n=== Q1(b) PRE-MONSOON vs MONSOON ===")
print(seas.to_string(index=False, float_format=lambda v: f"{v:.4g}"))

post = df[df.season == "post"]
print("\nPost-monsoon means:", {n: round(post[COL[n]].mean(), 3) for n in ["DO", "pH", "TDS", "Chloride", "Total hardness", "Nitrate-N"]})
print("Nitrate-N means pre / mon / post:", [round(df.loc[df.season == s, COL["Nitrate-N"]].mean(), 3) for s in ["pre", "mon", "post"]])
mm = df.groupby("month")[do_col].mean()
print(f"Monthly DO: Sep {mm[9]:.2f}, Oct {mm[10]:.2f}, Nov {mm[11]:.2f}")

# ----------------------------------------------------------------------------
# 6. Q1(c) Neeleeswaram vs Arangali
# ----------------------------------------------------------------------------
SP = ["pH", "DO", "TDS", "Chloride", "Sulphate", "Total hardness", "Total phosphorus"]
N = df[df.Station == "Neeleeswaram"]
A = df[df.Station == "Arangali"]
rows = []
for name in SP:
    col = COL[name]
    r = ztest(N[col], A[col])
    r["Parameter"] = name
    rows.append(r)
spat = pd.DataFrame(rows)[["Parameter", "n1", "m1", "s1", "n2", "m2", "s2", "diff", "lo", "hi", "z", "p", "decision"]]
spat.to_csv(OUT / "table4_spatial_ztests.csv", index=False)
print("\n=== Q1(c) NEELEESWARAM vs ARANGALI ===")
print(spat.to_string(index=False, float_format=lambda v: f"{v:.4g}"))

lat0, lon0 = N.Latitude.iloc[0], N.Longitude.iloc[0]
lat1, lon1 = A.Latitude.iloc[0], A.Longitude.iloc[0]
dy = (lat1 - lat0) * 111.0
dx = (lon1 - lon0) * 111.0 * np.cos(np.radians((lat0 + lat1) / 2))
print(f"Arangali is {np.hypot(dx, dy):.1f} km from Neeleeswaram ({abs(dx):.0f} km {'west' if dx < 0 else 'east'}, {abs(dy):.0f} km {'north' if dy > 0 else 'south'})")

# ----------------------------------------------------------------------------
# 7. Figures
# ----------------------------------------------------------------------------
plt.rcParams.update({"font.size": 9, "axes.spines.top": False, "axes.spines.right": False})
ORANGE, BLUE, GREY = "#E07B1A", "#2F6F9F", "#9AA0A6"

# Fig 1: share outside the standard
f1 = desc.dropna(subset=["Outside_pct"]).sort_values("Outside_pct")
colors = []
for p, v in zip(f1.Parameter, f1.Outside_pct):
    colors.append(GREY if p in ("Arsenic", "Cadmium") else (ORANGE if p in ("Iron", "DO") else BLUE))
labels = [p + (" †" if p in ("Arsenic", "Cadmium") else "") for p in f1.Parameter]
fig, ax = plt.subplots(figsize=(8, 5.2))
ax.barh(labels, f1.Outside_pct, color=colors)
for i, v in enumerate(f1.Outside_pct):
    ax.text(v + 0.1, i, f"{v:.1f}%", va="center", fontsize=8)
ax.set_xlabel("% of samples outside the standard")
ax.set_title("Share of samples not meeting the applicable standard")
fig.text(0.01, 0.01, "† exceedances come from single years (arsenic 2012; cadmium 2005-2006), not read as river concerns", fontsize=7, color="#555")
fig.tight_layout(rect=(0, 0.03, 1, 1))
fig.savefig(OUT / "fig1_exceedances.png", dpi=200)
plt.close(fig)

# Fig 2: station medians (chloride and DO)
fig, axes = plt.subplots(1, 2, figsize=(9, 5.2))
mc = med["Chloride"].dropna().sort_values()
axes[0].barh(mc.index, mc.values, color=ORANGE)
axes[0].set_title("Median chloride (mg/L)")
md = med["DO"].reindex(mc.index)
axes[1].barh(md.index, md.values, color=BLUE)
axes[1].axvline(6, color="k", ls="--", lw=1)
axes[1].text(6.05, 0, "6 mg/L", fontsize=7)
axes[1].set_title("Median DO (mg/L)")
axes[1].set_yticklabels([])
fig.tight_layout()
fig.savefig(OUT / "fig2_station_medians.png", dpi=200)
plt.close(fig)

# Fig 3: season boxplots
fig, axes = plt.subplots(1, 4, figsize=(11, 3.4))
for ax, name in zip(axes, ["DO", "pH", "TDS", "Chloride"]):
    col = COL[name]
    data = [df.loc[df.season == "pre", col].dropna(), df.loc[df.season == "mon", col].dropna()]
    bp = ax.boxplot(data, showfliers=False, patch_artist=True, widths=0.5, tick_labels=["Pre-\nmonsoon", "Monsoon"])
    for patch, c in zip(bp["boxes"], [ORANGE, BLUE]):
        patch.set_facecolor(c); patch.set_alpha(0.8)
    for m in bp["medians"]:
        m.set_color("k")
    ax.set_title(f"{name} ({'mg/L' if name != 'pH' else ''})".replace(" ()", ""))
fig.suptitle("Pre-monsoon vs monsoon (all stations, outliers hidden)", fontsize=9)
fig.tight_layout()
fig.savefig(OUT / "fig3_season_boxplots.png", dpi=200)
plt.close(fig)

# Fig 4: monthly means with 95% CI
fig, axes = plt.subplots(1, 2, figsize=(10, 3.8))
for ax, name, c in [(axes[0], "DO", BLUE), (axes[1], "TDS", ORANGE)]:
    g = df.groupby("month")[COL[name]]
    m, se = g.mean(), g.sem()
    ax.errorbar(m.index, m.values, yerr=1.96 * se.values, fmt="-o", color=c, capsize=3, ms=4)
    ax.set_xticks(range(1, 13))
    ax.set_xlabel("Month")
    ax.set_title(f"Monthly mean {name} (mg/L) +/- 95% CI")
fig.tight_layout()
fig.savefig(OUT / "fig4_monthly_means.png", dpi=200)
plt.close(fig)

# Fig 5: Periyar pair
fig, axes = plt.subplots(1, 4, figsize=(11, 3.4))
for ax, name in zip(axes, ["DO", "pH", "TDS", "Chloride"]):
    col = COL[name]
    bp = ax.boxplot([N[col].dropna(), A[col].dropna()], showfliers=False, patch_artist=True, widths=0.5,
                    tick_labels=["Neeleeswaram", "Arangali"])
    for patch, c in zip(bp["boxes"], [BLUE, "#7FA65A"]):
        patch.set_facecolor(c); patch.set_alpha(0.85)
    for m in bp["medians"]:
        m.set_color("k")
    ax.set_title(f"{name} ({'mg/L' if name != 'pH' else ''})".replace(" ()", ""))
    ax.tick_params(axis="x", labelsize=7)
fig.suptitle("Periyar River: Neeleeswaram vs Arangali (outliers hidden)", fontsize=9)
fig.tight_layout()
fig.savefig(OUT / "fig5_periyar_stations.png", dpi=200)
plt.close(fig)

print(f"\nTables and figures written to {OUT.resolve()}")
