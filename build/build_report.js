// Builds the unified ES 225 Assignment 3 report (Group 10) as an editable DOCX.
// Usage: node build/build_report.js  ->  output/ES225_Assignment3_Group10_Report.docx
// Fields (contents, list of figures/tables) are filled by build/finalize_word.ps1.
const fs = require("fs");
const path = require("path");
const L = require("./lib");
const { d, P, H1, H2, H3, bullet, numbered, figure, figurePair, table, tableNote, tabCaption,
  equation, m, frac, sqrt, sub, sup, subsup, sum, codeBlock, FONT, TEXT_W } = L;
const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, Footer, Header, PageNumber,
  TableOfContents, LevelFormat, BorderStyle, Table, TableRow, TableCell, WidthType, PageBreak,
  ExternalHyperlink } = d;

const C = AlignmentType.CENTER;
const center = (text, size, opts = {}) => new Paragraph({ alignment: C, spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
  children: L.runs(text, { size, bold: opts.bold, allCaps: opts.caps }) });

// =========================================================== FRONT MATTER
const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE };
const members = [
  ["Tanmay Sandip Dhule", "25B4208"], ["Teertha Pankaj Gandhi", "25B4233"],
  ["Sri Vishnu Vikyath S", "25B4246"], ["Tanish Vishal Jain", "25B4244"],
];
const memberTable = new Table({
  alignment: C, width: { size: 4600, type: WidthType.DXA }, columnWidths: [3200, 1400], borders: noBorders,
  rows: members.map(([n, r]) => new TableRow({ children: [n, r].map((t, i) => new TableCell({
    width: { size: i ? 1400 : 3200, type: WidthType.DXA }, borders: noBorders,
    children: [new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: t, size: 22 })] })] })) })),
});

const titlePage = [
  center("ES 225 – AI and Data Science", 24, { before: 600 }),
  center("Term Project – Assignment #3", 24, { after: 900 }),
  center("Statistical Analysis, Missing Data and Predictive Modelling of Surface Water Quality", 36, { bold: true, after: 200 }),
  center("Kerala CWC Surface Water Quality Dataset, 1980–2020", 26, { after: 900 }),
  center("Submitted in partial fulfilment of the requirements for the course:", 22, { after: 40 }),
  center("ES 225 – AI and Data Science", 22, { after: 700 }),
  center("Group 10", 24, { bold: true, after: 60 }),
  center("State / Dataset: Kerala – Water Quality", 22, { after: 500 }),
  memberTable,
  center("Environmental Science and Engineering Department", 22, { before: 900, after: 40 }),
  center("INDIAN INSTITUTE OF TECHNOLOGY BOMBAY", 22, { after: 40 }),
  center("Mumbai 400076", 22, { after: 40 }),
  center("Autumn Semester 2026", 22),
];

const DRIVE = "https://drive.google.com/drive/folders/1Iy9n2XDmbHdw5mTXCZkmGpRbUS0Pes2e?usp=drive_link";
const frontMatter = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun("Data Availability")], outlineLevel: 0 }),
  P("The dataset and supporting files used in this report are available at the following Google Drive folder:"),
  new Paragraph({ alignment: C, spacing: { after: 120 }, children: [new ExternalHyperlink({ link: DRIVE, children: [new TextRun({ text: DRIVE, style: "Hyperlink", size: 19 })] })] }),
  P("The source data are the Central Water Commission (CWC) manual chemical water-quality records for Kerala, obtained from the National Water Data Portal [3]. The shared cleaned dataset, the common training and test splits and the Python scripts used for the analysis are listed in Section 1.3 and Appendix A."),

  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Contribution of the Group Members")] }),
  P("Table 1 lists the questions prepared by each member. Tanish Vishal Jain also verified and cross-checked all members’ work and compiled this report."),
  tabCaption(1, "Contribution of each group member."),
  table(["Name", "Roll No.", "Contribution"], [
    ["Tanmay Sandip Dhule", "25B4208", { text: "Q1: Statistical analysis of water-quality patterns (Section 2)", align: "left" }],
    ["Teertha Pankaj Gandhi", "25B4233", { text: "Q2: Missing-data analysis; Q3: Imputation of missing data (Sections 3 and 4)", align: "left" }],
    ["Sri Vishnu Vikyath S", "25B4246", { text: "Q4: Linear regression; Q5: Ridge and Lasso regression; Q6: Principal component analysis (Sections 5–7)", align: "left" }],
    ["Tanish Vishal Jain", "25B4244", { text: "Q7: Decision Tree regression; Q8: Random Forest regression and model comparison (Sections 8 and 9); verification and cross-checking of all members’ work; compilation of the final report", align: "left" }],
  ], [2300, 1100, 5600], { size: 20 }),
  new Paragraph({ spacing: { after: 120 }, children: [] }),

  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Acknowledgements")] }),
  P("We would like to express our sincere gratitude to Prof. Manoranjan Sahu for the inspiring guidance, encouragement and teaching provided throughout the course, which enabled us to understand the methods applied in this assignment and to complete this report."),
  P("We also thank our Teaching Assistants, Yuvraj Bhaiya, Gulshan Bhaiya and Prabhudatta Didi, for their constant guidance and unwavering support, not only in this assignment but throughout the entire course."),

  new Paragraph({ style: "FrontHeading", pageBreakBefore: true, children: [new TextRun("Contents")] }),
  new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({ style: "FrontHeading", children: [new TextRun("List of Figures")] }),
  new TableOfContents("List of Figures", { hyperlink: true, stylesWithLevels: [{ styleName: "Figure Caption", level: 1 }] }),
  new Paragraph({ style: "FrontHeading", children: [new TextRun("List of Tables")] }),
  new TableOfContents("List of Tables", { hyperlink: true, stylesWithLevels: [{ styleName: "Table Caption", level: 1 }] }),
];

// =========================================================== OBJECTIVES
const objectives = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun("Objectives and Scope – Assignment #3")] }),
  P("The aim of this assignment is to assess surface-water quality in Kerala using the CWC dataset from the National Water Data Portal, to examine the quality and completeness of the data, and to compare statistical and machine-learning models that describe relationships among the water-quality parameters. Following the assignment brief, the specific objectives are to:"),
  ...numbered([
    "**Q1** – describe the available parameters, compute descriptive statistics, compare them with applicable standards and test for seasonal and spatial differences (Section 2);",
    "**Q2** – quantify missing values per parameter and discuss their effect on assessment and modelling (Section 3);",
    "**Q3** – apply mean, median and mode imputation and compare their effects on the mean, variance and distribution (Section 4);",
    "**Q4** – fit and interpret a simple linear regression between two relevant parameters (Section 5);",
    "**Q5** – fit Ridge and Lasso regressions for a continuous response and compare coefficient shrinkage and feature selection (Section 6);",
    "**Q6** – apply principal component analysis (PCA) to the standardised parameters and interpret the leading components (Section 7);",
    "**Q7** – train and evaluate a Decision Tree regressor for the Q5 response (Section 8);",
    "**Q8** – train a 100-tree Random Forest regressor and compare it with the Decision Tree (Section 9).",
  ], "alpha"),
  P("Section 1 describes the dataset and the data preparation, training–testing procedure and evaluation metrics shared by all questions; later sections refer back to it rather than repeating it. Section 10 brings the findings together. Q1–Q3 use all 5,433 samples; the predictive models of Q4–Q8 use the 5,316 samples with an observed response, split into 4,252 training and 1,064 test samples."),
];

// =========================================================== 1 DATASET
const stations = [
  ["Kumbidi", "Bharathapuzha", "Palakkad", "10.854", "76.020", "1980–2017", "320"],
  ["Mankara", "Bharathapuzha", "Palakkad", "10.761", "76.486", "1986–2018", "242"],
  ["Pulamanthole", "Bharathapuzha", "Palakkad", "10.898", "76.192", "1986–2018", "271"],
  ["Pudur", "Bharathapuzha", "Palakkad", "10.777", "76.512", "1986–2017", "230"],
  ["Muthankera", "Cauvery", "Wayanad", "11.808", "76.084", "1990–2020", "188"],
  ["Kuniyil", "Chaliyar", "Malappuram", "11.239", "76.023", "1980–2017", "343"],
  ["Karathodu", "Kadalundi", "Malappuram", "11.057", "76.039", "1988–2017", "164"],
  ["Pattazhy", "Kallada", "Kollam", "9.073", "76.761", "1980–2017", "351"],
  ["Kuttyadi", "Kuttyadi", "Kozhikode", "11.651", "75.758", "2002–2018", "86"],
  ["Kidangoor", "Meenachil", "Kottayam", "9.675", "76.603", "1986–2017", "250"],
  ["Ramamangalam", "Muvattupuzha", "Ernakulam", "9.944", "76.478", "1980–2017", "359"],
  ["Kalampur", "Muvattupuzha", "Ernakulam", "9.991", "76.632", "1988–2017", "216"],
  ["Malakkara", "Pamba", "Pathanamthitta", "9.329", "76.664", "1986–2017", "266"],
  ["Kallooppara", "Pamba", "Pathanamthitta", "9.404", "76.650", "1986–2017", "255"],
  ["Thumpamon", "Pamba", "Pathanamthitta", "9.228", "76.700", "1980–2017", "318"],
  ["Erinjipuzha", "Payaswani", "Kasaragod", "12.496", "75.157", "1988–2018", "231"],
  ["Arangali", "Periyar", "Thrissur", "10.286", "76.322", "1980–2017", "327"],
  ["Neeleeswaram", "Periyar", "Ernakulam", "10.184", "76.496", "1980–2017", "357"],
  ["Vandiperiyar", "Periyar", "Idukki", "9.573", "77.091", "2002–2017", "75"],
  ["Perumannu", "Valapatnam", "Kannur", "11.982", "75.584", "1986–2018", "295"],
  ["Ayilam", "Vamanapuram", "Thiruvananthapuram", "8.715", "76.854", "1980–2017", "289"],
];

