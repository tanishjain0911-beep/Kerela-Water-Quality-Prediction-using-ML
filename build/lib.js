// Helpers for building the ES 225 Assignment 3 report with docx-js.
const fs = require("fs");
const path = require("path");
const d = require("docx");
const {
  Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, ShadingType, HeadingLevel, Tab, TabStopType, VerticalAlign,
  Math: OMath, MathRun, MathFraction, MathRadical, MathSubScript, MathSuperScript,
  MathSubSuperScript, MathSum,
} = d;

const FONT = "Times New Roman";
const TEXT_W = 9026; // A4 with 1-inch margins, in DXA
const ASSETS = path.join(__dirname, "..", "assets", "figures");

// ---------------------------------------------------------------- inline text
// Mini markup: **bold**, *italic*, _{sub}, ^{sup}, `mono`
function runs(text, baseIn = {}) {
  const base = Object.fromEntries(Object.entries(baseIn).filter(([, v]) => v !== undefined));
  const out = [];
  let bold = false, italics = false, buf = "";
  const flush = (extra = {}) => {
    if (buf) out.push(new TextRun({ text: buf, bold, italics, ...base, ...extra }));
    buf = "";
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "*" && text[i + 1] === "*") { flush(); bold = !bold; i++; continue; }
    if (c === "*") { flush(); italics = !italics; continue; }
    if ((c === "_" || c === "^") && text[i + 1] === "{") {
      flush();
      const end = text.indexOf("}", i);
      buf = text.slice(i + 2, end);
      flush(c === "_" ? { subScript: true } : { superScript: true });
      i = end; continue;
    }
    if (c === "`") {
      flush();
      const end = text.indexOf("`", i + 1);
      buf = text.slice(i + 1, end);
      flush({ font: "Consolas", size: (base.size || 22) - 3 });
      i = end; continue;
    }
    buf += c;
  }
  flush();
  return out;
}

const P = (text, opts = {}) => new Paragraph({
  children: runs(text, opts.run || {}),
  alignment: opts.align ?? AlignmentType.JUSTIFIED,
  spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
  keepNext: opts.keepNext, indent: opts.indent,
});

const H1 = (text, opts = {}) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)], pageBreakBefore: opts.pageBreak ?? false });
const H2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const H3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });

const bullet = (text, level = 0) => new Paragraph({
  numbering: { reference: "bullets", level }, children: runs(text),
  alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 },
});
let listCounter = 0;
const numbered = (items, ref = "numbers") => {
  const instance = ++listCounter;
  return items.map((t) => new Paragraph({
    numbering: { reference: ref, level: 0, instance }, children: runs(t),
    alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 },
  }));
};

// ------------------------------------------------------------------ captions
const figCaption = (n, text) => new Paragraph({
  style: "FigureCaption", children: [new TextRun({ text: `Figure ${n}: `, bold: true }), ...runs(text)],
});
const tabCaption = (n, text) => new Paragraph({
  style: "TableCaption", keepNext: true, children: [new TextRun({ text: `Table ${n}: `, bold: true }), ...runs(text)],
});

