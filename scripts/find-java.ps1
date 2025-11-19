# Script para encontrar onde o Java está instalado
Write-Host "Procurando Java instalado..." -ForegroundColor Cyan
Write-Host ""

# Verificar se java está no PATH
try {
    $javaCmd = Get-Command java -ErrorAction Stop
    $javaPath = $javaCmd.Source
    $javaDir = Split-Path (Split-Path $javaPath)
    Write-Host "✅ Java encontrado no PATH:" -ForegroundColor Green
    Write-Host "   $javaPath" -ForegroundColor Gray
    Write-Host "   Diretório JDK: $javaDir" -ForegroundColor Gray
    Write-Host ""
    Write-Host "JAVA_HOME deve ser: $javaDir" -ForegroundColor Yellow
    exit 0
} catch {
    Write-Host "⚠️  Java não encontrado no PATH" -ForegroundColor Yellow
}

# Procurar em locais comuns
Write-Host ""
Write-Host "Procurando em locais comuns..." -ForegroundColor Cyan

$searchPaths = @(
    "C:\Program Files\Java",
    "C:\Program Files (x86)\Java",
    "$env:LOCALAPPDATA\Android\Sdk\jdk",
    "C:\Program Files\Android\Android Studio\jbr",
    "C:\Program Files\Eclipse Adoptium",
    "C:\Program Files\Microsoft",
    "$env:ProgramFiles\Java"
)

$found = $false
foreach ($path in $searchPaths) {
    if (Test-Path $path) {
        Write-Host "✅ Encontrado: $path" -ForegroundColor Green
        $dirs = Get-ChildItem $path -Directory -ErrorAction SilentlyContinue | Select-Object -First 5
        foreach ($dir in $dirs) {
            $javaExe = Join-Path $dir.FullName "bin\java.exe"
            if (Test-Path $javaExe) {
                Write-Host "   → $($dir.Name) (Java encontrado!)" -ForegroundColor Green
                Write-Host "   JAVA_HOME deve ser: $($dir.FullName)" -ForegroundColor Yellow
                $found = $true
            } else {
                Write-Host "   → $($dir.Name)" -ForegroundColor Gray
            }
        }
    }
}

if (-not $found) {
    Write-Host ""
    Write-Host "❌ Java não encontrado automaticamente." -ForegroundColor Red
    Write-Host "Por favor, verifique manualmente onde o Java está instalado." -ForegroundColor Yellow
}