const sec1 = [
  H1("1 Dataset and Shared Methodology"),
  H2("1.1 Dataset description"),
  P("The dataset is the CWC manual chemical water-quality record for Kerala (file `swq_manual_chemical_parameters_cwc_kl_1961_2020`) from the National Water Data Portal [3]. It contains 5,433 samples from 21 monitoring stations on 13 rivers, collected roughly monthly between June 1980 and December 2020; although the file name refers to 1961, the first sample is from 1980. Each record has 52 columns: 19 describe the location and sampling time (station, district, river, basin, latitude, longitude and acquisition time, among others) and 33 hold chemical parameters. Dates are stored day-first; 90% of the samples fall in 1986–2017 and only 30 are from 2018–2020. Sampling was manual and at irregular intervals, with uneven coverage across stations (Table 2)."),
  P("Of the 33 chemical columns, 27 contain data and six are entirely empty: fluoride, boron, potassium, manganese, magnesium hardness and nitrate (as NO_{3}^{−}). Biochemical oxygen demand (BOD), chemical oxygen demand (COD) and conductivity are not present in the file. Units follow the column labels of the file, except for the trace-metal columns, whose units are discussed in Section 2.2."),
  tabCaption(2, "Sampling locations (all 21 stations)."),
  table(["Station", "River", "District", "Latitude (°N)", "Longitude (°E)", "Years sampled", "Samples"],
    stations, [1500, 1500, 1750, 1050, 1100, 1150, 850], { size: 17 }),
  new Paragraph({ spacing: { after: 120 }, children: [] }),

  H2("1.2 Season definitions"),
  P("Seasons follow the Kerala calendar. Q1 uses three seasons: pre-monsoon (March–May, 1,094 samples), southwest monsoon (June–September, 1,874 samples) and post-monsoon (October–February, 2,465 samples); its seasonal tests compare the first two. The shared cleaned dataset carries a two-level *Season* variable, Monsoon (June–September, 1,874 samples) and Non-monsoon (all other months, 3,559 samples), which combines the pre- and post-monsoon samples."),

  H2("1.3 Shared data preparation and train/test split"),
  P("A shared cleaned dataset and a common train/test split were prepared so that all group members work from identical data. The preparation steps were as follows; the resulting files are summarised in Table 3."),
  ...numbered([
    "**Removal of non-informative columns.** An auto-generated database identifier column (`_id`) present in the exported file was removed.",
    "**Removal of near-empty parameters.** Parameters with more than 80% missing values were excluded (19 of 33; see Section 3). Imputing these would mostly generate artificial values rather than recover real measurements.",
    "**Date parsing.** The acquisition time, stored as day-month-year text, was converted to a date, from which year, month and season (Section 1.2) were derived. All dates parsed successfully.",
    "**Train/test split.** Total hardness was selected as the common response variable for the predictive models. The 117 samples with no recorded hardness were removed, as a model cannot be trained or evaluated on rows without a target value, and the target was never imputed. The remaining 5,316 samples were split randomly into training (80%, 4,252 samples) and test (20%, 1,064 samples) sets with a fixed random seed (`random_state = 42`).",
    "**Leakage prevention.** Missing predictor values are imputed with statistics learned from the training set only, and the same values are applied to the test set. The same principle is applied to feature scaling.",
  ]),
  tabCaption(3, "Datasets used in this report."),
  table(["File", "Description", "Rows", "Columns", "Used for"], [
    ["`Original_CWC_dataset.csv`", { text: "Exported CWC file, all 33 chemical parameters", align: "left" }, "5,433", "52", "Q1"],
    ["`cleaned_full.csv`", { text: "All samples, cleaned, not imputed (14 parameters)", align: "left" }, "5,433", "37", "Q2, Q3"],
    ["`train.csv`", { text: "80% of samples with observed hardness", align: "left" }, "4,252", "37", "Q4–Q8"],
    ["`test.csv`", { text: "20% of samples with observed hardness", align: "left" }, "1,064", "37", "Q4–Q8"],
  ], [2400, 3500, 800, 900, 1000], { size: 18 }),
  tableNote("Q1 summarises 26 parameters, including the trace metals, iron, ammonia and nitrogen species that are excluded from the cleaned file, so it works from the 5,433 rows of the exported file; it also removes one physically implausible dissolved-oxygen reading (Section 2.2)."),
  P("The leakage-safe imputation helper used by the predictive models is reproduced below. The imputer is fitted on the training data, so the fill values never depend on the test data.", { keepNext: true }),
  ...codeBlock([
    "def impute_train_test(X_train, X_test, strategy=\"median\"):",
    "    imp = SimpleImputer(strategy=strategy)",
    "    X_train_i = pd.DataFrame(imp.fit_transform(X_train),",
    "                             columns=X_train.columns, index=X_train.index)",
    "    X_test_i = pd.DataFrame(imp.transform(X_test),",
    "                            columns=X_test.columns, index=X_test.index)",
    "    return X_train_i, X_test_i",
  ]),

  H2("1.4 Common modelling set-up for Q4–Q8"),
  P("**Response.** Total hardness (mg CaCO_{3}/L) is the response for all predictive models, so that Q5, Q7 and Q8 use the same response, as the brief requires. Training hardness is right-skewed (mean 36.61, median 22.10, SD 38.01 mg CaCO_{3}/L; skewness 3.28), so its upper tail has a strong effect on squared-error measures."),
  P("**Predictors.** Nine predictors are used: carbonate, chloride, dissolved oxygen (DO), total dissolved solids (TDS), bicarbonate, sodium, pH, sulphate and total phosphorus. Calcium and magnesium are excluded because hardness is calculated from them; total alkalinity and the sodium adsorption ratio (SAR) are excluded as derived or closely related measurements."),
  P("**Imputation and scaling.** Predictor blanks are filled with training-set medians (Section 4 explains the choice of the median). For Ridge, Lasso and PCA, predictors are standardised with the training mean and standard deviation, and the same fitted values are applied to the test rows:", { keepNext: true }),
  equation(1, [sub("z", "ij"), m(" = "), frac([sub("x", "ij"), m(" − "), sub("x̄", "j,train")], [sub("s", "j,train")])]),
  P("The simple regression of Q4 uses TDS in its original units. The tree-based models of Q7 and Q8 use unscaled predictors, because threshold-based splits do not require a common scale."),
  P("**Evaluation.** All models are fitted on the training set and evaluated on the same 1,064 held-out test samples using the mean squared error (MSE), its square root (RMSE) and the coefficient of determination:", { keepNext: true }),
  equation(2, [m("MSE = "), frac([m("1")], [m("n")]), ...sum([sup([m("("), sub("y", "i"), m(" − "), sub("ŷ", "i"), m(")")], "2")], "i=1", "n"), m(",     RMSE = "), sqrt([m("MSE")])]),
  equation(3, [sup("R", "2"), m(" = 1 − "), frac([m("RSS")], [m("TSS")]), m(" = 1 − "), frac([...sum([sup([m("("), sub("y", "i"), m(" − "), sub("ŷ", "i"), m(")")], "2")])], [...sum([sup([m("("), sub("y", "i"), m(" − "), m("ȳ"), m(")")], "2")])])]),
  P("**Limitation of the split.** The split is random by row, so samples from the same stations and periods can appear in both the training and test sets. Test scores therefore measure performance on a random held-out sample of the pooled data, not prediction at an unseen station or for a future period. This caveat applies to every model in Sections 5–9."),
];

// =========================================================== 2 Q1
const descRows = [
  ["pH", "—", "5,212", "7.12", "7.12", "0.490", "4.32", "10.0", "BIS 6.5–8.5", "8.4%"],
  ["DO", "mg/L", "3,692", "7.04", "7.10", "0.959", "2.00", "13.1", "CPCB Class A ≥ 6", "10.3%"],
  ["TDS", "mg/L", "1,898", "56.6", "38.0", "57.3", "10.0", "530", "BIS 500", "0.1%"],
  ["Chloride", "mg/L", "5,305", "12.9", "11.0", "7.04", "1.44", "97.6", "BIS 250", "0.0%"],
  ["Sulphate", "mg/L", "4,066", "2.57", "1.00", "4.52", "0.000", "72.0", "BIS 200", "0.0%"],
  ["Total hardness", "mg/L as CaCO_{3}", "5,316", "36.2", "22.1", "37.2", "3.00", "405", "BIS 200", "0.4%"],
  ["Total alkalinity", "mg/L as CaCO_{3}", "4,950", "28.8", "17.0", "32.4", "0.840", "283", "BIS 200", "0.4%"],
  ["Calcium", "mg/L", "5,317", "7.48", "4.80", "7.42", "0.040", "62.4", "BIS 75", "0.0%"],
  ["Magnesium", "mg/L", "5,317", "4.22", "2.43", "5.62", "0.000", "83.0", "BIS 30", "0.6%"],
  ["Sodium", "mg/L", "4,879", "6.03", "4.00", "5.73", "1.00", "54.1", "none", "—"],
  ["Bicarbonate", "mg/L", "5,187", "26.6", "16.0", "30.1", "1.02", "282", "none", "—"],
  ["Carbonate", "mg/L", "4,841", "0.716", "0.000", "2.54", "0.000", "48.0", "none", "—"],
  ["Nitrate-N", "mg N/L", "920", "0.756", "0.348", "1.19", "0.000", "14.0", "BIS 45 mg/L as NO_{3}^{−} (10.2 mg N/L)", "0.4%"],
  ["Nitrite+nitrate-N", "mg N/L", "958", "0.765", "0.380", "1.18", "0.000", "14.0", "none", "—"],
  ["Ammonia-N", "mg N/L", "455", "0.117", "0.072", "0.118", "0.000", "0.731", "BIS 0.5", "1.5%"],
  ["Total phosphorus", "mg P/L", "2,801", "0.107", "0.066", "0.734", "0.000", "37.0", "none", "—"],
  ["Iron", "mg/L", "618", "0.202", "0.070", "0.881", "0.000", "20.0", "BIS 0.3", "11.8%"],
  ["SAR", "—", "4,815", "0.444", "0.385", "0.249", "0.000", "3.27", "none", "—"],
  ["Arsenic†", "µg/L*", "215", "3.15", "2.07", "3.32", "0.000", "14.8", "BIS 10 µg/L", "6.5%"],
  ["Cadmium†", "µg/L*", "239", "1.32", "0.090", "3.81", "0.000", "21.0", "BIS 3 µg/L", "10.0%"],
  ["Chromium", "µg/L*", "255", "2.68", "1.13", "7.97", "0.003", "114", "BIS 50 µg/L", "0.4%"],
  ["Copper", "µg/L*", "260", "5.53", "2.72", "11.4", "0.000", "131", "BIS 50 µg/L", "1.2%"],
  ["Lead", "µg/L*", "258", "2.74", "1.62", "4.12", "0.000", "41.5", "BIS 10 µg/L", "4.7%"],
  ["Mercury", "µg/L*", "46", "0.110", "0.040", "0.134", "0.000", "0.530", "BIS 1 µg/L", "0.0%"],
  ["Nickel", "µg/L*", "230", "4.22", "2.93", "4.68", "0.000", "51.2", "BIS 20 µg/L", "0.9%"],
  ["Zinc", "µg/L*", "251", "36.7", "9.50", "319", "0.000", "5,061", "BIS 5000 µg/L", "0.4%"],
];

