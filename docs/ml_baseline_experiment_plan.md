# EVShield Mini Project — ML Baseline Experiment Plan

This document defines the Step 13 ML experimentation design only. It does not train any model, does not modify the preprocessing pipeline, and does not touch the original dataset under `ml/dataset/`.

## 1. Scope and constraints

The approved architecture remains:

- one complete labelled `data_point[]` series = one ML sample
- no cross-family row alignment
- no fabricated event IDs or pseudo-event keys
- no test-data leakage
- approved condition-directory split remains fixed
- raw TOP symbol remains metadata only
- TOP baseline uses only `count`, `mean`, `max`, `sum`
- no K=20 vocabulary is used in the Mini Project baseline

The only objective here is to define a scientifically defensible ML baseline experiment plan for the processed family-specific datasets already generated under `ml/processed/`.

## 2. Datasets and scientific suitability

### 2.1 Suitable for baseline ML training

These datasets have enough samples for a meaningful baseline experiment under the approved train/test holdout:

1. `TOP_baseline_dataset`
   - train: 4152
   - test: 3592
   - class distribution: train = 1136 normal, 3016 attack; test = 1219 normal, 2373 attack
   - feature count: 4
   - suitable for logistic regression, random forest, XGBoost, and an imbalance-aware baseline

2. `TIME_DELTA_dataset`
   - train: 12
   - test: 8
   - class distribution: train = 6 normal, 6 attack; test = 4 normal, 4 attack
   - feature count: 6
   - technically valid as a small-sample exploratory dataset, but not enough for robust generalization conclusions

3. `STAT_CS_branch`
   - train: 12
   - test: 8
   - class distribution: train = 6 normal, 6 attack; test = 4 normal, 4 attack
   - feature count: 6
   - technically valid but small-sample exploratory only

4. `STAT_CS_cycles`
   - train: 12
   - test: 8
   - same characteristics as `STAT_CS_branch`

5. `STAT_CS_instructions`
   - train: 12
   - test: 8
   - same characteristics as `STAT_CS_branch`

These are the main baseline-trained datasets with sufficient or near-sufficient sample counts for experimentation. Among them, `TOP_baseline_dataset` is the only dataset large enough for a proper baseline and a realistic class-imbalance study.

### 2.2 Exploratory only due to very small sample counts

These datasets are valid but should be treated as exploratory experiments only because the train/test sizes are too small for stable statistical conclusions:

1. `STAT_GS_branch`
   - train: 4
   - test: 4
   - class distribution: train = 2 normal, 2 attack; test = 2 normal, 2 attack

2. `STAT_GS_cycles`
   - train: 4
   - test: 4

3. `STAT_GS_instructions`
   - train: 4
   - test: 4

4. `TIME_DELTA_dataset` is also borderline and should be treated as a small-sample baseline rather than a strong model candidate

These datasets should not be used to make final model-selection decisions because they are too small and can easily overfit or produce unstable rankings.

### 2.3 Scientific interpretation

The approved design implies the family-specific datasets are separate experiments rather than one merged dataset. Therefore, model evaluation should be reported per dataset family, not as a single all-in-one classifier.

A sensible interpretation is:

- `TOP_baseline_dataset` = primary baseline experiment
- `TIME_DELTA_dataset` and the CS STAT datasets = secondary exploratory baselines
- GS STAT datasets = highly exploratory / diagnostic only

## 3. Recommended baseline models for TOP

The baseline model selection for the large `TOP_baseline_dataset` should include at least the following:

1. Logistic Regression
2. Random Forest
3. XGBoost
4. One additional appropriate baseline: k-Nearest Neighbors (k-NN) or Linear SVM

Recommended default list:

- Logistic Regression
- Random Forest
- XGBoost
- Linear SVM (preferred additional baseline to complement the linear vs tree vs boosted structure)

### 3.1 Logistic Regression

Why it is used:

- simple and interpretable linear baseline
- fast to train and easy to reproduce
- useful for checking whether the TOP summary features carry a separable linear signal
- good reference point for comparing more expressive models

Suitability:

- appropriate because TOP has only four numeric summary features
- useful as a low-complexity baseline
- helps determine whether the signal is largely linear or not

### 3.2 Random Forest

Why it is used:

- non-linear, robust to feature scaling differences
- handles mixed feature values well without strict distribution assumptions
- provides a strong tree-based baseline that is less sensitive to outliers than linear models
- interpretable via feature importance, although not required for final reporting

