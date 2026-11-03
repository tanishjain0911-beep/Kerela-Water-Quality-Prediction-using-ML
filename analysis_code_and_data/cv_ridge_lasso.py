"""5-fold cross-validation of the Ridge and Lasso penalty (lambda) on the training set only.

Same objective conventions as person_c_analysis.py: Ridge minimises SSE + lambda*sum(beta^2);
Lasso uses coordinate descent soft-thresholding at lambda (0.5*SSE + lambda*sum|beta|).
Median imputation and standardisation are re-fitted inside every fold, so no validation-fold
information leaks into the fitted parameters. The selected lambda is then refitted on the full
training set and evaluated once on the held-out test set.
Usage: python cv_ridge_lasso.py <train.csv> <test.csv> <out.json>
"""
import json
import sys

import numpy as np
import pandas as pd

RESPONSE = "Total Hardness (mgCaCO3/L)"
PREDICTORS = ["Carbonate (mg/L)", "Chloride (mg/L)", "Dissolved oxygen (mg/L)", "Total Dissolved Solids (mg/L)",
              "Bicarbonate (mg/L)", "Sodium (mg/L)", "Potential of Hydrogen (pH)", "Sulphate (mg/L)",
              "Total Phosphorus (mgP/L)"]
GRID = np.logspace(-2, 5, 29)  # 0.01 ... 100,000, four points per decade
K, SEED = 5, 42


def prepare(x_fit, *others):
    med = np.nanmedian(x_fit, axis=0)
    fill = lambda a: np.where(np.isnan(a), med, a)
    xf = fill(x_fit)
    mu, sd = xf.mean(axis=0), xf.std(axis=0)
    sd[sd == 0] = 1.0
    return [(xf - mu) / sd] + [(fill(o) - mu) / sd for o in others]


def ridge(z, y, lam):
    return np.linalg.solve(z.T @ z + lam * np.eye(z.shape[1]), z.T @ (y - y.mean()))


def lasso(z, y, lam, beta=None):
    beta = np.zeros(z.shape[1]) if beta is None else beta.copy()
    norms, yc = np.sum(z ** 2, axis=0), y - y.mean()
    r = yc - z @ beta
    for _ in range(30000):
        prev = beta.copy()
        for k in range(z.shape[1]):
            r += z[:, k] * beta[k]
            rho = z[:, k] @ r
            beta[k] = np.sign(rho) * max(abs(rho) - lam, 0.0) / norms[k]
            r -= z[:, k] * beta[k]
        if np.max(np.abs(beta - prev)) < 1e-9:
            break
    return beta


def scores(y, p):
    mse = float(np.mean((y - p) ** 2))
    return {"mse": mse, "rmse": mse ** 0.5, "r2": 1 - mse * len(y) / float(np.sum((y - y.mean()) ** 2))}


train, test = pd.read_csv(sys.argv[1]), pd.read_csv(sys.argv[2])
X, y = train[PREDICTORS].to_numpy(float), train[RESPONSE].to_numpy(float)
Xt, yt = test[PREDICTORS].to_numpy(float), test[RESPONSE].to_numpy(float)
folds = np.array_split(np.random.default_rng(SEED).permutation(len(y)), K)

out = {"grid": GRID.tolist(), "folds": K, "seed": SEED}
for name, fit in (("Ridge", ridge), ("Lasso", lasso)):
    cv = np.zeros((K, len(GRID)))
    for f in range(K):
        va = folds[f]
        tr = np.concatenate([folds[g] for g in range(K) if g != f])
        ztr, zva = prepare(X[tr], X[va])
        for i, lam in enumerate(GRID):
            b = fit(ztr, y[tr], lam)
            cv[f, i] = np.mean((y[va] - (y[tr].mean() + zva @ b)) ** 2)
    mean, se = cv.mean(axis=0), cv.std(axis=0, ddof=1) / np.sqrt(K)
    best = int(np.argmin(mean))
    one_se = int(max(i for i in range(len(GRID)) if mean[i] <= mean[best] + se[best]))  # largest lambda within 1 SE
    ztr, zte = prepare(X, Xt)
    res = {"cv_mse": mean.tolist(), "cv_se": se.tolist()}
    for tag, i in (("best", best), ("one_se", one_se)):
        b = fit(ztr, y, GRID[i])
        res[tag] = {"lambda": float(GRID[i]), "cv_mse": float(mean[i]), "nonzero": int(np.sum(np.abs(b) > 1e-8)),
                    "dropped": [PREDICTORS[k] for k in range(len(b)) if abs(b[k]) <= 1e-8],
                    "test": scores(yt, y.mean() + zte @ b)}
    out[name] = res
    print(name, {t: (round(res[t]["lambda"], 3), round(res[t]["cv_mse"], 2), res[t]["nonzero"],
                     {k: round(v, 4) for k, v in res[t]["test"].items()}) for t in ("best", "one_se")})
    print("  cv mse by lambda:", " ".join(f"{l:g}:{m:.1f}" for l, m in zip(GRID, mean)))
json.dump(out, open(sys.argv[3], "w"), indent=2)