const p10 = (a, e) => `${a} × 10^{−${e}}`;
const seasonRows = [
  ["DO (mg/L)", "669, 6.78 ± 1.00", "1,287, 7.15 ± 0.88", "−0.37", "−0.46 to −0.28", "−7.98", p10("1.5", 15), "Reject H_{0}"],
  ["pH", "959, 7.21 ± 0.45", "1,821, 7.02 ± 0.49", "+0.19", "0.15 to 0.22", "10.18", p10("2.3", 24), "Reject H_{0}"],
  ["TDS (mg/L)", "303, 69.3 ± 64.6", "644, 49.5 ± 48.7", "+19.8", "11.6 to 28.0", "4.73", p10("2.2", 6), "Reject H_{0}"],
  ["Chloride (mg/L)", "977, 14.5 ± 8.2", "1,870, 12.1 ± 6.4", "+2.47", "1.88 to 3.06", "8.18", p10("2.9", 16), "Reject H_{0}"],
  ["Total hardness (mg/L as CaCO_{3})", "980, 40.5 ± 42.5", "1,873, 32.8 ± 34.4", "+7.67", "4.59 to 10.76", "4.88", p10("1.1", 6), "Reject H_{0}"],
  ["Nitrate-N (mg N/L)", "127, 0.737 ± 0.986", "330, 0.599 ± 0.715", "+0.138", "−0.050 to 0.326", "1.44", "0.150", "Do not reject H_{0}"],
];
const spatialRows = [
  ["pH", "341, 7.10 ± 0.47", "315, 7.04 ± 0.47", "+0.056", "−0.016 to 0.128", "1.52", "0.128", "Do not reject H_{0}"],
  ["DO (mg/L)", "218, 7.47 ± 0.80", "197, 7.33 ± 0.80", "+0.143", "−0.012 to 0.297", "1.81", "0.071", "Do not reject H_{0}"],
  ["TDS (mg/L)", "149, 33.2 ± 10.6", "134, 33.7 ± 9.4", "−0.51", "−2.84 to 1.82", "−0.43", "0.667", "Do not reject H_{0}"],
  ["Chloride (mg/L)", "350, 9.76 ± 4.23", "324, 11.61 ± 5.81", "−1.85", "−2.62 to −1.07", "−4.68", p10("2.9", 6), "Reject H_{0}"],
  ["Sulphate (mg/L)", "218, 1.22 ± 0.73", "208, 1.30 ± 0.93", "−0.077", "−0.237 to 0.083", "−0.94", "0.345", "Do not reject H_{0}"],
  ["Total hardness (mg/L as CaCO_{3})", "350, 22.1 ± 16.1", "324, 23.1 ± 13.4", "−1.03", "−3.26 to 1.21", "−0.90", "0.368", "Do not reject H_{0}"],
  ["Total phosphorus (mg P/L)", "162, 0.0775 ± 0.0738", "144, 0.0756 ± 0.0757", "+0.0018", "−0.0150 to 0.0186", "0.21", "0.832", "Do not reject H_{0}"],
];
const zW = [1750, 1500, 1500, 850, 1300, 650, 1050, 1150];

const sec2 = [
  H1("2 Q1. Statistical Analysis of Water-Quality Patterns"),
  P("Kerala’s river water is soft, low in dissolved solids and mostly within the Bureau of Indian Standards (BIS) limits (median TDS 38 mg/L). The main concerns are low dissolved oxygen (10.3% of samples below 6 mg/L), acidic pH (8.2% below 6.5), iron (11.8% above 0.3 mg/L, mostly from 2010–2012) and, tentatively, lead (4.7% above 10 µg/L, assuming the metal columns are in µg/L). Arsenic and cadmium exceedances cluster in single years and are left unresolved. Pre-monsoon and monsoon water differ significantly (p < 0.001) for DO, pH, TDS, chloride and hardness, while the two Periyar stations compared differ significantly only in chloride."),

  H2("2.1 Q1(a) Available water-quality parameters"),
  P("Twenty-seven of the 33 chemical columns hold data and 26 of them are summarised here; calcium hardness, with only 60 values, duplicates total hardness and is left out. The summarised parameters are pH, DO, TDS, chloride, sulphate, total hardness, total alkalinity, calcium, magnesium, sodium, bicarbonate, carbonate, nitrate-N, nitrite+nitrate-N, ammonia-N, total phosphorus, iron, SAR and eight trace metals (arsenic, cadmium, chromium, copper, lead, mercury, nickel and zinc). Because BOD, COD and conductivity are not in the file, DO, pH, TDS, hardness and the major ions stand in for them: organic pollution is judged from DO alone and ionic strength from TDS. Coverage is uneven: TDS has only 1,898 values, nitrate-N 920, and the metals 46–260 each (Section 3 analyses missingness in detail)."),

  H2("2.2 Q1(a) Descriptive statistics and comparison with standards"),
  P("Table 4 gives the descriptive statistics of all 26 parameters and compares each with the applicable limit. Limits are the BIS IS 10500:2012 acceptable limits for drinking water [1] and the Central Pollution Control Board (CPCB) Class A criteria [2] (drinking-water source without conventional treatment but after disinfection: pH 6.5–8.5, DO ≥ 6 mg/L, BOD ≤ 2 mg/L; only pH and DO apply here). BIS also sets higher permissible limits where no alternative source exists (TDS 2,000; chloride 1,000; sulphate 400; hardness 600; alkalinity 600; calcium 200; magnesium 100; copper 1.5 and zinc 15 mg/L; arsenic 0.05 mg/L), so the exceedance rates shown are conservative (Figure 1). BIS 10500 is a drinking-water standard applied here to raw river water as a screening comparison, not a verdict on whether the water is safe to drink. Nitrate is converted from 45 mg/L as NO_{3}^{−} to 10.2 mg/L as N. Sodium, bicarbonate, carbonate, nitrite+nitrate, phosphorus and SAR have no limit that applies here, so they are described only."),
  tabCaption(4, "Descriptive statistics and comparison with the applicable standards."),
  table(["Parameter", "Unit", "N", "Mean", "Median", "SD", "Min", "Max", "Standard used", "% outside"], descRows,
    [1350, 1150, 650, 650, 700, 650, 650, 650, 1700, 750], { size: 15 }),
  tableNote("* The file labels the metal columns mg/L, but the values (arsenic median 2.07, zinc up to 5,061) are only plausible as µg/L, so they are compared with BIS limits in µg/L. If the label were correct, arsenic would be about 200 times the BIS limit of 0.01 mg/L, whereas read as µg/L every median sits well below its limit. This is an assumption; the original CWC unit was not independently confirmed, so the metal findings are stated conditionally. Zeros in the metal columns (mercury 33%, cadmium 9%, nickel 3.5%) are probably non-detects and pull the means down, so the medians are the better summary for the metals. One DO reading of 27 mg/L (physically implausible) was removed. † Arsenic and cadmium exceedances come from single years and are not read as river concerns (Section 2.3)."),
  ...figure("fig01_q1_exceedances.png", 4.9, 1, "Share of samples outside the applicable standard, by parameter."),

  H2("2.3 Q1(a) Parameters indicating potential concern"),
  P("Most parameters sit far inside the limits. Four need attention: DO (10.3% of samples below 6 mg/L), pH (8.4% outside 6.5–8.5, nearly all acidic), iron (11.8% above 0.3 mg/L) and, among the trace metals, lead."),
  bullet("**Dissolved oxygen.** DO below 6 mg/L signals organic loading or warm, slow water that cannot support sensitive fish. The mean fell from 7.21 mg/L in the 1990s to 6.94 in the 2000s and 6.77 in the 2010s. A two-sample z-test (Equation 4) of the 1990s (n = 1,860, mean 7.21 mg/L) against the 2010s (n = 791, mean 6.77 mg/L) gives a difference of 0.44 mg/L (95% CI 0.34 to 0.53), z = 9.14, p < 0.001, so H_{0} (equal mean DO) is rejected. The result holds when only the 18 stations sampled in both decades are used (difference 0.42 mg/L, z = 8.56). Seasonal mix does not explain it: the pre-monsoon share of DO samples was higher in the 1990s (22%) than in the 2010s (15%), which would push the 1990s mean down, not up. The lowest station medians are Mankara (6.38), Vandiperiyar (6.40) and Pudur (6.48)."),
  bullet("**Acidic pH.** 427 of 5,212 readings (8.2%) are below 6.5 and only 9 are above 8.5; the 8.4% in Table 4 counts both sides (436 readings). Median alkalinity is just 17 mg/L as CaCO_{3}, so these rivers buffer poorly and acid inputs (laterite soils, organic acids, acid rain, effluent) move pH easily; acidic water also keeps iron and metals dissolved."),
  bullet("**Iron.** 11.8% of samples exceed 0.3 mg/L (maximum 20 mg/L), but iron was measured only in 2007–2018, and 63 of the 73 exceedances fall in 2010–2012 (19.6% of 321 samples in those years, against 0.5% of 188 from 2013 on). Exceedances occur at all 21 stations, so iron remains a concern, but the 11.8% depends on the period sampled and the file does not show why it dropped after 2012. Iron-rich laterite is a natural source, but values this high affect taste, staining and treatment cost."),
  bullet("**Trace metals.** Metal data cover only 2005–2019 (215–260 samples each), and the exceedances cluster in single years, so they are screened by year before being read as river signals. *Arsenic:* 14 of 215 samples exceed 10 µg/L, 11 of them in 2012 (11 of that year’s 69 samples, at 11 different stations), 2 in 2006 and 1 in 2009, with none in any other year; that year’s median is only 0.32 µg/L, so these are isolated highs rather than a uniform shift. The cause is unresolved and should be verified against CWC records; it is not interpreted as a river concern here. *Cadmium:* 24 of 239 samples exceed 3 µg/L, 23 of them in 2005–2006 (15 of 15 samples in 2005, 8 of 12 in 2006) and only 1 of 212 from 2007 on. A break like that is more typical of a change in analytical method or detection limit than of river chemistry, so cadmium is also not counted as a concern. *Lead:* 12 of 258 samples exceed 10 µg/L, spread over 2012–2017 (4, 1, 0, 3, 3 and 1 by year), but 4 of the 12 fall in 2012, the arsenic year. Lead is therefore a tentative concern at most: only 4.7% of samples exceed the limit and its median (1.62 µg/L) is well below it."),
  bullet("**Salts, nitrogen and phosphorus.** TDS, chloride, sulphate and hardness meet the limits almost everywhere (one TDS reading above 500 mg/L). Nitrate (median 0.35 mg N/L) and ammonia are low. Total phosphorus has no applicable standard and its mean (0.107) is inflated by a few extreme values (maximum 37 mg P/L), so its median (0.066) is the safer summary."),
  bullet("**Station contrast.** Three of the four Bharathapuzha stations (Mankara, Pudur and Kumbidi) have median TDS of 181, 265 and 83 mg/L, against 22–55 mg/L at every other station, so mineral load, not toxicity, separates the state’s rivers (Figure 2)."),
  ...figure("fig02_q1_station_medians.png", 5.6, 2, "Median chloride and DO by station; the dashed line marks the CPCB Class A DO criterion of 6 mg/L."),

  H2("2.4 Q1(b) Seasonal variation"),
  P("Pre-monsoon (March–May) water has lower DO and higher pH, TDS, chloride and hardness than monsoon (June–September) water; all five differences are significant at α = 0.05 (p < 0.001), while nitrate-N shows no significant difference (p = 0.150)."),
  P("**Hypotheses** (each parameter, two-tailed). H_{0}: μ_{pre} − μ_{mon} = 0 (the mean is the same in both seasons); H_{a}: μ_{pre} − μ_{mon} ≠ 0."),
  P("**Test statistic and p-value.** The large-sample two-sample z-test for the difference of two means is used, with a 95% confidence interval for the difference:", { keepNext: true }),
  equation(4, [m("z = "), frac([sub("x̄", "1"), m(" − "), sub("x̄", "2")], [sqrt([frac([subsup("s", "1", "2")], [sub("n", "1")]), m(" + "), frac([subsup("s", "2", "2")], [sub("n", "2")])])])]),
  equation(5, [m("95% CI = ("), sub("x̄", "1"), m(" − "), sub("x̄", "2"), m(") ± 1.96 "), sqrt([frac([subsup("s", "1", "2")], [sub("n", "1")]), m(" + "), frac([subsup("s", "2", "2")], [sub("n", "2")])])]),
  P("The p-value is the two-tailed probability 2·P(Z > |z|) from the standard normal distribution. The large-sample test applies because every group has n ≥ 30 (the smallest has 127), so the sampling distribution of the sample means is approximately normal even though the data are skewed. **Rejection region:** at α = 0.05, reject H_{0} if z > 1.96 or z < −1.96 (equivalently, if p < 0.05)."),
  tabCaption(5, "Pre-monsoon vs monsoon two-sample z-tests (difference = pre-monsoon minus monsoon; decisions at α = 0.05)."),
  table(["Parameter", "Pre-monsoon: n, mean ± SD", "Monsoon: n, mean ± SD", "Difference", "95% CI of difference", "z", "p-value", "Decision"],
    seasonRows, zW, { size: 15 }),
  new Paragraph({ spacing: { after: 60 }, children: [] }),
  ...figure("fig03_q1_season_boxplots.png", 6.2, 3, "Pre-monsoon vs monsoon distributions of DO, pH, TDS and chloride (all stations; outliers hidden)."),
  ...figure("fig04_q1_monthly_means.png", 6.0, 4, "Monthly mean DO and TDS with 95% confidence intervals."),
  P("**Conclusion.** For DO, pH, TDS, chloride and hardness, |z| is far above 1.96 and p < 0.01 (highly significant), so H_{0} is rejected: the seasonal means differ, and each 95% confidence interval for the difference excludes 0 (Table 5, Figure 3). For nitrate-N, |z| = 1.44 is below 1.96 and p = 0.150 is above 0.10, so H_{0} is not rejected; the data do not show a seasonal difference, although with 127 and 330 samples and a large spread a small real difference could go undetected."),
  P("The pattern is consistent with dilution by monsoon runoff, but the file has no flow or temperature data to test that. Mean TDS is about 29% lower in the monsoon than before it (49.5 vs 69.3 mg/L; put the other way, pre-monsoon is about 40% higher). Lower monsoon pH could reflect acidic soil and rain water, and lower pre-monsoon DO is consistent with warmer, slower water holding less oxygen; neither mechanism is tested here. Mean pre-monsoon DO of 6.78 mg/L is close to the 6 mg/L criterion. The differences are also modest relative to the spread of the data (the DO difference of 0.37 mg/L is less than half the standard deviation), so “significant” here means reliably different, not large."),
  P("**Post-monsoon (October–February), descriptive only.** Mean DO is 7.05 mg/L, pH 7.17, TDS 57.4 mg/L, chloride 12.9 mg/L and hardness 37.0 mg/L, mostly between the pre-monsoon and monsoon values; these were not tested. Nitrate-N is highest after the monsoon (0.87 mg N/L, against 0.74 pre-monsoon and 0.60 monsoon). Monthly mean DO also dips in October (6.83 mg/L, against 7.41 in September and 7.34 in November; Figure 4); the file cannot explain this."),
  P("**Assumption.** The z-test assumes independent random samples. Repeated sampling at the same stations over 37 years is not strictly independent, so the p-values are approximate; the differences are, however, large relative to their standard errors (|z| ≥ 4.7 for the five significant parameters)."),

  H2("2.5 Q1(c) Spatial variation"),
  P("Neeleeswaram and Arangali, both on the Periyar, are statistically alike in pH, DO, TDS, sulphate, hardness and phosphorus (p > 0.05); they differ significantly only in chloride (9.76 vs 11.61 mg/L, z = −4.68, p = 2.9 × 10^{−6})."),
  P("**Choice of stations.** Both stations are on the same river, have the largest comparable samples (357 and 327 rows) and were sampled over the same years (1980–2017), so river and period are held constant. By the station coordinates, Arangali lies about 22 km from Neeleeswaram (19 km west, 11 km north), nearer the coast."),
  P("**Hypotheses** (each parameter, two-tailed). H_{0}: μ_{N} − μ_{A} = 0 (equal means at Neeleeswaram and Arangali); H_{a}: μ_{N} − μ_{A} ≠ 0. **Test and rejection region:** the same large-sample two-sample z-test as in Section 2.4 (Equations 4 and 5). Every group has n ≥ 134, so the large-sample test applies. At α = 0.05, reject H_{0} if |z| > 1.96."),
  tabCaption(6, "Neeleeswaram vs Arangali (Periyar) two-sample z-tests (difference = Neeleeswaram minus Arangali; decisions at α = 0.05)."),
  table(["Parameter", "Neeleeswaram: n, mean ± SD", "Arangali: n, mean ± SD", "Difference (N − A)", "95% CI of difference", "z", "p-value", "Decision"],
    spatialRows, zW, { size: 15 }),
  new Paragraph({ spacing: { after: 60 }, children: [] }),
  ...figure("fig05_q1_periyar_stations.png", 6.2, 5, "Neeleeswaram vs Arangali (Periyar): DO, pH, TDS and chloride (outliers hidden)."),
  P("**Conclusion.** For chloride (Table 6, Figure 5), |z| = 4.68 is above 1.96 and p < 0.01 (highly significant), so H_{0} is rejected: mean chloride is about 19% higher at Arangali, and the 95% confidence interval puts the difference at 1.07 to 2.62 mg/L. For pH, TDS, sulphate, hardness and phosphorus, p is above 0.10, so H_{0} is not rejected. DO (p = 0.071, between 0.05 and 0.10) tends towards significance but is not rejected at α = 0.05; Neeleeswaram is slightly higher."),
  P("**Discussion.** The data cannot say why chloride is higher at Arangali. Its position nearer the coast is consistent with tidal or saline influence at low flow, and the lower reach may also receive more urban or industrial runoff; chloride alone cannot separate these, and no salinity, conductivity or flow data are in the file. Both stations are far below the BIS limit of 250 mg/L, so the difference is not a compliance problem. Station medians across the state vary far more than this pair does (median TDS from 22 to 265 mg/L), so the Periyar pair is unusually similar rather than typical; the larger contrasts are the high-mineral Bharathapuzha stations shown in Section 2.3."),

  H2("2.6 Q1 limitations"),
  bullet("**Missing parameters.** The file has no BOD, COD, conductivity or fluoride, so organic pollution is judged from DO alone and ionic strength from TDS."),
  bullet("**Metal units.** The metal values are treated as µg/L although the file labels them mg/L (note to Table 4); the metal findings are therefore conditional."),
  bullet("**Outliers.** Extremes such as zinc 5,061 µg/L, phosphorus 37 mg P/L and iron 20 mg/L are kept in the statistics (only the DO value of 27 mg/L was removed), so the means of those parameters are less reliable than the medians."),
  bullet("**Sampling.** Samples come from manual monitoring at irregular intervals, with uneven station coverage and very few records after 2017. Repeated measures at one station are not independent, which the z-tests assume, so the p-values are approximate."),
];

