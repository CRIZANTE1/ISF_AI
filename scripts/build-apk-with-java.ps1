# Script para build do APK com JAVA_HOME configurado
$javaHome = "C:\Program Files\Android\Android Studio\jbr"

# Configurar JAVA_HOME para esta sessao
$env:JAVA_HOME = $javaHome
$env:Path = "$env:Path;$javaHome\bin"

Write-Host "JAVA_HOME configurado: $env:JAVA_HOME" -ForegroundColor Green
Write-Host ""

# Executar o build
Write-Host "Iniciando build do APK..." -ForegroundColor Cyan
npm run build
npm run cap:sync

# Navegar para android e executar gradlew
cd android

# Verificar se foi passado um argumento (assembleRelease ou bundleRelease)
$gradleTask = $args[0]
if (-not $gradleTask) {
    $gradleTask = "assembleRelease"
}

Write-Host "Executando gradlew.bat $gradleTask" -ForegroundColor Yellow
& .\gradlew.bat $gradleTask
