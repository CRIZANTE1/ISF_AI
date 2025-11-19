# Script para configurar JAVA_HOME na sessão atual
$javaHome = "C:\Program Files\Android\Android Studio\jbr"
$env:JAVA_HOME = $javaHome
$env:Path = "$env:Path;$javaHome\bin"

Write-Host "✅ JAVA_HOME configurado para esta sessão: $env:JAVA_HOME" -ForegroundColor Green
Write-Host ""
Write-Host "Verificando Java..." -ForegroundColor Cyan
java -version