// =========================================================== 3 Q2
const missRows = [
  ["1", "Calcium (mg/L)", "116", "2.1", "Low"], ["2", "Magnesium (mg/L)", "116", "2.1", "Low"],
  ["3", "Total Hardness (mgCaCO3/L)", "117", "2.2", "Low"], ["4", "Chloride (mg/L)", "128", "2.4", "Low"],
  ["5", "Potential of Hydrogen (pH)", "221", "4.1", "Low"], ["6", "Bicarbonate (mg/L)", "246", "4.5", "Low"],
  ["7", "Total Alkalinity (mg/L as CaCO3)", "483", "8.9", "Low"], ["8", "Sodium (mg/L)", "554", "10.2", "Moderate"],
  ["9", "Carbonate (mg/L)", "592", "10.9", "Moderate"], ["10", "Sodium Adsorption Ratio (%)", "618", "11.4", "Moderate"],
  ["11", "Sulphate (mg/L)", "1,367", "25.2", "Moderate"], ["12", "Dissolved oxygen (mg/L)", "1,740", "32.0", "Moderate"],
  ["13", "Total Phosphorus (mgP/L)", "2,632", "48.4", "Moderate"], ["14", "Total Dissolved Solids (mg/L)", "3,535", "65.1", "High"],
  ["15", "Nitrite N+Nitrate N (mgN/L)", "4,475", "82.4", "Dropped"], ["16", "Nitrate N (mgN/L)", "4,513", "83.1", "Dropped"],
  ["17", "Iron (mg/L)", "4,815", "88.6", "Dropped"], ["18", "Amonia N (mgN/L)", "4,978", "91.6", "Dropped"],
  ["19", "Copper (mg/L)", "5,173", "95.2", "Dropped"], ["20", "Chromium (mg/L)", "5,178", "95.3", "Dropped"],
  ["21", "Lead (mg/L)", "5,175", "95.3", "Dropped"], ["22", "Zinc (mg/L)", "5,182", "95.4", "Dropped"],
  ["23", "Cadmium (mg/L)", "5,194", "95.6", "Dropped"], ["24", "Nickel (mg/L)", "5,203", "95.8", "Dropped"],
  ["25", "Arsenic (mg/L)", "5,218", "96.0", "Dropped"], ["26", "Hardness Calcium (mgCaCO3/L)", "5,373", "98.9", "Dropped"],
  ["27", "Mercury (mg/L)", "5,387", "99.2", "Dropped"], ["28", "Boron (mg/L)", "5,433", "100.0", "Dropped"],
  ["29", "Potassium (mg/L)", "5,433", "100.0", "Dropped"], ["30", "Hardness Magnesium (mg/L as CaCO3)", "5,433", "100.0", "Dropped"],
  ["31", "Manganese (mg/L)", "5,433", "100.0", "Dropped"], ["32", "Fluoride (mg/L)", "5,433", "100.0", "Dropped"],
  ["33", "Nitrate (mg/L)", "5,433", "100.0", "Dropped"],
];

