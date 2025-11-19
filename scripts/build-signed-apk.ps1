# Script para gerar APK assinado
$javaHome = "C:\Program Files\Android\Android Studio\jbr"

# Configurar JAVA_HOME para esta sessao
$env:JAVA_HOME = $javaHome
$env:Path = "$env:Path;$javaHome\bin"

Write-Host "JAVA_HOME configurado: $env:JAVA_HOME" -ForegroundColor Green
Write-Host ""

# Verificar se o keystore existe
$keystorePath = "android\app\isfia-key"
if (-not (Test-Path $keystorePath)) {
    Write-Host "ERRO: Keystore nao encontrado em $keystorePath" -ForegroundColor Red
    Write-Host "Por favor, verifique se o arquivo de keystore existe." -ForegroundColor Yellow
    exit 1
}

Write-Host "Keystore encontrado: $keystorePath" -ForegroundColor Green
Write-Host ""

# Verificar se as senhas foram configuradas
if (-not $env:KEYSTORE_PASSWORD) {
    Write-Host "AVISO: KEYSTORE_PASSWORD nao configurado!" -ForegroundColor Yellow
    Write-Host "Configure a senha do keystore antes de continuar:" -ForegroundColor Yellow
    Write-Host '  $env:KEYSTORE_PASSWORD="sua_senha"' -ForegroundColor Cyan
    Write-Host '  $env:KEY_PASSWORD="sua_senha"' -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Deseja continuar mesmo assim? (s/N)"
    if ($continue -ne "s" -and $continue -ne "S") {
        exit 1
    }
}

# Executar o build
Write-Host "Iniciando build do APK assinado..." -ForegroundColor Cyan
npm run build
npm run cap:sync

# Navegar para android e executar gradlew
cd android

Write-Host "Executando gradlew.bat assembleRelease" -ForegroundColor Yellow
& .\gradlew.bat assembleRelease

# Verificar se o APK foi gerado
cd ..
$apkPath = "android\app\build\outputs\apk\release\app-release.apk"
$unsignedApkPath = "android\app\build\outputs\apk\release\app-release-unsigned.apk"

if (Test-Path $apkPath) {
    $file = Get-Item $apkPath
    $sizeMB = [math]::Round($file.Length / 1MB, 2)
    Write-Host ""
    Write-Host "APK ASSINADO gerado com sucesso!" -ForegroundColor Green
    Write-Host "Localizacao: $($file.FullName)" -ForegroundColor Cyan
    Write-Host "Tamanho: $sizeMB MB" -ForegroundColor Yellow
} elseif (Test-Path $unsignedApkPath) {
    Write-Host ""
    Write-Host "AVISO: APK gerado sem assinatura!" -ForegroundColor Yellow
    Write-Host "Verifique se as senhas do keystore estao configuradas corretamente." -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "ERRO: APK nao encontrado!" -ForegroundColor Red
}