Suitability:

- good for moderately sized tabular data such as the TOP dataset
- useful as a non-linear baseline that does not require standardization

### 3.3 XGBoost

Why it is used:

- strong gradient-boosted tree baseline for tabular classification
- often performs very well on tabular summary-feature tasks
- suitable for imbalanced binary classification when configured with class weighting or sample weighting
- evaluates whether a stronger nonlinear model materially improves detection over simpler baselines

Suitability:

- appropriate for the larger TOP dataset
- should be used with explicit imbalance handling and a fixed random seed
- must remain a baseline model, not an exploratory black box, because the approved scope is local ML experimentation with reproducibility

### 3.4 Additional baseline: Linear SVM

Why it is used:

- provides a strong linear margin-based baseline distinct from Logistic Regression
- useful when the signal is not perfectly separable in a simple linear model but still mostly linear
- helps interpret whether a nonlinear model is actually necessary

Suitability:

- scientifically defensible as a second linear baseline
- especially useful when a more robust comparison is needed beyond logistic regression

Other models such as Naive Bayes or shallow MLP are possible but are not the most appropriate first-tier baselines for this Mini Project. The four-model selection above is better focused and easier to justify.

## 4. Evaluation metrics

Each family-specific model must report the following metrics on the approved condition-level TEST set only after all TRAIN-only fitting is complete:

1. Accuracy
2. Precision
3. Recall
4. F1-score
5. ROC-AUC
6. PR-AUC
7. Confusion matrix

Definitions:

- accuracy = overall fraction of correct predictions
- precision = TP / (TP + FP)
- recall = TP / (TP + FN)
- F1-score = harmonic mean of precision and recall
- ROC-AUC = area under the receiver operating characteristic curve
- PR-AUC = area under the precision-recall curve, especially important for imbalanced classes
- confusion matrix = reported as rows = true label, columns = predicted label, with class 0 = normal and class 1 = attack

For the TOP dataset, PR-AUC is especially important because the positive class (attack) is the minority class in the final balanced-by-condition test set? In practice, the test split is still imbalanced in terms of class counts, so PR-AUC is the more informative ranking metric than accuracy alone.

## 5. Class imbalance handling

The TOP dataset is class-imbalanced:

- train: 1136 normal, 3016 attack
- test: 1219 normal, 2373 attack

This imbalance must be handled explicitly but without violating train/test separation.

Recommended strategy:

- Use class weights or sample weights during training for models that support them (`Logistic Regression`, `Random Forest`, `XGBoost`, `Linear SVM` where applicable).
- For TOP, the class weighting should be based only on TRAIN data.
- Use the same weighting scheme when comparing models.
- For model evaluation, do not change thresholds based on TEST; use the default decision threshold 0.5 unless a separate threshold policy is explicitly approved and tuned only on TRAIN validation folds.

Recommended formal rule:

- For all TOP models, fit the imbalance strategy using TRAIN only.
- Any threshold tuning, class reweighting, or sampling adjustment must be decided inside TRAIN-only validation folds and frozen before TEST evaluation.

Concrete handling by model:

- Logistic Regression: `class_weight='balanced'`
- Random Forest: `class_weight='balanced'`
- XGBoost: `scale_pos_weight = negative_count / positive_count`, computed on TRAIN only
- Linear SVM: `class_weight='balanced'`

This is consistent with the requirement that the classifier should not be tuned using TEST data.

The small STAT/TIME_DELTA datasets are also balanced or near-balanced across the approved train/test split, so class imbalance is less of an issue there. However, imbalance handling may still be applied consistently where appropriate without changing the data itself.

## 6. Training-only preprocessing and fit rules

The approved dataset architecture requires all learned preprocessing to be fitted on TRAIN only and then frozen before TEST transformation.

For the baseline plan:

1. Load the approved `train.csv` / `test.csv` files for each dataset.
2. Separate features and labels.
3. If a model requires scaling:
   - fit `StandardScaler` on TRAIN features only
   - transform TRAIN with fitted scaler
   - transform TEST with the frozen scaler parameters
4. If a model does not require scaling (e.g. tree models), do not scale unnecessarily.
5. If a model requires class weighting, compute the weighting from TRAIN labels only.
6. If model-specific hyperparameters are tuned, do so only with TRAIN-only validation folds (for example, repeated stratified k-fold on TRAIN only).
7. After all tuning is complete, freeze the selected model, fit it on the full TRAIN set, and evaluate once on the untouched TEST set.