const sec3 = [
  H1("3 Q2. Missing Data Analysis"),
  P("**Objective.** Identify missing values in the dataset, report the number and percentage missing in each column, identify parameters with substantial missingness, and discuss how missing observations may affect water-quality assessment and predictive modelling."),
  P("**Approach.** Missing values were counted for each of the 33 chemical parameters in the full dataset of 5,433 samples. Each parameter was classified as Low (< 10% missing), Moderate (10–50%), High (50–80%) or Dropped (> 80%). Missingness was also computed by decade to check whether gaps occur at random or follow a pattern."),
  H2("3.1 Results"),
  tabCaption(7, "Missing values per chemical parameter (n = 5,433). Parameter names and units are as labelled in the source file."),
  table(["No.", "Parameter", "Missing count", "Missing (%)", "Level"], missRows, [600, 4200, 1500, 1300, 1400], { size: 16 }),
  new Paragraph({ spacing: { after: 60 }, children: [] }),
  ...figure("fig06_q2_missing_per_parameter.png", 3.6, 6, "Percentage of missing values per parameter. The dashed line marks the 80% exclusion threshold."),
  ...figure("fig07_q2_missing_by_decade.png", 5.0, 7, "Percentage of missing values by decade for the 14 retained parameters. The 2020 column contains only 4 samples and is not interpreted."),
  H2("3.2 Discussion"),
  P("**Parameters with substantial missingness.** Of the 33 chemical parameters, 19 have more than 80% missing values and were excluded (Table 7, Figure 6). These include all heavy metals (arsenic, cadmium, chromium, copper, lead, mercury, nickel and zinc), along with ammonia, iron and both nitrate species. Boron, fluoride, manganese, potassium, nitrate and magnesium hardness contain no recorded values at all. Among the 14 retained parameters, TDS (65.1%), total phosphorus (48.4%), DO (32.0%) and sulphate (25.2%) show substantial missingness, while the major ions (calcium, magnesium, chloride) and total hardness are nearly complete at about 2%."),
  P("**Pattern of missingness.** The gaps are not random. Figure 7 shows that they follow changes in the monitoring programme over time: DO was not recorded at all during the 1980s, TDS was not recorded during the 1990s, and total phosphorus was largely discontinued after 2010 (99% missing). Missingness also varies between stations, ranging from 15% to 57% for DO. The data are therefore better described as missing at random (MAR), where missingness depends on observed variables such as sampling period and station, than as missing completely at random (MCAR) [4]."),
  P("**Implications for water-quality assessment.** Statistics computed from incomplete parameters describe only the decades and stations where the parameter was measured. A mean DO value, for example, excludes the entire 1980s, and a mean TDS value excludes the 1990s. Comparisons with standards and long-term trend analyses can therefore be biased, and differences between periods may reflect changes in sampling rather than in water quality. The loss of observations also reduces the statistical power of the hypothesis tests in Q1. The near-complete absence of heavy-metal data means that toxic contamination cannot be assessed reliably from this dataset; the screening of trace metals in Section 2.3 rests on only 46–260 samples per metal."),
  P("**Implications for predictive modelling.** Most regression models cannot handle missing inputs. Removing every incomplete row would discard a large share of the data, especially if DO, phosphorus or TDS are used as predictors. Imputation retains the rows but introduces artificial values that reduce variance and weaken relationships between parameters (Section 4). Because missingness depends on time, simple column-wide imputation may also blur genuine temporal trends."),
];

// =========================================================== 4 Q3
const impRows = [];
const impData = [
  ["Sulphate", "25.2", [["Original", "4,066", "2.568", "1.000", "20.396", "100.0", "6.91"], ["Mean", "5,433", "2.568", "1.800", "15.263", "74.8", "7.98"], ["Median", "5,433", "2.174", "1.000", "15.726", "77.1", "7.92"], ["Mode", "5,433", "2.174", "1.000", "15.726", "77.1", "7.92"]]],
  ["Dissolved oxygen", "32.0", [["Original", "3,693", "7.043", "7.100", "1.028", "100.0", "1.41"], ["Mean", "5,433", "7.043", "7.043", "0.699", "68.0", "1.71"], ["Median", "5,433", "7.061", "7.100", "0.699", "68.0", "1.64"], ["Mode", "5,433", "6.965", "6.800", "0.711", "69.2", "1.94"]]],
  ["Total phosphorus", "48.4", [["Original", "2,801", "0.1074", "0.0660", "0.5391", "100.0", "46.51"], ["Mean", "5,433", "0.1074", "0.1074", "0.2779", "51.5", "64.76"], ["Median", "5,433", "0.0873", "0.0660", "0.2783", "51.6", "64.72"], ["Mode", "5,433", "0.0602", "0.0100", "0.2803", "52.0", "64.21"]]],
  ["Total dissolved solids", "65.1", [["Original", "1,898", "56.64", "38.00", "3283.81", "100.0", "3.43"], ["Mean", "5,433", "56.64", "56.64", "1146.79", "34.9", "5.79"], ["Median", "5,433", "44.51", "38.00", "1225.78", "37.3", "6.23"], ["Mode", "5,433", "40.61", "32.00", "1284.82", "39.1", "6.11"]]],
];
impData.forEach(([name, pct, rows], gi) => rows.forEach((r, i) => {
  const lastInGroup = i === 3;
  // label only on the group's first row (no merged cells, so Word can keep the table on one page)
  const cells = r.map((t) => ({ text: t, noLine: !lastInGroup }));
  const label = i === 0 ? { text: `${name} (${pct}% missing)`, align: "left", noLine: true }
    : { text: "", noLine: !lastInGroup };
  impRows.push([label, ...cells]);
}));

const sec4 = [
  H1("4 Q3. Imputation of Missing Data"),
  P("**Objective.** Apply mean, median and mode imputation to variables with missing values, compare the original and imputed data in terms of mean, variance and distribution, and discuss the advantages and limitations of each method."),
  P("**Approach.** Four retained parameters spanning a range of missingness were selected: sulphate (25.2%), DO (32.0%), total phosphorus (48.4%) and TDS (65.1%). Parameters above 80% missing were not imputed. Each missing value was replaced by the column mean, median or mode of the observed values. Since the parameters are continuous and nearly every value is unique, the mode was computed after rounding to a precision suited to each parameter: whole numbers for sulphate and TDS, one decimal for DO and two decimals for phosphorus. The resulting mode values were 1 mg/L, 6.8 mg/L, 0.01 mg P/L and 32 mg/L respectively. As Q3 is a descriptive comparison rather than a predictive model, it was performed on the full cleaned dataset (`cleaned_full.csv`); imputation for the predictive models uses the training-only procedure of Section 1.3."),
  H2("4.1 Results"),
  tabCaption(8, "Summary statistics before and after imputation. Variance kept is the imputed variance as a percentage of the original variance."),
  table(["Parameter", "Method", "N", "Mean", "Median", "Variance", "Var. kept (%)", "Skew"], impRows, [2000, 1000, 800, 900, 900, 1100, 1100, 800], { size: 16 }),
  tableNote("The original DO count here (3,693) includes the 27 mg/L reading that Q1 removes, which is why Table 4 reports 3,692 DO values."),
  ...figure("fig08_q3_distributions.png", 5.8, 8, "Distributions before and after imputation (density). The x-axis is limited to the 99th percentile for readability."),
  ...figure("fig09_q3_boxplots.png", 6.2, 9, "Spread before and after imputation (outlier points hidden for readability)."),
  H2("4.2 Discussion"),
  P("**Effect on variance and distribution.** All three methods reduced the variance of every parameter, and the reduction grew with the share of missing values (Table 8). Sulphate retained about 75% of its original variance, while TDS retained only 35–39%. Because every gap is filled with a single value, each method creates a sharp spike in the distribution (Figure 8). The boxplots (Figure 9) show the same effect as a narrower spread. For TDS, median and mode imputation collapse the interquartile range almost to a single line, since 65% of the column now holds one value. Skewness increased for all parameters for the same reason."),
  P("**Effect on central tendency.** Each method preserves only its own summary statistic. Mean imputation left the mean unchanged but shifted the median upward, from 38 to 56.6 mg/L for TDS and from 0.066 to 0.107 mg P/L for total phosphorus. For sulphate it also raised the upper quartile, because the mean (2.57 mg/L) lies above most observed values of this strongly skewed parameter. Median imputation preserved the median but lowered the mean, from 56.6 to 44.5 mg/L for TDS. Mode imputation was the least reliable for continuous data: for total phosphorus it moved the median from 0.066 to 0.01 mg P/L, and its result depends on the chosen rounding. For DO, which is close to symmetric (skew 1.41), the three methods gave nearly identical results, so the choice of method matters mainly for skewed parameters."),
  P("**Advantages and limitations.**", { keepNext: true, after: 60 }),
  bullet("**Mean imputation** is simple and preserves the overall mean, but it is pulled by outliers and long right tails, making it suitable only for roughly symmetric parameters such as DO."),
  bullet("**Median imputation** is robust to skew and outliers and is the most appropriate of the three for this dataset, where most parameters are right-skewed. It was therefore chosen as the default strategy for the predictive models (Section 1.4)."),
  bullet("**Mode imputation** is natural for categorical data, but for continuous measurements it depends on arbitrary rounding and can produce unrepresentative values."),
  bullet("**All three methods** are fast and keep every row available, but they understate variability, weaken correlations between parameters and ignore the station and time structure of the data."),
  P("**Implications for water-quality interpretation.** Because the imputed value is a dataset-wide typical value, imputation can make a station or period appear more average than it was. A missing reading during a pollution event would be replaced by a moderate value, so exceedances of standards could be understated. The reduced variance also gives a false impression of precision in later statistical tests and models. Since missingness in this dataset depends on decade and station (Section 3), methods that account for this structure, such as station-wise median imputation, per-station forward filling or k-nearest-neighbour imputation, would likely give more realistic estimates. Imputed values should therefore be treated as a modelling convenience rather than as measurements, and results that depend heavily on imputed parameters such as TDS should be interpreted with caution.", { before: 60 }),
];

