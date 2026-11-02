"""ES 225 - Assignment 3 (Questions 7 and 8)
Decision Tree Regression and Random Forest Regression for predicting
Total Hardness in the Kerala CWC water-quality dataset.

Usage from the folder containing this script, train.csv and test.csv:
    python es225_q7_q8_analysis.py

Optional paths:
    python es225_q7_q8_analysis.py train.csv test.csv q7_q8_outputs

The script fits median imputation on the training predictors only, uses
5-fold cross-validation for Decision Tree complexity selection, evaluates
all models on the same held-out test set, and saves plots and results.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.model_selection import GridSearchCV, KFold
from sklearn.tree import DecisionTreeRegressor, plot_tree


# ---------------------------------------------------------------------------
# 1. File paths and variables
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent
TRAIN_FILE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "train.csv"
TEST_FILE = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "test.csv"
OUT = Path(sys.argv[3]) if len(sys.argv) > 3 else ROOT / "q7_q8_outputs"
OUT.mkdir(parents=True, exist_ok=True)

FEATURES = [
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
TARGET = "Total Hardness (mgCaCO3/L)"
RANDOM_STATE = 42


# ---------------------------------------------------------------------------
# 2. Load data and prepare predictors
# ---------------------------------------------------------------------------
train = pd.read_csv(TRAIN_FILE)
test = pd.read_csv(TEST_FILE)

required_columns = FEATURES + [TARGET]
for filename, frame in [(TRAIN_FILE, train), (TEST_FILE, test)]:
    missing = [column for column in required_columns if column not in frame.columns]
    if missing:
        raise ValueError(f"Missing required columns in {filename}: {missing}")

# Rows without the response cannot be used for supervised model fitting.
train = train.dropna(subset=[TARGET]).copy()
test = test.dropna(subset=[TARGET]).copy()

# Median values are learned from training data only to avoid data leakage.
imputer = SimpleImputer(strategy="median")
X_train = pd.DataFrame(
    imputer.fit_transform(train[FEATURES]),
    columns=FEATURES,
    index=train.index,
)
X_test = pd.DataFrame(
    imputer.transform(test[FEATURES]),
    columns=FEATURES,
    index=test.index,
)
y_train = train[TARGET]
y_test = test[TARGET]

print("Training observations:", len(X_train))
print("Testing observations:", len(X_test))
print("Number of predictors:", len(FEATURES))


# ---------------------------------------------------------------------------
# 3. Helper function for model evaluation
# ---------------------------------------------------------------------------
def evaluate_model(name: str, model, Xtr, ytr, Xte, yte) -> dict:
    train_prediction = model.predict(Xtr)
    test_prediction = model.predict(Xte)
    return {
        "Model": name,
        "Train_MSE": float(mean_squared_error(ytr, train_prediction)),
        "Test_MSE": float(mean_squared_error(yte, test_prediction)),
        "Train_RMSE": float(np.sqrt(mean_squared_error(ytr, train_prediction))),
        "Test_RMSE": float(np.sqrt(mean_squared_error(yte, test_prediction))),
        "Train_R2": float(r2_score(ytr, train_prediction)),
        "Test_R2": float(r2_score(yte, test_prediction)),
    }


# ---------------------------------------------------------------------------
# 4. Q7 - Decision Tree Regression
# ---------------------------------------------------------------------------
# Unrestricted tree: used as a baseline to illustrate overfitting.
unrestricted_tree = DecisionTreeRegressor(random_state=RANDOM_STATE)
unrestricted_tree.fit(X_train, y_train)

# Tune tree complexity using cross-validation on the training set only.
parameter_grid = {
    "max_depth": [3, 5, 7, 10, 15, None],
    "min_samples_leaf": [1, 2, 5, 10, 20, 30, 50],
    "min_samples_split": [2, 10, 20],
}
cv = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
search = GridSearchCV(
    DecisionTreeRegressor(random_state=RANDOM_STATE),
    parameter_grid,
    scoring="neg_mean_squared_error",
    cv=cv,
    n_jobs=-1,
)
search.fit(X_train, y_train)
controlled_tree = search.best_estimator_

print("\nQ7 - Decision Tree")
print("Selected parameters:", search.best_params_)
print("Best mean CV MSE:", -search.best_score_)
for label, model in [
    ("Unrestricted Decision Tree", unrestricted_tree),
    ("Controlled Decision Tree", controlled_tree),
]:
    print(f"\n{label}")
    print("Depth:", model.get_depth())
    print("Number of leaves:", model.get_n_leaves())
    print(pd.Series(model.feature_importances_, index=FEATURES).sort_values(ascending=False))


# ---------------------------------------------------------------------------
# 5. Q8 - Random Forest Regression
# ---------------------------------------------------------------------------
random_forest = RandomForestRegressor(
    n_estimators=100,
    random_state=RANDOM_STATE,
    n_jobs=-1,
)
random_forest.fit(X_train, y_train)

print("\nQ8 - Random Forest")
print("Number of trees:", random_forest.n_estimators)
print(pd.Series(random_forest.feature_importances_, index=FEATURES).sort_values(ascending=False))


# ---------------------------------------------------------------------------
# 6. Compare model performance
# ---------------------------------------------------------------------------
models = [
    ("Unrestricted Decision Tree", unrestricted_tree),
    ("Controlled Decision Tree", controlled_tree),
    ("Random Forest", random_forest),
]
results = pd.DataFrame([
    evaluate_model(name, model, X_train, y_train, X_test, y_test)
    for name, model in models
])

print("\nModel comparison")
print(results.to_string(index=False, float_format=lambda value: f"{value:.4f}"))
results.to_csv(OUT / "model_performance.csv", index=False)

importance = pd.DataFrame({
    "Predictor": FEATURES,
    "Unrestricted_Decision_Tree": unrestricted_tree.feature_importances_,
    "Controlled_Decision_Tree": controlled_tree.feature_importances_,
    "Random_Forest": random_forest.feature_importances_,
})
importance.to_csv(OUT / "feature_importance.csv", index=False)

# Save test-set predictions for further checking or website integration.
predictions = pd.DataFrame({
    "Actual_Total_Hardness": y_test,
    "Unrestricted_Tree_Prediction": unrestricted_tree.predict(X_test),
    "Controlled_Tree_Prediction": controlled_tree.predict(X_test),
    "Random_Forest_Prediction": random_forest.predict(X_test),
}, index=y_test.index)
predictions.to_csv(OUT / "test_predictions.csv", index_label="row_index")

summary = {
    "target": TARGET,
    "predictors": FEATURES,
    "training_rows": int(len(X_train)),
    "testing_rows": int(len(X_test)),
    "cross_validation_folds": 5,
    "decision_tree_best_parameters": search.best_params_,
    "decision_tree_best_mean_cv_mse": float(-search.best_score_),
    "random_forest_n_estimators": 100,
    "metrics": results.to_dict(orient="records"),
}
with open(OUT / "results_summary.json", "w", encoding="utf-8") as file:
    json.dump(summary, file, indent=4)


# ---------------------------------------------------------------------------
# 7. Figures
# ---------------------------------------------------------------------------
# Test MSE comparison.
fig, ax = plt.subplots(figsize=(10, 6))
ax.bar(results["Model"], results["Test_MSE"])
ax.set_title("Test MSE Comparison")
ax.set_ylabel("Mean Squared Error")
ax.tick_params(axis="x", rotation=15)
ax.grid(axis="y", alpha=0.25)
fig.tight_layout()
fig.savefig(OUT / "test_mse_comparison.png", dpi=300)
plt.close(fig)

# Test R-squared comparison.
fig, ax = plt.subplots(figsize=(10, 6))
ax.bar(results["Model"], results["Test_R2"])
ax.set_title("Test R-squared Comparison")
ax.set_ylabel("Test R-squared")
ax.tick_params(axis="x", rotation=15)
ax.grid(axis="y", alpha=0.25)
fig.tight_layout()
fig.savefig(OUT / "test_r2_comparison.png", dpi=300)
plt.close(fig)

# Feature importance comparison for the three fitted models.
importance_plot = importance.set_index("Predictor")
importance_plot = importance_plot.sort_values("Random_Forest", ascending=True)
ax = importance_plot.plot(kind="barh", figsize=(11, 7), width=0.8)
ax.set_title("Feature Importance: Decision Tree and Random Forest")
ax.set_xlabel("Feature Importance")
ax.set_ylabel("Predictor")
ax.grid(axis="x", alpha=0.25)
plt.tight_layout()
plt.savefig(OUT / "feature_importance_comparison.png", dpi=300)
plt.close()

# Visualize the first three levels of the controlled tree for readability.
fig, ax = plt.subplots(figsize=(22, 10))
plot_tree(
    controlled_tree,
    feature_names=FEATURES,
    filled=True,
    rounded=True,
    max_depth=3,
    fontsize=8,
    ax=ax,
)
ax.set_title("Controlled Decision Tree (First Three Levels)")
fig.tight_layout()
fig.savefig(OUT / "controlled_tree_first_levels.png", dpi=300)
plt.close(fig)

print(f"\nAll results and figures saved in: {OUT.resolve()}")
