# Builds the Microsoft Store package: desktop\build\PlexaDB.msix
# Run from the repository root:  powershell -ExecutionPolicy Bypass -File desktop\build.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$build = Join-Path $PSScriptRoot "build"
$layout = Join-Path $build "layout"
Set-Location $root

Write-Host "1/6 Web client"
npm run build | Out-Null

Write-Host "2/6 Gateway (PyInstaller)"
Push-Location gateway
.\.venv\Scripts\python -m PyInstaller plexa-gateway.spec --noconfirm --log-level WARN --distpath "$build\dist" --workpath "$build\work"
Pop-Location

Write-Host "3/6 Java runtime for IBM i (jlink)"
$jre = Join-Path $build "jre"
if (-not (Test-Path $jre)) {
    $jlink = Join-Path $env:JAVA_HOME "bin\jlink.exe"
    & $jlink --add-modules java.base,java.desktop,java.sql,java.naming,java.logging,java.management,java.xml,java.security.sasl,java.security.jgss,jdk.crypto.ec,jdk.crypto.cryptoki,jdk.charsets,jdk.zipfs `
        --strip-debug --no-header-files --no-man-pages --compress=2 --output $jre
}

Write-Host "4/6 Desktop shell"
dotnet publish desktop\PlexaDesktop -c Release -r win-x64 --self-contained true -o "$build\shell" --nologo -v q

Write-Host "5/6 Package layout"
if (Test-Path $layout) { Remove-Item $layout -Recurse -Force }
New-Item -ItemType Directory $layout | Out-Null
Copy-Item "$build\shell\*" $layout -Recurse
Copy-Item "$build\dist\plexa-gateway" "$layout\gateway" -Recurse
Copy-Item $jre "$layout\jre" -Recurse
Copy-Item dist "$layout\web" -Recurse
New-Item -ItemType Directory "$layout\gateway-lib" | Out-Null
Copy-Item gateway\lib\jt400.jar "$layout\gateway-lib\"
Copy-Item desktop\AppxManifest.xml $layout
Copy-Item desktop\Assets "$layout\Assets" -Recurse

Write-Host "6/6 MSIX"
$pkgDir = Join-Path $build "sdk"
if (-not (Test-Path $pkgDir)) {
    New-Item -ItemType Directory $pkgDir | Out-Null
    Invoke-WebRequest "https://www.nuget.org/api/v2/package/Microsoft.Windows.SDK.BuildTools/10.0.26100.1742" -OutFile "$pkgDir\tools.zip"
    Expand-Archive "$pkgDir\tools.zip" "$pkgDir\tools"
}
$makeappx = Get-ChildItem "$pkgDir\tools\bin" -Recurse -Filter makeappx.exe | Where-Object { $_.FullName -match "x64" } | Select-Object -First 1
& $makeappx.FullName pack /d $layout /p "$build\PlexaDB.msix" /o
if ($LASTEXITCODE -ne 0) { throw "makeappx failed" }
Write-Host "OK: $build\PlexaDB.msix"