// ------------------------------------------------------------------- figures
function imgSize(file) {
  const b = fs.readFileSync(file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; // PNG IHDR
}
function figure(file, widthIn, n, caption) {
  const full = path.join(ASSETS, file);
  const { w, h } = imgSize(full);
  const wpx = Math.round(widthIn * 96), hpx = Math.round(wpx * h / w);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER, keepNext: true, spacing: { before: 120, after: 60 },
      children: [new ImageRun({ type: "png", data: fs.readFileSync(full), transformation: { width: wpx, height: hpx },
        altText: { title: `Figure ${n}`, description: caption.replace(/[*_{}^`]/g, ""), name: file } })],
    }),
    figCaption(n, caption),
  ];
}
// two images side by side with (a)/(b) labels, one caption
function figurePair(fa, fb, widthIn, n, labA, labB, caption) {
  const cellW = TEXT_W / 2;
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const borders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none };
  const cell = (file, lab) => {
    const full = path.join(ASSETS, file); const { w, h } = imgSize(full);
    const wpx = Math.round(widthIn * 96), hpx = Math.round(wpx * h / w);
    return new TableCell({
      width: { size: cellW, type: WidthType.DXA }, borders,
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, children: [new ImageRun({ type: "png", data: fs.readFileSync(full), transformation: { width: wpx, height: hpx }, altText: { title: lab, description: lab, name: file } })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { after: 0 }, children: runs(lab, { size: 19 }) }),
      ],
    });
  };
  return [
    new Table({ width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: [cellW, cellW], borders,
      rows: [new TableRow({ cantSplit: true, children: [cell(fa, labA), cell(fb, labB)] })] }),
    figCaption(n, caption),
  ];
}

// -------------------------------------------------------------------- tables
const RULE = { style: BorderStyle.SINGLE, size: 6, color: "000000" };
const THIN = { style: BorderStyle.SINGLE, size: 2, color: "BFBFBF" };
const NONE = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };

// rows: array of arrays of strings (or {text, span, rowSpan, bold, align})
function table(header, rows, widths, opts = {}) {
  const size = opts.size ?? 17; // half-points
  const total = widths.reduce((a, b) => a + b, 0);
  const scale = TEXT_W / total;
  const W = widths.map((w) => Math.round(w * scale));
  W[W.length - 1] += TEXT_W - W.reduce((a, b) => a + b, 0);
  const align = opts.align || W.map((_, i) => (i === 0 ? "left" : "center"));
  const AL = { left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT };
  // short tables are kept on one page (keep-with-next on every row but the last)
  const keepTogether = opts.keepNext ?? rows.length <= 20;
  const mk = (c, i, isHead, last, first, rowIdx) => {
    const o = typeof c === "object" ? c : { text: String(c) };
    let colW = W[i];
    if (o.span) for (let k = 1; k < o.span; k++) colW += W[i + k];
    return new TableCell({
      width: { size: colW, type: WidthType.DXA }, columnSpan: o.span, rowSpan: o.rowSpan,
      verticalAlign: VerticalAlign.CENTER,
      shading: isHead ? { type: ShadingType.CLEAR, fill: "E7ECF2", color: "auto" } : (opts.band && rowIdx % 2 ? { type: ShadingType.CLEAR, fill: "F7F7F7", color: "auto" } : undefined),
      margins: { top: 30, bottom: 30, left: 70, right: 70 },
      borders: {
        top: isHead ? RULE : (o.topRule ? RULE : NONE),
        bottom: isHead ? RULE : (last ? RULE : (o.noLine ? NONE : THIN)),
        left: NONE, right: NONE,
      },
      children: [new Paragraph({ alignment: AL[o.align || align[i]], spacing: { after: 0 }, keepNext: keepTogether && !last,
        children: runs(o.text, { size, bold: isHead || o.bold || undefined }) })],
    });
  };
  const trows = [];
  // optional grouping row above the header, e.g. [{text:""}, {text:"Ridge", span:5}, ...]
  if (opts.groupHeader) {
    let col = 0;
    trows.push(new TableRow({ tableHeader: true, cantSplit: true, children: opts.groupHeader.map((c) => {
      const cell = mk({ ...c, align: "center" }, col, true, false, true, 0); col += c.span || 1; return cell; }) }));
  }
  trows.push(new TableRow({ tableHeader: true, cantSplit: true, children: header.map((c, i) => mk(c, i, true, false, true, 0)) }));
  rows.forEach((r, ri) => {
    const last = ri === rows.length - 1;
    // column index accounting for spans / rowSpan continuation (caller passes `skip` to offset)
    let col = r.__offset || 0;
    const cells = r.filter((c) => c !== undefined).map((c) => { const cell = mk(c, col, false, last, false, ri); col += (typeof c === "object" && c.span) || 1; return cell; });
    trows.push(new TableRow({ cantSplit: true, children: cells }));
  });
  return new Table({ width: { size: TEXT_W, type: WidthType.DXA }, columnWidths: W, rows: trows,
    borders: { top: NONE, bottom: NONE, left: NONE, right: NONE, insideHorizontal: NONE, insideVertical: NONE } });
}
const tableNote = (text) => new Paragraph({ children: runs(text, { size: 17 }), alignment: AlignmentType.JUSTIFIED, spacing: { before: 60, after: 160 } });

// ----------------------------------------------------------------- equations
const m = (s) => new MathRun(s);
const frac = (n, den) => new MathFraction({ numerator: n, denominator: den });
const sqrt = (c) => new MathRadical({ children: c });
const sub = (b, s) => new MathSubScript({ children: [m(b)], subScript: [m(s)] });
const sup = (b, s) => new MathSuperScript({ children: Array.isArray(b) ? b : [m(b)], superScript: [m(s)] });
const subsup = (b, s, p) => new MathSubSuperScript({ children: [m(b)], subScript: [m(s)], superScript: [m(p)] });
// Returns an array (spread it): full n-ary sum when both limits exist, otherwise a subscripted Σ.
const sum = (c, lo, hi) => {
  if (lo && hi) return [new MathSum({ children: c, subScript: [m(lo)], superScript: [m(hi)] })];
  return [lo ? new MathSubScript({ children: [m("∑")], subScript: [m(lo)] }) : m("∑"), ...c];
};

function equation(n, parts) {
  return new Paragraph({
    tabStops: [{ type: TabStopType.CENTER, position: Math.round(TEXT_W / 2) }, { type: TabStopType.RIGHT, position: TEXT_W }],
    spacing: { before: 80, after: 120 }, keepLines: true,
    children: [new TextRun({ children: [new Tab()] }), new OMath({ children: parts }), new TextRun({ children: [new Tab(), `(${n})`] })],
  });
}

function codeBlock(lines, size = 16) {
  return lines.map((l, i) => new Paragraph({
    spacing: { after: 0, before: i === 0 ? 60 : 0 }, keepLines: true, keepNext: i < lines.length - 1,
    shading: { type: ShadingType.CLEAR, fill: "F4F4F4", color: "auto" }, indent: { left: 200, right: 200 },
    children: [new TextRun({ text: l.length ? l : " ", font: "Consolas", size })],
  })).concat([new Paragraph({ spacing: { after: 60 }, children: [] })]);
}

module.exports = { d, runs, P, H1, H2, H3, bullet, numbered, figure, figurePair, table, tableNote, tabCaption, figCaption,
  equation, m, frac, sqrt, sub, sup, subsup, sum, codeBlock, FONT, TEXT_W };