// =========================================================== 5 Q4
const sec5 = [
  H1("5 Q4. Linear Regression Analysis"),
  H2("5.1 Choice of variables"),
  P("The response (Y) is total hardness (mg CaCO_{3}/L), the common response of Section 1.4, and the predictor (X) is TDS (mg/L), selected as an interpretable one-variable predictor. Hardness is a measure of dissolved calcium and magnesium, which are themselves part of the dissolved-solids load, so a positive association with TDS is expected; calcium and magnesium cannot be used as the predictor because hardness is calculated from them. TDS is, however, missing in about 64% of training rows, so median imputation (Section 1.4) affects this model strongly; a complete-case sensitivity fit is reported below."),
  H2("5.2 Model and coefficient estimates"),
  P("The simple linear regression model and its ordinary least-squares estimates are:", { keepNext: true }),
  equation(6, [m("Y = "), sub("β", "0"), m(" + "), sub("β", "1"), m("X + ε")]),
  equation(7, [sub("β̂", "1"), m(" = "), frac([...sum([m("("), sub("x", "i"), m(" − x̄)("), sub("y", "i"), m(" − ȳ)")])], [...sum([sup([m("("), sub("x", "i"), m(" − x̄)")], "2")])]), m(",     "), sub("β̂", "0"), m(" = ȳ − "), sub("β̂", "1"), m("x̄")]),
  equation(8, [m("RSS = "), ...sum([sup([m("("), sub("y", "i"), m(" − "), sub("ŷ", "i"), m(")")], "2")], "i=1", "n")]),
  P("Fitted on the training set, the model is", { keepNext: true }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: L.runs("Hardness = 18.160 + 0.4144 × TDS") }),
  P("so β̂_{0} = 18.160 mg CaCO_{3}/L and β̂_{1} = 0.4144. Table 9 summarises the fit and its held-out test performance, and Figure 10 shows the test observations with the fitted line."),
  tabCaption(9, "Q4 simple linear regression of total hardness on TDS: coefficients (training set) and held-out test performance (n = 1,064)."),
  table(["Quantity", "Value"], [
    ["Intercept β̂_{0} (mg CaCO_{3}/L)", "18.160"], ["Slope β̂_{1} (mg CaCO_{3}/L per mg/L TDS)", "0.4144"],
    ["Approximate 95% CI of slope", "[0.3844, 0.4444]"], ["Training Pearson r", "0.384"],
    ["Test RSS", "941,126.0"], ["Test MSE", "884.52"], ["Test RMSE (mg CaCO_{3}/L)", "29.74"], ["Test MAE (mg CaCO_{3}/L)", "19.49"],
    ["Test R^{2}", "0.212"], ["Test MSE of train-mean baseline", "1126.67"], ["Reduction in test MSE relative to baseline", "21.5%"],
  ], [5500, 3500], { size: 19 }),
  new Paragraph({ spacing: { after: 60 }, children: [] }),
  ...figure("fig10_q4_scatter_fit.png", 5.0, 10, "Held-out test observations of total hardness against TDS, with the line fitted to the training observations."),
  H2("5.3 Residual diagnostics and sensitivity"),
  P("The residual plot (Figure 11) checks whether prediction errors are centred and whether their spread is constant. The held-out mean residual (observed minus predicted) is −2.47 mg CaCO_{3}/L. RMSE for test observations at or below the test 95th percentile of hardness (111.71) is 19.42; this central-range value is a sensitivity summary, while the full-test metrics in Table 9 remain the main reported score. The plot should be read for curvature, a fan-shaped spread and extreme residuals."),
  ...figure("fig11_q4_residuals.png", 5.0, 11, "Residuals against fitted hardness for the test set; the red line marks zero error."),
  P("A complete-case sensitivity fit using only rows with observed TDS (1,513 training and 384 test rows) gives a slope of 0.4771 and a test RMSE of 18.62. It uses a smaller, potentially selected subset and does not replace the shared imputed analysis."),
  H2("5.4 Interpretation and environmental implications"),
  P("A 1 mg/L increase in TDS corresponds to a 0.414 mg CaCO_{3}/L higher predicted hardness; this is a fitted association, not a causal estimate. The intercept of 18.160 mg CaCO_{3}/L is the predicted hardness at zero TDS, which lies outside the observed range of TDS (10–530 mg/L in Table 4), so it acts as a baseline of the fit rather than a physically meaningful value. The association is positive but weak: TDS alone explains about a fifth of the variation in test hardness (R^{2} = 0.212; r = 0.384) and reduces the baseline MSE by 21.5%. Two features of the data limit the fit. First, because 64% of training TDS values were imputed with a single median, many observations share one TDS value but have widely different hardness, which appears in Figure 10 as a vertical band of points; the complete-case fit, with a steeper slope and lower RMSE, is consistent with this dilution. Second, hardness in Kerala’s rivers is generally low and right-skewed (Section 1.4), with high values concentrated at a few mineral-rich stations (Section 2.3), so a single linear term cannot capture the upper tail. Environmentally, the result supports the view that hardness rises with the overall dissolved-mineral load, but it also shows that TDS is not a sufficient proxy for hardness; the multi-parameter models of Sections 6, 8 and 9 address this."),
];

// =========================================================== 6 Q5
// Ridge then Lasso at λ = 0.01, 0.1, 1, 1,000, 10,000; "**0**" marks a coefficient set exactly to zero by Lasso
const Z0 = "**0**";
const coefRows = [
  ["Carbonate", "−0.344", "−0.344", "−0.343", "0.240", "0.711", "−0.344", "−0.344", "−0.344", Z0, Z0],
  ["Chloride", "10.304", "10.304", "10.303", "9.009", "4.697", "10.304", "10.304", "10.304", "10.132", "9.245"],
  ["Dissolved oxygen", "−0.692", "−0.692", "−0.693", "−0.908", "−0.834", "−0.692", "−0.692", "−0.692", "−0.510", Z0],
  ["TDS", "−1.598", "−1.598", "−1.595", "0.235", "1.888", "−1.598", "−1.598", "−1.597", "−0.766", Z0],
  ["Bicarbonate", "7.501", "7.501", "7.500", "6.480", "4.014", "7.501", "7.501", "7.501", "6.813", "5.615"],
  ["Sodium", "11.348", "11.348", "11.346", "9.684", "5.007", "11.348", "11.348", "11.348", "11.456", "11.579"],
  ["pH", "4.965", "4.965", "4.965", "4.767", "2.854", "4.965", "4.965", "4.965", "4.835", "3.508"],
  ["Sulphate", "3.323", "3.323", "3.324", "3.483", "2.639", "3.323", "3.323", "3.323", "3.102", "1.821"],
  ["Total phosphorus", "−0.250", "−0.250", "−0.249", "−0.091", "0.155", "−0.250", "−0.250", "−0.249", Z0, Z0],
  ...[["Predictors kept", "9", "9", "9", "9", "9", "9", "9", "9", "7", "5"],
    ["Test MSE", "432.14", "432.14", "432.13", "435.01", "562.17", "432.14", "432.14", "432.14", "432.28", "442.08"],
    ["Test R^{2}", "0.615", "0.615", "0.615", "0.612", "0.499", "0.615", "0.615", "0.615", "0.615", "0.606"]]
    .map((r, k) => r.map((t) => ({ text: t, topRule: k === 0 }))),
];
const sec6 = [
  H1("6 Q5. Ridge and Lasso Regression"),
  H2("6.1 Model set-up"),
  P("The response is total hardness and the predictors are the nine parameters of Section 1.4, standardised with training statistics (Equation 1); hardness stays in its original units. A coefficient is therefore the predicted change in hardness (mg CaCO_{3}/L) per one training-SD increase in that predictor, conditional on the other predictors. With standardised predictors z_{ij}, the two models minimise:", { keepNext: true }),
  equation(9, [m("Ridge:   "), ...sum([sup([m("("), sub("y", "i"), m(" − "), sub("β", "0"), m(" − "), ...sum([sub("β", "j"), sub("z", "ij")], "j", ""), m(")")], "2")], "i", ""), m(" + λ"), ...sum([subsup("β", "j", "2")], "j", "")]),
  equation(10, [m("Lasso:   "), ...sum([sup([m("("), sub("y", "i"), m(" − "), sub("β", "0"), m(" − "), ...sum([sub("β", "j"), sub("z", "ij")], "j", ""), m(")")], "2")], "i", ""), m(" + λ"), ...sum([m("|"), sub("β", "j"), m("|")], "j", "")]),
  P("The intercept β_{0} is not penalised. The penalty is added to the sum of squared errors (SSE) rather than to the mean squared error; this convention is stated explicitly because software packages differ in whether they divide the loss by the sample count, which changes the effective scale of λ. Models were fitted for λ = 0.01, 0.1 and 1, as suggested in the brief, and additionally for λ = 1,000 and 10,000, where the penalty becomes large enough relative to the SSE for the two methods to behave differently."),
  H2("6.2 Q5(a) Ridge and Q5(b) Lasso coefficients"),
  tabCaption(10, "Ridge and Lasso coefficients (mg CaCO_{3}/L per training SD of each standardised predictor) and held-out test performance for increasing λ. Bold **0** marks a predictor eliminated by Lasso."),
  table(["Predictor", "0.01", "0.1", "1", "1,000", "10,000", "0.01", "0.1", "1", "1,000", "10,000"], coefRows,
    [1800, 720, 720, 720, 720, 740, 720, 720, 720, 720, 740],
    { size: 15, groupHeader: [{ text: "" }, { text: "Ridge, λ =", span: 5 }, { text: "Lasso, λ =", span: 5 }] }),
  tableNote("Coefficients at λ ≤ 1 and the test RMSE/R^{2} at λ = 1 are as reported in the member analysis; the coefficients and test metrics at λ = 1,000 and 10,000, and the test MSE values, were computed with the same supplied script on the same training/test split."),
  new Paragraph({ spacing: { after: 60 }, children: [] }),
  ...figure("fig12_q5_coefficients.png", 6.0, 12, "Ridge and Lasso coefficients at λ = 1 for the nine standardised predictors."),
  P("**How the coefficients change as λ increases.** Over λ = 0.01–1 the coefficients are practically unchanged (Table 10, Figure 12): the largest change is in TDS under Ridge (−1.598 to −1.595), and all others change at most in the third decimal. Because the penalty is added to the SSE summed over 4,252 training rows, a penalty of λ ≤ 1 is negligible relative to the loss, so both models remain essentially at the unpenalised least-squares solution, with a test R^{2} of 0.615 and a test RMSE of 20.79 mg CaCO_{3}/L at λ = 1. The effect of the penalty becomes visible only when λ is comparable to the number of training rows. Under Ridge, the large coefficients shrink steadily: chloride falls from 10.30 to 9.01 at λ = 1,000 and 4.70 at λ = 10,000, and sodium from 11.35 to 9.68 and 5.01. Because the major ions are correlated, Ridge also spreads weight across them, so the small coefficients of carbonate, TDS and total phosphorus change sign and become slightly positive. The heavier shrinkage costs accuracy: Ridge’s test R^{2} falls to 0.612 at λ = 1,000 and 0.499 at λ = 10,000."),
  P("**Predictors eliminated by Lasso.** At λ = 0.01, 0.1 and 1, Lasso drops no predictors. At λ = 1,000 it sets carbonate and total phosphorus exactly to zero (7 predictors kept), and at λ = 10,000 it additionally eliminates dissolved oxygen and TDS (5 predictors kept). The predictors with the largest coefficients (sodium, chloride, bicarbonate, pH and sulphate) are retained, and sodium’s coefficient even rises slightly (11.35 to 11.58) as Lasso reallocates weight from the dropped predictors. Despite using only five predictors at λ = 10,000, Lasso keeps a test R^{2} of 0.606, close to the full model’s 0.615."),
  P("**Correlated predictors.** The largest absolute training correlation among the predictors is 0.71, between bicarbonate and sodium. Correlation among predictors can make conditional coefficients unstable or reverse their signs; for example, TDS has a positive slope on its own (Section 5) but a small negative coefficient once the correlated ions are included."),
  H2("6.3 Comparison of Ridge and Lasso"),
  bullet("**Coefficient shrinkage.** Ridge’s squared (L2) penalty shrinks all coefficients smoothly towards zero but never exactly to zero; Lasso’s absolute (L1) penalty shrinks them and can set some exactly to zero. At λ ≤ 1 the two give near-identical coefficients and identical test performance (R^{2} = 0.615), because the penalty is small relative to the SSE. At λ = 10,000 the difference is clear: Ridge has shrunk every coefficient (chloride to 4.70, sodium to 5.01) and its test R^{2} has fallen to 0.499, whereas Lasso has removed four weak predictors and kept the strong ones almost unchanged, with a test R^{2} of 0.606."),
  bullet("**Interpretability.** Both models give coefficients on a common standardised scale, so magnitudes are directly comparable: sodium (11.35), chloride (10.30) and bicarbonate (7.50) have the largest effects on predicted hardness. Lasso becomes the more interpretable model once λ is large enough to remove weak predictors: at λ = 10,000 it describes hardness with five major-ion and pH terms."),
  bullet("**Feature selection.** Ridge performs no feature selection. Lasso performs selection only at much larger penalties in this dataset (λ ≥ 1,000), where it removes the weakest predictors first (carbonate and total phosphorus, then dissolved oxygen and TDS) and keeps the major ions. For a sparse model, Lasso at λ = 10,000 is therefore preferable to Ridge at the same penalty."),
];

