# Update test files namespaces
$testDir = "d:\Github\Cayeshni\backend\Cayeshni.Tests"

function Update-TestNamespaces {
    param([string]$content)
    
    $content = $content -replace "using Cayeshni\.Domain", "using Cayeshni.API.Domain"
    $content = $content -replace "using Cayeshni\.Application", "using Cayeshni.API.Application"
    $content = $content -replace "using Cayeshni\.Infrastructure", "using Cayeshni.API.Infrastructure"
    
    return $content
}

Get-ChildItem -Path $testDir -Filter "*.cs" -Recurse | ForEach-Object {
    if ($_.FullName -notmatch "\\obj\\") {
        $content = Get-Content -Path $_.FullName -Raw
        $updated = Update-TestNamespaces $content
        
        if ($updated -ne $content) {
            $updated | Out-File -FilePath $_.FullName -Encoding UTF8
            Write-Host "Updated: $($_.Name)"
        }
    }
}

Write-Host "Test files updated successfully"
