$ErrorActionPreference = 'Stop'
$projectDir = Split-Path -Parent $PSScriptRoot
$outputDir = Join-Path $projectDir 'dist'
$null = New-Item -ItemType Directory -Path $outputDir -Force
$outputPath = Join-Path $outputDir 'InDesignImageOptimizer.zip'
if (Test-Path -LiteralPath $outputPath) { throw "Package already exists: $outputPath" }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$files = @(
    foreach ($name in @('InDesignImageOptimizer.jsx','InDesignImageOptimizer.en.jsx','README.md','README.cs.md','CONTRIBUTING.md','CHANGELOG.md')) {
        Get-Item -LiteralPath (Join-Path $projectDir $name)
    }
    Get-ChildItem -LiteralPath (Join-Path $projectDir 'lib') -File -Recurse
    foreach ($name in @('ARCHITECTURE.md','API.md','TESTING.md','github-actions-tests.yml')) { Get-Item -LiteralPath (Join-Path $projectDir ('docs/' + $name)) }
    Get-ChildItem -LiteralPath (Join-Path $projectDir 'tests') -File
    Get-ChildItem -LiteralPath (Join-Path $projectDir 'scripts') -File
    Get-ChildItem -LiteralPath (Join-Path $projectDir 'locales') -File
)
$archive = [IO.Compression.ZipFile]::Open($outputPath, [IO.Compression.ZipArchiveMode]::Create)
try {
    foreach ($file in $files) {
        $relative = $file.FullName.Substring($projectDir.Length + 1).Replace('\', '/')
        $null = [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, "InDesignImageOptimizer/$relative")
    }
} finally { $archive.Dispose() }
Write-Output $outputPath