// =========================================================== 7 Q6
const sec7 = [
  H1("7 Q6. Principal Component Analysis"),
  P("PCA was fitted to the nine standardised training predictors of Section 1.4 (Equation 1), so that each parameter contributes on a common scale regardless of its units. Standardisation is essential here because the parameters range from about 0.1 mg P/L (phosphorus) to tens of mg/L (bicarbonate)."),
  H2("7.1 Variance explained"),
  P("PC1 explains 36.6% and PC2 explains 11.9% of the predictor variance, 48.4% combined. Six components are required to explain 80% of the variance and seven to explain 90% (Figure 14). After PC1, the variance is spread fairly evenly over the remaining components."),
  ...figure("fig13_q6_pc_scores.png", 4.9, 13, "Training observations projected onto the first two principal components (PC1–PC2 score plot)."),
  ...figure("fig14_q6_scree.png", 4.6, 14, "Individual (bars) and cumulative (line) variance explained by the nine principal components."),
  H2("7.2 Component loadings"),
  tabCaption(11, "Signed loadings of the nine standardised predictors on PC1 and PC2 (as plotted in Figure 15)."),
  table(["Predictor", "PC1 loading", "PC2 loading"], [
    ["Carbonate", "−0.227", "0.636"], ["Chloride", "−0.766", "0.0497"], ["Dissolved oxygen", "0.222", "−0.143"],
    ["Total dissolved solids", "−0.694", "−0.339"], ["Bicarbonate", "−0.870", "−0.0965"], ["Sodium", "−0.857", "0.0214"],
    ["pH", "−0.484", "0.188"], ["Sulphate", "−0.625", "−0.0923"], ["Total phosphorus", "−0.0776", "0.686"],
  ], [4000, 2500, 2500], { size: 18 }),
  tableNote("Loadings are reported as plotted in Figure 15; their magnitudes correspond to correlations between each standardised predictor and the component."),
  ...figure("fig15_q6_loadings.png", 6.0, 15, "Signed loadings for PC1 and PC2."),
  P("Table 11 lists the loadings. **PC1** is mainly a dissolved-ion gradient: its strongest absolute loadings are bicarbonate (−0.87), sodium (−0.86), chloride (−0.77), TDS (−0.69) and sulphate (−0.63). **PC2** is most associated with total phosphorus (0.69) and carbonate (0.64). The sign of an entire component is arbitrary; relative signs and loading magnitudes give the interpretation."),
  H2("7.3 Interpretation"),
  P("The dominant pattern in the dataset is that the major dissolved ions vary together: samples rich in bicarbonate tend also to be rich in sodium, chloride, sulphate and TDS. This is consistent with the strong bicarbonate–sodium correlation (0.71) found in Section 6 and with the mineral-load contrast between the Bharathapuzha stations and the other rivers in Section 2.3. In the score plot (Figure 13), most training observations cluster at one end of PC1 with a long tail of fewer samples spread along the high-ion side, mirroring the right-skewed, low-mineral character of most Kerala river water. PC2 separates a phosphorus–carbonate signal that is largely independent of the ionic load. Dissolved oxygen loads weakly and with the opposite sign to the ions on PC1. Because PC1 and PC2 together explain less than half of the variance and six components are needed for 80%, the remaining parameters carry substantial independent information, so the dataset cannot be reduced to two dimensions without loss."),
];

// =========================================================== 8 Q7
const imp = [
  ["Sodium", "50.52", "63.67", "45.52"], ["Chloride", "18.99", "17.71", "23.77"], ["Bicarbonate", "9.14", "5.48", "9.47"],
  ["pH", "8.14", "6.73", "7.18"], ["Sulphate", "5.43", "3.20", "4.97"], ["Carbonate", "2.89", "1.48", "2.07"],
  ["Dissolved oxygen", "1.48", "0.71", "2.77"], ["Total dissolved solids", "1.68", "0.69", "2.07"], ["Total phosphorus", "1.74", "0.34", "2.18"],
];
const treeText = [
  "Sodium <= 13.94  [n = 4252, mean = 36.61]",
  "├─ True:  Chloride <= 14.905  [n = 3898, mean = 29.33]",
  "│  ├─ True:  Chloride <= 10.025  [n = 3034, mean = 22.54]",
  "│  │  ├─ True:  TDS <= 34.5  [n = 1898, mean = 19.71] ...",
  "│  │  └─ False: Bicarbonate <= 16.25  [n = 1136, mean = 27.27] ...",
  "│  └─ False: Sulphate <= 3.11  [n = 864, mean = 53.18]",
  "│     ├─ True:  Carbonate <= 0.202  [n = 729, mean = 48.15] ...",
  "│     └─ False: Bicarbonate <= 18.75  [n = 135, mean = 80.35] ...",
  "└─ False: pH <= 7.11  [n = 354, mean = 116.73]",
  "   ├─ True:  Bicarbonate <= 35.665  [n = 44, mean = 51.12]",
  "   │  ├─ True:  leaf  [n = 24, value = 41.81]",
  "   │  └─ False: leaf  [n = 20, value = 62.28]",
  "   └─ False: Sodium <= 17.95  [n = 310, mean = 126.05]",
  "      ├─ True:  Bicarbonate <= 99.297  [n = 101, mean = 97.20] ...",
  "      └─ False: Bicarbonate <= 152.25  [n = 209, mean = 139.99] ...",
];
const sec8 = [
  H1("8 Q7. Decision Tree Regression"),
  P("The Decision Tree predicts total hardness, the same response as Q5, from the nine predictors of Section 1.4, using the shared training/test split and training-fitted median imputation; predictors are not standardised (Section 1.4)."),
  H2("8.1 Q7(a) Model development and complexity control"),
  P("An unrestricted Decision Tree regressor was first fitted with the default settings as a baseline. It reached a depth of 36 with 3,625 leaves. Such a complex structure can fit very specific patterns of the training observations and is susceptible to overfitting."),
  P("A second, controlled tree was selected by five-fold cross-validation on the training set, minimising the mean squared error. The grid search considered `max_depth` ∈ {3, 5, 7, 10, 15, None}, `min_samples_leaf` ∈ {1, 2, 5, 10, 20, 30, 50} and `min_samples_split` ∈ {2, 10, 20}. The selected parameters were `max_depth = 10`, `min_samples_leaf = 20` and `min_samples_split = 2` (best mean cross-validation MSE 554.78). The resulting controlled tree has depth 10 and 123 leaves (Table 12). The held-out test set was not used for model selection."),
  tabCaption(12, "Decision Tree complexity."),
  table(["Model", "Depth", "Number of leaves"], [["Unrestricted Decision Tree", "36", "3,625"], ["Controlled Decision Tree", "10", "123"]], [4500, 2000, 2500], { size: 19 }),
  new Paragraph({ spacing: { after: 60 }, children: [] }),
  P("**Important predictors.** Feature importance is the total reduction in squared-error impurity contributed by splits on each predictor, normalised to sum to one (Table 13). The unrestricted tree ranks sodium, chloride and bicarbonate as its three leading predictors; the controlled tree ranks sodium, chloride and pH. Sodium and chloride are therefore consistently the two most important predictors across both tree structures. These scores describe predictive contribution in the fitted models and do not establish causation."),
  tabCaption(13, "Feature importance (%) of the nine predictors in the three tree-based models."),
  table(["Predictor", "Unrestricted Decision Tree", "Controlled Decision Tree", "Random Forest (100 trees)"], imp, [3000, 2000, 2000, 2000], { size: 18 }),
  tableNote("Values are the supplied feature-importance scores (Q78_feature_importance.csv) expressed as percentages. The Random Forest column is discussed in Section 9."),
  P("**Tree visualisation.** Figure 16 shows the first three levels of the controlled tree, and the text representation below transcribes the same splits (n = training samples reaching a node; mean = mean hardness in mg CaCO_{3}/L; “...” marks branches that continue below the third level). The root split on sodium separates a small group of 354 high-sodium samples with a mean hardness of 116.73 mg CaCO_{3}/L from the remaining 3,898 samples with a mean of 29.33; chloride, sulphate, pH and bicarbonate then refine these groups."),
  ...figure("fig16_q7_controlled_tree.png", 6.27, 16, "First three levels of the controlled Decision Tree (max_depth = 10, min_samples_leaf = 20)."),
  ...codeBlock(treeText, 15),
  H2("8.2 Q7(b) Model performance"),
  tabCaption(14, "Decision Tree training and test performance."),
  table(["Model", "Training MSE", "Test MSE", "Training R^{2}", "Test R^{2}"], [
    ["Unrestricted tree", "0.008", "482.54", "1.000", "0.570"], ["Controlled tree", "401.10", "315.64", "0.722", "0.719"],
  ], [3000, 1500, 1500, 1500, 1500], { size: 19 }),
  new Paragraph({ spacing: { after: 60 }, children: [] }),
  P("Table 14 reports the results. The unrestricted tree has an almost zero training MSE but a substantially larger test MSE, which indicates severe overfitting: it has memorised the training samples rather than learned a general relationship. Restricting tree complexity increased the training error but reduced the test MSE from 482.54 to 315.64, a reduction of approximately 34.59%, and raised the test R^{2} from 0.570 to 0.719. The controlled tree’s training and test scores are close (R^{2} 0.722 and 0.719), so it generalises well to the held-out data. It is therefore the preferred Decision Tree model for comparison with the Random Forest."),
];

