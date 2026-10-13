param([string]$Script = 'adobe-smoke.jsx')
$ErrorActionPreference = 'Stop'
$testPath = Join-Path $PSScriptRoot $Script
if (-not (Test-Path -LiteralPath $testPath)) { throw "Missing script: $testPath" }
$testPath = (Resolve-Path -LiteralPath $testPath).Path.Replace('\', '/').Replace("'", "\'")
$indesignTest = New-Object -ComObject InDesign.Application.2026
$testResult = $indesignTest.DoScript("(function(){try{return `$.evalFile(new File('$testPath'));}catch(e){return 'ERROR: '+String(e)+' line '+e.line;}})();", 1246973031)
Write-Output $testResult
if ($testResult.StartsWith('ERROR:')) { throw $testResult }
$parsedResult = $testResult | ConvertFrom-Json
if (-not $parsedResult.ok) { throw "Adobe test failed. Results: $($parsedResult.path) $($parsedResult.error)" }
