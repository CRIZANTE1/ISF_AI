# Script para configurar JAVA_HOME e PATH

# Caminho do Java do Android Studio (padrão)
$javaHome = "C:\Program Files\Android\Android Studio\jbr"

# Se o caminho padrão não existir, tentar outros locais comuns
if (-not (Test-Path $javaHome)) {
    $alternatives = @(
        "C:\Program Files\Java\jdk-17",
        "C:\Program Files\Java\jdk-21",
        "$env:LOCALAPPDATA\Android\Sdk\jdk"
    )
    
    foreach ($alt in $alternatives) {
        if (Test-Path $alt) {
            $javaHome = $alt
            break
        }
    }
}
$javaBin = "$javaHome\bin"

# Configurar JAVA_HOME
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', $javaHome, [System.EnvironmentVariableTarget]::User)
Write-Host "✅ JAVA_HOME configurado: $javaHome" -ForegroundColor Green

# Obter PATH atual do usuário
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', [System.EnvironmentVariableTarget]::User)

# Verificar se já está no PATH
if ($currentPath -like "*%JAVA_HOME%\bin*" -or $currentPath -like "*$javaBin*") {
    Write-Host "✅ Java já está no PATH" -ForegroundColor Yellow
} else {
    # Adicionar ao PATH
    $newPath = $currentPath + ";%JAVA_HOME%\bin"
    [System.Environment]::SetEnvironmentVariable('Path', $newPath, [System.EnvironmentVariableTarget]::User)
    Write-Host "✅ Java adicionado ao PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "⚠️  IMPORTANTE: Feche e reabra o PowerShell/Terminal para as mudanças terem efeito!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para verificar, execute:" -ForegroundColor Cyan
Write-Host "  echo `$env:JAVA_HOME" -ForegroundColor Gray
Write-Host "  java -version" -ForegroundColor Gray