// =========================================================== 9 Q8
const sec9 = [
  H1("9 Q8. Random Forest Regression and Model Comparison"),
  H2("9.1 Q8(a) Random Forest model and feature importance"),
  P("A Random Forest regressor of exactly 100 trees was fitted with the same nine predictors, response, training/test split and training-fitted median imputation as in Q7, with `random_state = 42` for reproducibility. A Random Forest combines the predictions of many trees, each grown on a bootstrap sample of the training data; for regression, the final prediction is the average of the individual tree predictions. The forest was not tuned against the test set."),
  P("The three most important predictors in the Random Forest are sodium (45.52%), chloride (23.77%) and bicarbonate (9.47%) (Table 13, Figure 17). Sodium and chloride are again the two leading predictors, consistent with the controlled Decision Tree. The third-ranked predictor differs: pH for the controlled tree and bicarbonate for the Random Forest. This difference is expected, because the models construct their splits differently and the Random Forest aggregates information across 100 trees. The forest also spreads importance more evenly: sodium accounts for 63.67% of the controlled tree’s importance but 45.52% of the forest’s."),
  ...figure("fig17_q8_importance_dt_vs_rf.png", 5.0, 17, "Feature-importance ranking: controlled Decision Tree vs Random Forest (100 trees)."),
  H2("9.2 Q8(b) Comparative evaluation"),
  tabCaption(15, "Training and test performance of the three tree-based models."),
  table(["Model", "Training MSE", "Test MSE", "Training RMSE", "Test RMSE", "Training R^{2}", "Test R^{2}"], [
    ["Unrestricted Decision Tree", "0.008", "482.54", "0.09", "21.97", "1.000", "0.570"],
    ["Controlled Decision Tree", "401.10", "315.64", "20.03", "17.77", "0.722", "0.719"],
    ["Random Forest (100 trees)", "61.42", "252.59", "7.84", "15.89", "0.957", "0.775"],
  ], [2600, 1050, 1000, 1150, 1000, 1150, 1050], { size: 17 }),
  tableNote("RMSE values are in mg CaCO_{3}/L and are the square roots of the corresponding MSE values (Q78_results_summary.json)."),
  ...figurePair("fig18a_q8_mse.png", "fig18b_q8_r2.png", 3.0, 18, "(a) Mean squared error", "(b) R^{2}", "Training and test performance across the unrestricted tree, controlled tree and Random Forest."),
  P("Table 15 and Figure 18 compare the three models. The Random Forest achieves a test MSE of 252.59 and a test R^{2} of 0.775. Relative to the controlled Decision Tree, the test MSE decreases by approximately 19.97% and the test R^{2} increases from 0.719 to 0.775; the test RMSE falls from 17.77 to 15.89 mg CaCO_{3}/L."),
  P("**Overfitting.** The unrestricted tree shows severe overfitting: its training MSE is nearly zero, whereas its test MSE is 482.54. Complexity control improves the Decision Tree’s test performance, and the Random Forest reduces the test MSE further to 252.59. The Random Forest’s training MSE (61.42) remains well below its test MSE, so a train–test gap persists; it would therefore be inaccurate to claim that the Random Forest eliminates overfitting or has a smaller absolute MSE gap than the controlled tree. The appropriate conclusion is that averaging over 100 trees reduces the variance of the predictions and achieves better generalisation, as measured by the held-out test metrics."),
  P("**Model selection.** The Random Forest is the better model on the test dataset, because it has the lowest test MSE (252.59) and RMSE (15.89) and the highest test R^{2} (0.775) of the three models evaluated. The usual caveats apply: the random row split (Section 1.4), median imputation of incomplete predictors, and correlations among the chemical predictors, which can redistribute importance between them; feature importance should not be interpreted causally."),
];

// =========================================================== 10 DISCUSSION
const sec10 = [
  H1("10 Integrated Discussion and Conclusions"),
  H2("10.1 Water-quality patterns"),
  P("Kerala’s rivers carry soft water with a low dissolved-solids load: chloride, sulphate, hardness, TDS and nitrate comply with the BIS acceptable limits in almost every sample. The issues that do emerge are low dissolved oxygen, acidic pH, iron (largely in 2010–2012) and, tentatively, lead; arsenic and cadmium exceedances cluster in single years and are not interpreted as river signals. Mean DO declined from the 1990s to the 2010s. Seasonal differences between pre-monsoon and monsoon water are statistically significant for DO, pH, TDS, chloride and hardness, in a direction consistent with monsoon dilution, while the two Periyar stations compared are alike except for chloride. The largest spatial contrast in the state is the high mineral load of three Bharathapuzha stations."),
  H2("10.2 Data quality"),
  P("Missingness is substantial and structured. Nineteen of 33 parameters are more than 80% empty, including all heavy metals, and the remaining gaps follow changes in the monitoring programme over time and between stations (MAR rather than MCAR). This limits what Q1 can conclude (for example, mean DO excludes the 1980s) and affects the models: TDS, the predictor of Q4, is imputed in about 64% of training rows. Of the three simple imputation methods, median imputation was the most suitable for these right-skewed parameters and was used for all predictive models, fitted on the training data only; all three methods, however, reduce variance and can hide extreme values."),
  H2("10.3 Relationships among parameters and model comparison"),
  P("The analyses agree on the structure of the data. The major dissolved ions vary together and form the first principal component; sodium, chloride and bicarbonate have the largest standardised coefficients in Ridge and Lasso; and sodium and chloride are the most important predictors in every tree-based model. Table 16 compares the held-out performance of all predictive models on the same 1,064 test samples."),
  tabCaption(16, "Held-out test performance of all predictive models for total hardness (n = 1,064)."),
  table(["Model (section)", "Predictors", "Test MSE", "Test RMSE", "Test R^{2}"], [
    ["Train-mean baseline (5)", "none", "1126.67", "—", "—"],
    ["Simple linear regression (5)", "TDS", "884.52", "29.74", "0.212"],
    ["Ridge, λ = 1 (6)", "9", "432.13", "20.79", "0.615"],
    ["Lasso, λ = 1 (6)", "9", "432.14", "20.79", "0.615"],
    ["Unrestricted Decision Tree (8)", "9", "482.54", "21.97", "0.570"],
    ["Controlled Decision Tree (8)", "9", "315.64", "17.77", "0.719"],
    ["Random Forest, 100 trees (9)", "9", "252.59", "15.89", "0.775"],
  ], [3300, 1300, 1500, 1400, 1500], { size: 18 }),
  tableNote("RMSE in mg CaCO_{3}/L. Ridge and Lasso test MSE values were computed from the supplied Q4–Q6 analysis script on the shared split; they are consistent with the reported RMSE and R^{2}."),
  P("Predictive performance improves steadily with model flexibility: one predictor explains about a fifth of the test variance, the nine-predictor linear models about 62%, and the Random Forest about 78%. The non-linear tree models outperform the linear models once complexity is controlled, but an uncontrolled tree performs worse than the linear models, which shows the importance of regularising complexity. The Random Forest is the best model in this study."),
  H2("10.4 Limitations and conclusion"),
  P("Common limitations apply throughout: the absence of BOD, COD and conductivity; the assumption that the metal columns are in µg/L; repeated, non-independent sampling at the same stations; median imputation of incomplete predictors; correlated chemical predictors; and a random row-wise split that measures interpolation within the pooled data rather than prediction at unseen stations or future periods. Within these limits, the report provides a consistent assessment of water-quality patterns, data quality, relationships among parameters and model performance for the Kerala CWC dataset. A station- or time-based split, and imputation that accounts for station and decade, would be natural next steps to test how well these conclusions generalise."),
];

// =========================================================== REFERENCES & APPENDIX
const refs = [
  "Bureau of Indian Standards. (2012). *IS 10500:2012 Drinking Water – Specification* (Second Revision), Tables 1–3 (acceptable and permissible limits). New Delhi: BIS.",
  "Central Pollution Control Board. *Water Quality Criteria for designated best use classes* (Class A: pH 6.5–8.5, DO ≥ 6 mg/L, BOD ≤ 2 mg/L). cpcb.nic.in/water-quality-criteria.",
  "Central Water Commission. (2020). *Surface water quality: Manual chemical parameters, Kerala, 1961 to 2020* [Data set; file swq_manual_chemical_parameters_cwc_kl_1961_2020]. National Water Data Portal, Government of India.",
  "Little, R. J. A., & Rubin, D. B. (2019). *Statistical Analysis with Missing Data* (3rd ed.). Wiley.",
];
const back = [
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("References")] }),
  ...refs.map((r, i) => new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 100 }, indent: { left: 440, hanging: 440 },
    children: [new TextRun(`[${i + 1}]\t`), ...L.runs(r)], tabStops: [{ type: d.TabStopType.LEFT, position: 440 }] })),
  new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun("Appendix A: Analysis Code and Data Files")] }),
  P("The files in Table 17 accompany this report. All predictive analyses read the shared `train.csv` and `test.csv`."),
  tabCaption(17, "Analysis scripts and data files."),
  table(["File", "Purpose", "Questions"], [
    ["`Original_CWC_dataset.csv`", { text: "Exported CWC dataset (5,433 rows, 52 columns)", align: "left" }, "Q1"],
    ["`cleaned_full.csv`", { text: "Shared cleaned dataset (5,433 rows, 37 columns)", align: "left" }, "Q2, Q3"],
    ["`train.csv`, `test.csv`", { text: "Shared 80/20 split of the 5,316 samples with observed hardness", align: "left" }, "Q4–Q8"],
    ["`q1_analysis.py`", { text: "Descriptive statistics, exceedances and z-tests; Figures 1–5", align: "left" }, "Q1"],
    ["`person_c_analysis.py`", { text: "Simple regression, Ridge, Lasso and PCA; Figures 10–15", align: "left" }, "Q4–Q6"],
    ["`es225_q7_q8_analysis.py`", { text: "Decision Trees and Random Forest; Figures 16–18", align: "left" }, "Q7, Q8"],
  ], [3000, 4800, 1200], { size: 18 }),
];

// =========================================================== DOCUMENT
const body = [...frontMatter, ...objectives, ...sec1, ...sec2, ...sec3, ...sec4, ...sec5, ...sec6, ...sec7, ...sec8, ...sec9, ...sec10, ...back];

const doc = new Document({
  creator: "ES 225 Group 10", title: "ES 225 Assignment 3 – Group 10",
  description: "Unified report for ES 225 Assignment 3, Group 10, IIT Bombay",
  styles: {
    default: { document: { run: { font: FONT, size: 22 }, paragraph: { spacing: { line: 264 } } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 30, bold: true, font: FONT }, paragraph: { spacing: { before: 360, after: 160 }, keepNext: true, keepLines: true, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, font: FONT }, paragraph: { spacing: { before: 240, after: 100 }, keepNext: true, keepLines: true, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 23, bold: true, italics: true, font: FONT }, paragraph: { spacing: { before: 160, after: 80 }, keepNext: true, outlineLevel: 2 } },
      { id: "FrontHeading", name: "Front Heading", basedOn: "Normal", next: "Normal",
        run: { size: 30, bold: true, font: FONT }, paragraph: { spacing: { before: 240, after: 160 }, keepNext: true } },
      { id: "FigureCaption", name: "Figure Caption", basedOn: "Normal", next: "Normal",
        run: { size: 19, font: FONT }, paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 } } },
      { id: "TableCaption", name: "Table Caption", basedOn: "Normal", next: "Normal",
        run: { size: 19, font: FONT }, paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 80 }, keepNext: true } },
    ],
  },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 260 } } } }] },
    { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 400, hanging: 300 } } } }] },
    { reference: "alpha", levels: [{ level: 0, format: LevelFormat.LOWER_LETTER, text: "(%1)", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 460, hanging: 360 } } } }] },
  ] },
  sections: [{
    properties: { titlePage: true, page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1300, left: 1440, right: 1440, header: 600, footer: 600 } } },
    headers: {
      default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999", space: 2 } },
        children: [new TextRun({ text: "ES 225 – Assignment 3 · Group 10", size: 17, color: "555555" })] })] }),
      first: new Header({ children: [new Paragraph({ children: [] })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 19 })] })] }),
      first: new Footer({ children: [new Paragraph({ children: [] })] }),
    },
    children: [...titlePage, ...body],
  }],
});

const out = path.join(__dirname, "..", "output", "ES225_Assignment3_Group10_Report.docx");
Packer.toBuffer(doc).then((buf) => { fs.writeFileSync(out, buf); console.log("wrote", out); });
