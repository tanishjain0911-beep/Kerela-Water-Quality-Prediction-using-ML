"""Copy the supplied member figures into assets/figures with report numbering.
Images are flattened onto white and trimmed of empty margins; the controlled-tree plot is cropped to its three drawn levels."""
import sys
from pathlib import Path
from PIL import Image
src, dst = Path(sys.argv[1]), Path(sys.argv[2])
MAP = [
    ("Q1_fig1_exceedances.png", "fig01_q1_exceedances.png"),
    ("Q1_fig2_station_medians.png", "fig02_q1_station_medians.png"),
    ("Q1_fig3_season_boxplots.png", "fig03_q1_season_boxplots.png"),
    ("Q1_fig4_monthly_means.png", "fig04_q1_monthly_means.png"),
    ("Q1_fig5_periyar_stations.png", "fig05_q1_periyar_stations.png"),
    ("Q23-000.png", "fig06_q2_missing_per_parameter.png"),
    ("Q23-002.png", "fig07_q2_missing_by_decade.png"),
    ("Q23-004.png", "fig08_q3_distributions.png"),
    ("Q23-006.png", "fig09_q3_boxplots.png"),
    ("Q46-000.png", "fig10_q4_scatter_fit.png"),
    ("Q46-001.png", "fig11_q4_residuals.png"),
    ("Q46-002.png", "fig12_q5_coefficients.png"),
    ("Q46-003.png", "fig13_q6_pc_scores.png"),
    ("Q46-004.png", "fig14_q6_scree.png"),
    ("Q46-005.png", "fig15_q6_loadings.png"),
    ("Q78_controlled_tree_first_levels.png", "fig16_q7_controlled_tree.png"),
    ("Q78-000.png", "fig17_q8_importance_dt_vs_rf.png"),
    ("Q78-002.png", "fig18a_q8_mse.png"),
    ("Q78-004.png", "fig18b_q8_r2.png"),
]
dst.mkdir(parents=True, exist_ok=True)
for s, d in MAP:
    im = Image.open(src / s)
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA"); bg = Image.new("RGB", im.size, "white"); bg.paste(im, mask=im.split()[-1]); im = bg
    else:
        im = im.convert("RGB")
    if "controlled_tree" in s:
        im = im.crop((0, 0, im.width, 2380))
    # trim surrounding white margins, keeping a small pad
    from PIL import ImageChops
    diff = ImageChops.difference(im, Image.new("RGB", im.size, "white")).convert("L").point(lambda v: 255 if v > 12 else 0)
    box = diff.getbbox()
    if box:
        pad = max(12, im.width // 100)
        im = im.crop((max(0, box[0]-pad), max(0, box[1]-pad), min(im.width, box[2]+pad), min(im.height, box[3]+pad)))
    im.save(dst / d, optimize=True)
    print(d, im.size)
