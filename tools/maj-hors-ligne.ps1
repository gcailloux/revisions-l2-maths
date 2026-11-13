# Régénère la liste des fichiers mis en cache hors ligne (sw.js) et change la version
# pour que les tablettes récupèrent la mise à jour à la prochaine connexion.
# Usage : powershell -ExecutionPolicy Bypass -File tools\maj-hors-ligne.ps1
$root = Split-Path -Parent $PSScriptRoot
$utf8 = New-Object System.Text.UTF8Encoding($false)
$dirs = 'css', 'js', 'vendor', 'icons'
$files = @('./', './index.html', './manifest.webmanifest')
foreach ($d in $dirs) {
  Get-ChildItem -Path (Join-Path $root $d) -Recurse -File |
    Where-Object { $_.FullName -notmatch '\\_archive\\' -and $_.Name -ne 'LICENSE' } |
    ForEach-Object { $files += './' + $_.FullName.Substring($root.Length + 1).Replace('\', '/') }
}
$version = Get-Date -Format 'yyyyMMdd-HHmmss'
$list = ($files | ForEach-Object { "  '$_'" }) -join ",`n"
$block = "// <auto>`nconst VERSION = '$version';`nconst PRECACHE = [`n$list`n];`n// </auto>"
$swPath = Join-Path $root 'sw.js'
$sw = [System.IO.File]::ReadAllText($swPath, $utf8)
$sw = [regex]::Replace($sw, '(?s)// <auto>.*?// </auto>', { param($m) $block })
[System.IO.File]::WriteAllText($swPath, $sw, $utf8)
Write-Output "sw.js mis à jour : $($files.Count) fichiers, version $version"
