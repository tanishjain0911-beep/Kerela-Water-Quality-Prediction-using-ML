"""Person C (Assignment 3, Q4-Q6) analysis and report builder.

Run from the project root with the bundled Python runtime:
    python person_c_analysis.py

Only pandas, NumPy, Pillow, and ReportLab are used. The script reads the
group-provided split, fits every preprocessing statistic on training data,
and writes figures, machine-readable results, and a conventional serif report.
The companion LaTeX source is Person_C_Report.tex.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
OUT = ROOT / "person_c_output"
FIG = OUT / "figures"
OUT.mkdir(exist_ok=True)
FIG.mkdir(exist_ok=True)

RESPONSE = "Total Hardness (mgCaCO3/L)"
PREDICTORS = [
    "Carbonate (mg/L)",
    "Chloride (mg/L)",
    "Dissolved oxygen (mg/L)",
    "Total Dissolved Solids (mg/L)",
    "Bicarbonate (mg/L)",
    "Sodium (mg/L)",
    "Potential of Hydrogen (pH)",
    "Sulphate (mg/L)",
    "Total Phosphorus (mgP/L)",
]
TDS = "Total Dissolved Solids (mg/L)"
LAMBDAS = (0.01, 0.1, 1.0)


def font(size: int, bold: bool = False) -> ImageFont.ImageFont:
    """Load a readable Windows font, with Pillow's default as a fallback."""
    candidates = [
        Path("C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf"),
        Path("C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def save_figure(image: Image.Image, name: str) -> Path:
    path = FIG / name
    image.save(path, dpi=(180, 180), optimize=True)
    return path


def nice_ticks(low: float, high: float, count: int = 6) -> np.ndarray:
    return np.linspace(low, high, count)


def scatter_plot(
    x: np.ndarray,
    y: np.ndarray,
    *,
    title: str,
    xlabel: str,
    ylabel: str,
    filename: str,
    line: tuple[float, float] | None = None,
    zero_line: bool = False,
    color: str = "#236da8",
) -> Path:
    """Draw an axis-labeled 16:9 scatter chart with tick labels and grid."""
    width, height = 1600, 900
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    title_font, axis_font, tick_font = font(30, True), font(23), font(18)
    left, top, right, bottom = 180, 120, 1510, 760
    xlow, xhigh = float(np.nanmin(x)), float(np.nanmax(x))
    ylow, yhigh = float(np.nanmin(y)), float(np.nanmax(y))
    if xlow == xhigh:
        xlow, xhigh = xlow - 1, xhigh + 1
    if ylow == yhigh:
        ylow, yhigh = ylow - 1, yhigh + 1
    xpad, ypad = (xhigh - xlow) * 0.025, (yhigh - ylow) * 0.06
    xlow, xhigh, ylow, yhigh = xlow - xpad, xhigh + xpad, ylow - ypad, yhigh + ypad

    def xy_to_px(xv: float, yv: float) -> tuple[int, int]:
        px = left + (xv - xlow) / (xhigh - xlow) * (right - left)
        py = bottom - (yv - ylow) / (yhigh - ylow) * (bottom - top)
        return int(px), int(py)

    draw.text((left, 34), title, fill="#17324d", font=title_font)
    for tick in nice_ticks(xlow, xhigh):
        px, _ = xy_to_px(tick, ylow)
        draw.line((px, top, px, bottom), fill="#e3e8ec", width=2)
        label = f"{tick:.3g}"
        box = draw.textbbox((0, 0), label, font=tick_font)
        draw.text((px - (box[2] - box[0]) / 2, bottom + 12), label, fill="#333333", font=tick_font)
    for tick in nice_ticks(ylow, yhigh):
        _, py = xy_to_px(xlow, tick)
        draw.line((left, py, right, py), fill="#e3e8ec", width=2)
        label = f"{tick:.3g}"
        box = draw.textbbox((0, 0), label, font=tick_font)
        draw.text((left - 14 - (box[2] - box[0]), py - 12), label, fill="#333333", font=tick_font)
    draw.line((left, top, left, bottom), fill="#34495e", width=3)
    draw.line((left, bottom, right, bottom), fill="#34495e", width=3)
    if zero_line and ylow <= 0 <= yhigh:
        _, py0 = xy_to_px(xlow, 0)
        draw.line((left, py0, right, py0), fill="#d1495b", width=3)
    for xv, yv in zip(x, y):
        px, py = xy_to_px(float(xv), float(yv))
        draw.ellipse((px - 4, py - 4, px + 4, py + 4), fill=color)
    if line is not None:
        intercept, slope = line
        draw.line(
            (xy_to_px(xlow, intercept + slope * xlow), xy_to_px(xhigh, intercept + slope * xhigh)),
            fill="#d1495b",
            width=5,
        )
    label_box = draw.textbbox((0, 0), xlabel, font=axis_font)
    draw.text(((left + right - (label_box[2] - label_box[0])) / 2, 825), xlabel, fill="#222222", font=axis_font)
    vertical = Image.new("RGBA", (height - 150, 46), (255, 255, 255, 0))
    ImageDraw.Draw(vertical).text((5, 5), ylabel, fill="#222222", font=axis_font)
    rotated = vertical.rotate(90, expand=True)
    image.paste(rotated, (20, int((height - rotated.height) / 2)), rotated)
    return save_figure(image, filename)


def horizontal_bars(
    labels: list[str],
    values: np.ndarray,
    *,
    title: str,
    filename: str,
    series2: np.ndarray | None = None,
    series2_label: str = "",
    series1_label: str = "",
) -> Path:
    """Draw signed horizontal coefficient/loading bars with numeric scale."""
    width, row_height = 1600, 54
    height = 170 + row_height * len(labels)
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    title_font, body_font, tick_font = font(28, True), font(19), font(17)
    left, right, top = 440, 1510, 100
    all_values = list(map(float, values))
    if series2 is not None:
        all_values += list(map(float, series2))
    max_abs = max(max(abs(v) for v in all_values) * 1.16, 1e-8)
    low = min(0.0, min(all_values))
    high = max(0.0, max(all_values))
    span = max(high - low, 1e-8)
    low -= span * 0.1
    high += span * 0.1

    def xpx(v: float) -> int:
        return left + int((v - low) / (high - low) * (right - left))

    draw.text((25, 25), title, fill="#17324d", font=title_font)
    ticks = np.linspace(low, high, 7)
    for tick in ticks:
        xp = xpx(float(tick))
        draw.line((xp, top - 10, xp, top + row_height * len(labels)), fill="#e6eaed", width=2)
        draw.text((xp - 20, top + row_height * len(labels) + 12), f"{tick:.2g}", fill="#333333", font=tick_font)
    zero = xpx(0)
    draw.line((zero, top - 10, zero, top + row_height * len(labels)), fill="#596773", width=3)
    for idx, (label, v1) in enumerate(zip(labels, values)):
        y = top + idx * row_height
        draw.text((20, y + 12), label[:38], fill="#222222", font=body_font)
        if series2 is None:
            bars = [(float(v1), "#2878b5", y + 9, series1_label)]
        else:
            bars = [
                (float(v1), "#2878b5", y + 4, series1_label),
                (float(series2[idx]), "#d96750", y + 29, series2_label),
            ]
        for value, color, bar_y, _ in bars:
            end = xpx(value)
            draw.rectangle((min(zero, end), bar_y, max(zero, end), bar_y + 17), fill=color)
            label_x = min(right - 55, max(left, end + (5 if value >= 0 else -52)))
            draw.text((label_x, bar_y - 1), f"{value:.3g}", fill="#111111", font=tick_font)
    draw.text((left, height - 38), "Coefficient / loading value (sign and magnitude)", fill="#222222", font=body_font)
    if series2 is not None:
        draw.rectangle((1140, 32, 1160, 50), fill="#2878b5")
        draw.text((1167, 30), series1_label, fill="#222222", font=tick_font)
        draw.rectangle((1300, 32, 1320, 50), fill="#d96750")
        draw.text((1327, 30), series2_label, fill="#222222", font=tick_font)
    return save_figure(image, filename)


def metrics(actual: np.ndarray, predicted: np.ndarray) -> dict[str, float]:
    residuals = actual - predicted
    return {
        "rss": float(np.sum(residuals**2)),
        "mse": float(np.mean(residuals**2)),
        "rmse": float(np.sqrt(np.mean(residuals**2))),
        "mae": float(np.mean(np.abs(residuals))),
        "r2": float(1 - np.sum(residuals**2) / np.sum((actual - actual.mean()) ** 2)),
        "mean_error_actual_minus_predicted": float(np.mean(residuals)),
    }


def main() -> dict:
    train = pd.read_csv(DATA / "train.csv")
    test = pd.read_csv(DATA / "test.csv")
    if RESPONSE not in train or RESPONSE not in test:
        raise ValueError(f"Expected response column {RESPONSE!r} in the shared split")
    y_train = train[RESPONSE].to_numpy(dtype=float)
    y_test = test[RESPONSE].to_numpy(dtype=float)
    x_train_raw = train[PREDICTORS].to_numpy(dtype=float)
    x_test_raw = test[PREDICTORS].to_numpy(dtype=float)

    # Training-only median imputation and standardization.
    medians = np.nanmedian(x_train_raw, axis=0)
    x_train = np.where(np.isnan(x_train_raw), medians, x_train_raw)
    x_test = np.where(np.isnan(x_test_raw), medians, x_test_raw)
    means = x_train.mean(axis=0)
    stds = x_train.std(axis=0, ddof=0)
    stds[stds == 0] = 1.0
    z_train = (x_train - means) / stds
    z_test = (x_test - means) / stds

    # ---------------- Q4: OLS, one predictor (TDS) ----------------
    tds_index = PREDICTORS.index(TDS)
    x = x_train[:, tds_index]
    x_test_tds = x_test[:, tds_index]
    slope = float(np.sum((x - x.mean()) * (y_train - y_train.mean())) / np.sum((x - x.mean()) ** 2))
    intercept = float(y_train.mean() - slope * x.mean())
    yhat_train = intercept + slope * x
    yhat_test = intercept + slope * x_test_tds
    q4_test = metrics(y_test, yhat_test)
    q4_train = metrics(y_train, yhat_train)
    residual_train = y_train - yhat_train
    sxx = float(np.sum((x - x.mean()) ** 2))
    residual_se = float(np.sqrt(np.sum(residual_train**2) / (len(x) - 2)))
    slope_se = residual_se / np.sqrt(sxx)
    slope_ci95 = [slope - 1.96 * slope_se, slope + 1.96 * slope_se]
    correlation = float(np.corrcoef(x, y_train)[0, 1])
    baseline = metrics(y_test, np.full_like(y_test, y_train.mean()))
    # Compare test error on the central 95% of observed test hardness as a
    # sensitivity diagnostic; the full test score remains the primary result.
    p95 = float(np.quantile(y_test, 0.95))
    central = y_test <= p95
    q4_central95 = metrics(y_test[central], yhat_test[central])
    # Complete-case sensitivity for Q4, where TDS is observed in both sets.
    observed_tds_train = np.isfinite(x_train_raw[:, tds_index])
    observed_tds_test = np.isfinite(x_test_raw[:, tds_index])
    xcc = x_train_raw[observed_tds_train, tds_index]
    ycc = y_train[observed_tds_train]
    xcc_mean, ycc_mean = float(xcc.mean()), float(ycc.mean())
    complete_case_slope = float(np.sum((xcc - xcc_mean) * (ycc - ycc_mean)) / np.sum((xcc - xcc_mean) ** 2))
    complete_case_intercept = float(ycc_mean - complete_case_slope * xcc_mean)
    xcc_test = x_test_raw[observed_tds_test, tds_index]
    ycc_test = y_test[observed_tds_test]
    complete_case_test_metrics = metrics(ycc_test, complete_case_intercept + complete_case_slope * xcc_test)
    scatter_plot(
        x_test_tds, y_test,
        title="Q4. TDS and total hardness: held-out test observations",
        xlabel="Total dissolved solids (mg/L)",
        ylabel="Total hardness (mgCaCO3/L)",
        filename="q4_test_scatter.png",
        line=(intercept, slope),
    )
    scatter_plot(
        yhat_test, y_test - yhat_test,
        title="Q4. Test residuals versus fitted hardness",
        xlabel="Fitted hardness (mgCaCO3/L)",
        ylabel="Residual: observed minus fitted (mgCaCO3/L)",
        filename="q4_residuals.png",
        zero_line=True,
        color="#477f53",
    )

    # ---------------- Q5: Ridge/Lasso ----------------
    # Objective definitions match the requested lambda interpretation:
    # SSE + lambda * sum(beta^2) or SSE + lambda * sum(abs(beta)).
    def ridge_coefficients(lam: float) -> np.ndarray:
        return np.linalg.solve(z_train.T @ z_train + lam * np.eye(len(PREDICTORS)), z_train.T @ (y_train - y_train.mean()))

    def lasso_coefficients(lam: float) -> np.ndarray:
        beta = np.zeros(len(PREDICTORS))
        column_norms = np.sum(z_train**2, axis=0)
        centered_y = y_train - y_train.mean()
        for _ in range(30000):
            previous = beta.copy()
            for k in range(len(PREDICTORS)):
                partial_residual = centered_y - z_train @ beta + z_train[:, k] * beta[k]
                rho = float(z_train[:, k] @ partial_residual)
                beta[k] = np.sign(rho) * max(abs(rho) - lam, 0.0) / column_norms[k]
            if np.max(np.abs(beta - previous)) < 1e-9:
                break
        return beta

    q5: dict[str, dict[str, dict]] = {"Ridge": {}, "Lasso": {}}
    for method, fitter in (("Ridge", ridge_coefficients), ("Lasso", lasso_coefficients)):
        for lam in LAMBDAS:
            coef = fitter(lam)
            pred_train = y_train.mean() + z_train @ coef
            pred_test = y_train.mean() + z_test @ coef
            q5[method][str(lam)] = {
                "intercept": float(y_train.mean()),
                "coefficients": dict(zip(PREDICTORS, map(float, coef))),
                "train_metrics": metrics(y_train, pred_train),
                "test_metrics": metrics(y_test, pred_test),
                "zero_coefficient_count": int(np.sum(np.abs(coef) < 1e-8)),
            }
    # A wider penalty sensitivity grid checks when Lasso begins selecting
    # variables; the required lambda values remain the reported main results.
    q5_sensitivity = {}
    for lam in (10.0, 100.0, 1000.0, 10000.0):
        coef = lasso_coefficients(lam)
        pred_test = y_train.mean() + z_test @ coef
        q5_sensitivity[str(lam)] = {
            "zero_coefficient_count": int(np.sum(np.abs(coef) < 1e-8)),
            "retained_predictors": [PREDICTORS[i] for i, value in enumerate(coef) if abs(value) >= 1e-8],
            "test_metrics": metrics(y_test, pred_test),
        }
    ridge_1 = q5["Ridge"]["1.0"]["coefficients"]
    lasso_1 = q5["Lasso"]["1.0"]["coefficients"]
    horizontal_bars(
        PREDICTORS, np.array(list(ridge_1.values())),
        title="Q5. Standardized-predictor coefficients at lambda = 1",
        filename="q5_coefficients_lambda1.png",
        series2=np.array(list(lasso_1.values())),
        series1_label="Ridge", series2_label="Lasso",
    )
    corr = pd.DataFrame(z_train, columns=PREDICTORS).corr()
    corr_values = corr.to_numpy().copy()
    np.fill_diagonal(corr_values, 0)
    max_pair_index = np.unravel_index(np.argmax(np.abs(corr_values)), corr_values.shape)
    max_corr_pair = {
        "predictor_1": PREDICTORS[max_pair_index[0]],
        "predictor_2": PREDICTORS[max_pair_index[1]],
        "correlation": float(corr_values[max_pair_index]),
    }

    # ---------------- Q6: PCA on standardized training predictors ----------------
    covariance = z_train.T @ z_train / (len(z_train) - 1)
    eigenvalues, eigenvectors = np.linalg.eigh(covariance)
    order = np.argsort(eigenvalues)[::-1]
    eigenvalues = eigenvalues[order]
    eigenvectors = eigenvectors[:, order]
    ratios = eigenvalues / eigenvalues.sum()
    cumulative = np.cumsum(ratios)
    scores = z_train @ eigenvectors[:, :2]
    # Correlations of variables with component scores provide interpretable,
    # scale-independent loadings for standardized input columns.
    loadings = eigenvectors[:, :2] * np.sqrt(eigenvalues[:2])
    n80 = int(np.searchsorted(cumulative, 0.80) + 1)
    n90 = int(np.searchsorted(cumulative, 0.90) + 1)
    scree = Image.new("RGB", (1600, 900), "white")
    d = ImageDraw.Draw(scree)
    d.text((180, 35), "Q6. PCA explained variance by component", fill="#17324d", font=font(30, True))
    plot_left, plot_right, plot_top, plot_bottom = 180, 1500, 120, 750
    for tick in np.linspace(0, 1, 6):
        py = plot_bottom - int(tick * (plot_bottom - plot_top))
        d.line((plot_left, py, plot_right, py), fill="#e3e8ec", width=2)
        d.text((100, py - 10), f"{tick:.0%}", fill="#333333", font=font(18))
    component_x = np.linspace(plot_left + 70, plot_right - 70, len(ratios))
    for i, (px, ratio) in enumerate(zip(component_x, ratios)):
        bar_top = plot_bottom - int(ratio * (plot_bottom - plot_top))
        d.rectangle((int(px - 28), bar_top, int(px + 28), plot_bottom), fill="#2878b5")
        cum_y = plot_bottom - int(cumulative[i] * (plot_bottom - plot_top))
        d.ellipse((int(px - 7), cum_y - 7, int(px + 7), cum_y + 7), fill="#d96750")
        d.text((int(px - 16), plot_bottom + 15), f"{i + 1}", fill="#333333", font=font(18))
    d.line([(int(x), int(plot_bottom - c * (plot_bottom - plot_top))) for x, c in zip(component_x, cumulative)], fill="#d96750", width=4)
    d.text((plot_left, 810), "Principal component (blue bars: individual share; red line: cumulative share)", fill="#222222", font=font(21))
    save_figure(scree, "q6_scree.png")
    scatter_plot(
        scores[:, 0], scores[:, 1],
        title="Q6. Training observations projected onto first two PCs",
        xlabel=f"PC1 score ({ratios[0]:.1%} variance)",
        ylabel=f"PC2 score ({ratios[1]:.1%} variance)",
        filename="q6_scores.png",
        color="#3a7d44",
    )
    horizontal_bars(
        PREDICTORS, loadings[:, 0], series2=loadings[:, 1],
        title="Q6. Signed loadings for PC1 and PC2",
        filename="q6_loadings.png", series1_label="PC1", series2_label="PC2",
    )

    missing = {
        col: {
            "train_missing_n": int(np.isnan(x_train_raw[:, i]).sum()),
            "train_missing_pct": float(np.isnan(x_train_raw[:, i]).mean() * 100),
            "test_missing_n": int(np.isnan(x_test_raw[:, i]).sum()),
            "test_missing_pct": float(np.isnan(x_test_raw[:, i]).mean() * 100),
            "training_imputation_median": float(medians[i]),
        }
        for i, col in enumerate(PREDICTORS)
    }
    results = {
        "response": RESPONSE,
        "predictors": PREDICTORS,
        "excluded_predictors_and_reason": {
            "Calcium (mg/L)": "hardness is computed from calcium and magnesium",
            "Magnesium (mg/L)": "hardness is computed from calcium and magnesium",
            "Total Alkalinity (mg/L as CaCO3)": "derived/closely related measurement",
            "Sodium Adsorption Ratio (%)": "derived/closely related measurement",
        },
        "sample_sizes": {"train": len(y_train), "test": len(y_test)},
        "preprocessing": {
            "imputation": "training-set medians fitted per predictor; applied to train and test",
            "standardization": "training means and population standard deviations; applied to train and test",
            "feature_missingness": missing,
        },
        "target_distribution_train": {
            "mean": float(np.mean(y_train)),
            "median": float(np.median(y_train)),
            "sd": float(np.std(y_train, ddof=1)),
            "skewness": float(pd.Series(y_train).skew()),
            "quantiles": {str(q): float(np.quantile(y_train, q)) for q in (0.5, 0.9, 0.95, 0.99)},
        },
        "q4": {
            "predictor": TDS,
            "intercept": intercept,
            "slope": slope,
            "training_pearson_r": correlation,
            "slope_approx_95pct_ci": slope_ci95,
            "train_metrics": q4_train,
            "test_metrics": q4_test,
            "test_training_mean_baseline": baseline,
            "test_central_95pct_metrics_sensitivity": q4_central95,
            "test_target_95th_percentile": p95,
            "complete_case_sensitivity": {
                "training_observed_tds_n": int(observed_tds_train.sum()),
                "test_observed_tds_n": int(observed_tds_test.sum()),
                "intercept": complete_case_intercept,
                "slope": complete_case_slope,
                "test_metrics": complete_case_test_metrics,
            },
        },
        "q5": {
            "objective": "SSE + lambda*sum(beta^2) for Ridge; SSE + lambda*sum(abs(beta)) for Lasso; intercept unpenalized",
            "target_scaling": "none; coefficients in original hardness units per standardized predictor",
            "required_lambda_fits": q5,
            "lasso_penalty_sensitivity": q5_sensitivity,
            "largest_absolute_training_predictor_correlation": max_corr_pair,
        },
        "q6": {
            "fit_on": "standardized training predictors only",
            "explained_variance_ratio_all_components": list(map(float, ratios)),
            "cumulative_explained_variance": list(map(float, cumulative)),
            "components_for_80pct": n80,
            "components_for_90pct": n90,
            "loadings_pc1_pc2": {PREDICTORS[i]: list(map(float, loadings[i])) for i in range(len(PREDICTORS))},
        },
    }
    (OUT / "results.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
    build_pdf(results)
    print(f"Q4 test RMSE={q4_test['rmse']:.2f}; R2={q4_test['r2']:.3f}; slope={slope:.4f}")
    for method in ("Ridge", "Lasso"):
        for lam in LAMBDAS:
            row = q5[method][str(lam)]
            print(f"Q5 {method} lambda={lam:g}: test RMSE={row['test_metrics']['rmse']:.2f}; "
                  f"R2={row['test_metrics']['r2']:.3f}; zeros={row['zero_coefficient_count']}")
    print(f"Q6 PC1={ratios[0]:.1%}; PC2={ratios[1]:.1%}; "
          f"components for 80%/90%={n80}/{n90}")
    print(f"Detailed results and figures: {OUT}")
    return results


def build_pdf(results: dict) -> None:
    """Create a conventional serif, article-style PDF matching course reports."""
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import Image as RLImage, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    styles = getSampleStyleSheet()
    styles["Normal"].fontName = "Times-Roman"
    styles["Normal"].fontSize = 10
    styles["Normal"].leading = 13
    styles["Normal"].spaceAfter = 6
    styles["Title"].fontName = "Times-Bold"
    styles["Title"].fontSize = 17
    styles["Title"].leading = 20
    styles["Title"].alignment = TA_CENTER
    styles["Heading1"].fontName = "Times-Bold"
    styles["Heading1"].fontSize = 13
    styles["Heading1"].leading = 16
    styles["Heading1"].spaceBefore = 12
    styles["Heading1"].spaceAfter = 6
    styles["Heading2"].fontName = "Times-Bold"
    styles["Heading2"].fontSize = 11
    styles["Heading2"].leading = 14
    styles.add(ParagraphStyle(name="CenteredMeta", parent=styles["Normal"], alignment=TA_CENTER, fontSize=9, leading=11))
    styles.add(ParagraphStyle(name="Caption", parent=styles["Normal"], alignment=TA_CENTER, fontSize=8.5, leading=10, spaceBefore=3))
    styles.add(ParagraphStyle(name="Small", parent=styles["Normal"], fontSize=8, leading=10))

    def figure(path: Path, width_cap: float = 6.45 * inch, height_cap: float = 4.1 * inch) -> RLImage:
        # Preserve native image proportions rather than forcing an independent height.
        image = RLImage(str(path))
        ratio = min(width_cap / image.imageWidth, height_cap / image.imageHeight)
        image.drawWidth = image.imageWidth * ratio
        image.drawHeight = image.imageHeight * ratio
        return image

    def caption(text: str) -> Paragraph:
        return Paragraph(text, styles["Caption"])

    q4, q6 = results["q4"], results["q6"]
    q5 = results["q5"]["required_lambda_fits"]
    story = [
        Spacer(1, 0.2 * inch),
        Paragraph("ES 225 Assignment 3: Regression and Dimensionality Reduction", styles["Title"]),
        Paragraph("Questions 4, 5 and 6", styles["CenteredMeta"]),
        Paragraph("Prepared by: Person C", styles["CenteredMeta"]),
        Paragraph("Dataset: CWC Surface Water Quality, Kerala (1980 to 2020)", styles["CenteredMeta"]),
        Spacer(1, 0.15 * inch),
        Paragraph("1&nbsp;&nbsp; Dataset and analysis design", styles["Heading1"]),
        Paragraph(
            "The shared split contains 4,252 training and 1,064 test samples with observed Total Hardness. "
            "The response is Total Hardness (mgCaCO3/L). Predictors are Carbonate, Chloride, Dissolved oxygen, "
            "Total Dissolved Solids (TDS), Bicarbonate, Sodium, pH, Sulphate and Total Phosphorus. Calcium and "
            "Magnesium were excluded because hardness is calculated from them; Total Alkalinity and SAR were "
            "excluded as derived or closely related measurements. Predictor blanks were filled with training-set "
            "medians. Standardization used training means and SDs, and the same fitted values were applied to test rows.",
            styles["Normal"],
        ),
        Paragraph(
            f"Training hardness is right-skewed: mean {results['target_distribution_train']['mean']:.2f}, "
            f"median {results['target_distribution_train']['median']:.2f}, SD {results['target_distribution_train']['sd']:.2f}, "
            f"skewness {results['target_distribution_train']['skewness']:.2f}. The upper tail therefore has a strong effect on squared-error measures.",
            styles["Normal"],
        ),
        Paragraph("2&nbsp;&nbsp; Question 4: Simple linear regression", styles["Heading1"]),
        Paragraph(
            f"TDS was selected as an interpretable one-variable predictor. The train-fitted model is "
            f"<b>Hardness = {q4['intercept']:.3f} + {q4['slope']:.4f} x TDS</b>. "
            f"A 1 mg/L increase in TDS corresponds to {q4['slope']:.3f} mgCaCO3/L higher predicted hardness in this fitted association; this is not a causal estimate. "
            f"Training Pearson r = {q4['training_pearson_r']:.3f}; approximate 95% slope CI = "
            f"[{q4['slope_approx_95pct_ci'][0]:.4f}, {q4['slope_approx_95pct_ci'][1]:.4f}].",
            styles["Normal"],
        ),
        Paragraph(
            f"Held-out test performance (n = 1,064): RSS {q4['test_metrics']['rss']:,.1f}, "
            f"MSE {q4['test_metrics']['mse']:.2f}, RMSE {q4['test_metrics']['rmse']:.2f}, "
            f"MAE {q4['test_metrics']['mae']:.2f}, R-squared {q4['test_metrics']['r2']:.3f}. "
            f"The train-mean baseline has test MSE {q4['test_training_mean_baseline']['mse']:.2f}; TDS reduces this by "
            f"{100 * (1-q4['test_metrics']['mse']/q4['test_training_mean_baseline']['mse']):.1f}%.",
            styles["Normal"],
        ),
        Paragraph(
            f"TDS is missing in about 64% of training rows, so median imputation is consequential. A complete-case sensitivity fit using "
            f"{q4['complete_case_sensitivity']['training_observed_tds_n']:,} training rows and "
            f"{q4['complete_case_sensitivity']['test_observed_tds_n']:,} test rows gives slope "
            f"{q4['complete_case_sensitivity']['slope']:.4f} and test RMSE "
            f"{q4['complete_case_sensitivity']['test_metrics']['rmse']:.2f}. It uses a smaller, potentially selected subset and does not replace the shared imputed analysis.",
            styles["Normal"],
        ),
        figure(FIG / "q4_test_scatter.png"),
        caption("Figure 1: Held-out test observations and the line fitted using training observations. Axes show measurement units."),
        PageBreak(),
        Paragraph("3&nbsp;&nbsp; Question 4: Residual diagnostics", styles["Heading1"]),
        Paragraph(
            f"The residual plot checks whether prediction errors are centered and whether their spread is constant. "
            f"The held-out mean residual (observed minus predicted) is {q4['test_metrics']['mean_error_actual_minus_predicted']:.2f} mgCaCO3/L. "
            f"RMSE for test observations at or below the test 95th percentile ({q4['test_target_95th_percentile']:.2f}) is "
            f"{q4['test_central_95pct_metrics_sensitivity']['rmse']:.2f}; this central-range value is a sensitivity summary, "
            "while the full-test metrics above remain the main reported score. The plot should be checked for curvature, a fan-shaped spread, and extreme residuals.",
            styles["Normal"],
        ),
        figure(FIG / "q4_residuals.png"),
        caption("Figure 2: Residuals against fitted hardness for the test set; the red line marks zero error."),
        Paragraph("4&nbsp;&nbsp; Question 5: Ridge and Lasso", styles["Heading1"]),
        Paragraph(
            "Predictors were standardized; hardness stayed in original units. A coefficient is the predicted hardness change per one training SD increase in that predictor, conditional on other included predictors. "
            "The objective is SSE + lambda times the L2 penalty for Ridge or the L1 penalty for Lasso; the intercept is not penalized.", styles["Normal"]),
    ]
    coefficient_rows = [["Predictor", "Ridge .01", "Ridge .1", "Ridge 1", "Lasso .01", "Lasso .1", "Lasso 1"]]
    for predictor in PREDICTORS:
        coefficient_rows.append([predictor] + [
            f"{q5[method][str(lam)]['coefficients'][predictor]:.3f}"
            for method, lam in (("Ridge", .01), ("Ridge", .1), ("Ridge", 1.0), ("Lasso", .01), ("Lasso", .1), ("Lasso", 1.0))
        ])
    table = Table(coefficient_rows, colWidths=[1.72 * inch] + [0.72 * inch] * 6, repeatRows=1)
    table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Times-Roman"),
        ("FONTNAME", (0, 0), (-1, 0), "Times-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.4),
        ("LINEABOVE", (0, 0), (-1, 0), 0.8, colors.black),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.black),
        ("LINEBELOW", (0, -1), (-1, -1), 0.8, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f3f3")]),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))
    story += [table, caption("Table 1: Ridge and Lasso coefficients (hardness units per standardized predictor).")]
    ridge1 = q5["Ridge"]["1.0"]["test_metrics"]
    lasso1 = q5["Lasso"]["1.0"]["test_metrics"]
    sensitivity = results["q5"]["lasso_penalty_sensitivity"]
    story += [
        Paragraph(
            f"At lambda = 0.01, 0.1, and 1, Lasso drops no predictors. Ridge and Lasso at lambda = 1 have test R-squared "
            f"{ridge1['r2']:.3f} and {lasso1['r2']:.3f}; their RMSEs are {ridge1['rmse']:.2f} and {lasso1['rmse']:.2f}. "
            f"The largest absolute training predictor correlation is {results['q5']['largest_absolute_training_predictor_correlation']['correlation']:.2f} "
            f"between {results['q5']['largest_absolute_training_predictor_correlation']['predictor_1']} and "
            f"{results['q5']['largest_absolute_training_predictor_correlation']['predictor_2']}. Correlation can make conditional coefficients unstable or sign-reversed.",
            styles["Normal"],
        ),
        figure(FIG / "q5_coefficients_lambda1.png"),
        caption("Figure 3: Ridge and Lasso coefficient comparison at lambda = 1, with signed, labeled scale."),
        Paragraph(
            f"Penalty sensitivity: at lambda = 10, 100, 1,000 and 10,000, Lasso selects "
            f"{', '.join(str(sensitivity[str(l)]['zero_coefficient_count']) for l in (10.0, 100.0, 1000.0, 10000.0))} zero coefficients, respectively. "
            "This wider grid shows that sparsity can be induced, but those values are supplemental; the required comparison remains at the assigned penalties.", styles["Normal"]),
        Paragraph("5&nbsp;&nbsp; Question 6: Principal component analysis", styles["Heading1"]),
        Paragraph(
            f"PCA is fitted to standardized training predictors. PC1 explains {q6['explained_variance_ratio_all_components'][0]:.1%} and "
            f"PC2 explains {q6['explained_variance_ratio_all_components'][1]:.1%} of predictor variance, {sum(q6['explained_variance_ratio_all_components'][:2]):.1%} combined. "
            f"{q6['components_for_80pct']} components are required to explain 80% and {q6['components_for_90pct']} to explain 90%. "
            "The score plot shows the training rows projected onto the first two components. The scree plot summarizes all nine components.", styles["Normal"]),
        figure(FIG / "q6_scores.png"),
        caption("Figure 4: Training observations projected into the PC1-PC2 score plane."),
        figure(FIG / "q6_scree.png", height_cap=3.0 * inch),
        caption("Figure 5: Individual and cumulative variance explained by the principal components."),
        Paragraph(
            f"PC1 is mainly a dissolved-ion gradient: its strongest absolute loadings are Bicarbonate ({q6['loadings_pc1_pc2'][PREDICTORS[4]][0]:.2f}), "
            f"Sodium ({q6['loadings_pc1_pc2'][PREDICTORS[5]][0]:.2f}), Chloride ({q6['loadings_pc1_pc2'][PREDICTORS[1]][0]:.2f}), "
            f"TDS ({q6['loadings_pc1_pc2'][PREDICTORS[3]][0]:.2f}), and Sulphate ({q6['loadings_pc1_pc2'][PREDICTORS[7]][0]:.2f}). "
            f"PC2 is most associated with Total Phosphorus ({q6['loadings_pc1_pc2'][PREDICTORS[8]][1]:.2f}) and Carbonate ({q6['loadings_pc1_pc2'][PREDICTORS[0]][1]:.2f}). "
            "The sign of an entire component is arbitrary; relative signs and loading magnitudes give the interpretation.", styles["Normal"]),
        figure(FIG / "q6_loadings.png", height_cap=3.5 * inch),
        caption("Figure 6: Signed loadings for PC1 and PC2."),
        Paragraph("6&nbsp;&nbsp; Discussion and limitations", styles["Heading1"]),
        Paragraph(
            "Median imputation retains shared rows but compresses variability, especially for more incomplete predictors. The random row split may place the same stations and periods in both sets, so it measures pooled-data interpolation rather than generalization to an unseen station or future period. Even after excluding direct hardness inputs, the remaining ions are chemically related to hardness. The penalty convention is specified because software packages differ in whether they divide the loss by sample count. Full numerical outputs and the reproducible analysis are supplied alongside the report.",
            styles["Normal"]),
    ]

    def page_number(canvas, doc):
        canvas.saveState()
        canvas.setFont("Times-Roman", 9)
        canvas.drawCentredString(letter[0] / 2, 0.45 * inch, str(doc.page))
        canvas.restoreState()

    document = SimpleDocTemplate(
        str(ROOT / "Person_C_Report.pdf"), pagesize=letter,
        rightMargin=0.82 * inch, leftMargin=0.82 * inch,
        topMargin=0.7 * inch, bottomMargin=0.72 * inch,
    )
    document.build(story, onFirstPage=page_number, onLaterPages=page_number)


if __name__ == "__main__":
    main()