Important prohibition:

- no TEST-set feature scaling or imputation fit
- no TEST-set model selection
- no TEST-set threshold tuning
- no TEST-set feature selection

## 7. Validation strategy using TRAIN only

Because the approved TEST set must remain untouched until the final evaluation, model selection and hyperparameter tuning must be performed inside TRAIN only.

Recommended TRAIN-only validation design:

- use stratified k-fold cross-validation on TRAIN only
- choose e.g. `cv = 5` for TOP; lower values may be appropriate for tiny datasets
- use the same metric set inside each validation fold:
  - F1-score
  - ROC-AUC
  - PR-AUC
- keep the test set sealed until the final comparison

For the tiny datasets (`TIME_DELTA_dataset`, each STAT_CS dataset, each GS STAT dataset):

- cross-validation should be minimal and interpreted cautiously
- the goal is to estimate instability, not to create a strong tuning loop
- if the train sample count is too low for reliable cross-validation, the dataset may be used only for a non-optimized exploratory baseline and not for final model selection

## 8. Reproducibility

The following items must be recorded for every experiment:

1. random seed
   - fixed integer, e.g. `42`
   - use the same seed for all model initializations that support randomness

2. Python package versions
   - Python version
   - scikit-learn version
   - pandas version
   - NumPy version
   - XGBoost version

3. dataset version information
   - processed dataset path
   - preprocessing configuration hash or snapshot
   - preprocessing validation snapshot

4. model configuration
   - model name
   - hyperparameters
   - class-weight strategy
   - scaler settings
   - CV settings
   - train/test split definition

5. output artifact naming
   - `experiment_config.json`
   - `experiment_summary.json`
   - `model.joblib`
   - `scaler.joblib` if used
   - `predictions.csv`
   - `metrics.json`
   - `confusion_matrix.json`

## 9. Experiment output structure

A final experiment output directory should have the following structure:

```text
ml/experiments/
  experiment_YYYYMMDD_HHMMSS/
    config.json
    summary.json
    metrics.json
    confusion_matrix.json
    predictions.csv
    model.joblib
    scaler.joblib
    train_cv_results.csv
    dataset_manifest.json
```

For family-specific runs, the directory can be named by dataset and model type, for example:

```text
ml/experiments/
  TOP_baseline_dataset/
    logistic_regression/
    random_forest/
    xgboost/
    linear_svm/
```

Each run should include:

- dataset name
- model name
- train/test split metadata
- target label encoding
- class imbalance settings
- configuration parameters
- performance metrics
- confusion matrix
- model artifact path
- timestamp

## 10. Model selection without using TEST data

The approved rule is strict: no model selection on the TEST set.

The final selection rule should be:

1. Use only TRAIN data for model fitting and cross-validation.
2. Run TRAIN-only cross-validation for each candidate model.
3. Rank candidates on TRAIN-only validation metrics, with priority order:
   - PR-AUC for imbalanced binary classification
   - ROC-AUC
   - F1-score
   - recall
   - precision
4. Select the best model based on TRAIN-only validation, not TEST.
5. After selection, fit the chosen model on the full TRAIN set.
6. Evaluate the fitted model once on the untouched TEST set to generate final metrics.

This ensures that the TEST set remains a final evaluation set, not a development set.

## 11. Recommended baseline experiment order

The recommended experimental order is:

1. `TOP_baseline_dataset`
   - Logistic Regression
   - Random Forest
   - XGBoost
   - Linear SVM

2. `TIME_DELTA_dataset`
   - simple baseline model only
   - exploratory only

3. `STAT_CS_branch`, `STAT_CS_cycles`, `STAT_CS_instructions`
   - small-sample exploratory baselines only

4. `STAT_GS_branch`, `STAT_GS_cycles`, `STAT_GS_instructions`
   - diagnostic / exploratory only

This ordering reflects the actual sample counts and keeps the exploration scientifically honest.

## 12. Final recommendation

The single most important baseline ML experiment for this Mini Project is the `TOP_baseline_dataset` family, because it is the only dataset with sufficient sample count to support stable, interpretable comparison across multiple candidate models.

The other datasets are still valuable as family-specific exploratory baselines, but they should not be treated as final benchmark datasets for model selection because the sample count is too small for robust conclusions.

This design keeps the project aligned with the approved architecture, respects train/test separation, and prevents leakage while still supporting a useful local ML baseline study.
