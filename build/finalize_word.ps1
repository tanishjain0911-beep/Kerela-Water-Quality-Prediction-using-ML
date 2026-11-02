# Opens the generated DOCX in Microsoft Word, fills the contents / list of figures / list of tables,
# saves the DOCX and exports the final PDF.
# Word cannot open very long paths, so the work is done on a short temporary copy.
# Usage: powershell -ExecutionPolicy Bypass -File build\finalize_word.ps1
$ErrorActionPreference = "Stop"
$out  = (Resolve-Path (Join-Path $PSScriptRoot "..\output")).Path
$name = "ES225_Assignment3_Group10_Report"
$work = Join-Path $env:TEMP "es225w"
New-Item -ItemType Directory -Force $work | Out-Null
$docx = Join-Path $work "$name.docx"
$pdf  = Join-Path $work "$name.pdf"
Copy-Item (Join-Path $out "$name.docx") $docx -Force
$log = Join-Path $work "finalize.log"
function Log($msg) { "$(Get-Date -Format HH:mm:ss) $msg" | Tee-Object -FilePath $log -Append }

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    Log "opening"
    $doc = $word.Documents.Open($docx, $false, $false)
    Log "updating tables of contents"
    foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
    $doc.Repaginate()
    foreach ($toc in $doc.TablesOfContents) { $toc.UpdatePageNumbers() }
    Log "saving"
    $doc.Save()
    Log "exporting pdf"
    Log ("pages: " + $doc.ComputeStatistics(2))
    # 17 = wdFormatPDF
    [string]$pdfPath = $pdf
    $doc.SaveAs2($pdfPath, 17)
    Log "pdf written"
    $doc.Close($false)
} finally {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
Copy-Item $docx (Join-Path $out "$name.docx") -Force
Copy-Item $pdf  (Join-Path $out "$name.pdf") -Force
Log "done"
