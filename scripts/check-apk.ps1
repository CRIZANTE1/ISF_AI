# Script para verificar se o APK foi gerado
$apkPath = "android\app\build\outputs\apk\release\app-release.apk"
$unsignedApkPath = "android\app\build\outputs\apk\release\app-release-unsigned.apk"

$apkFile = $null
if (Test-Path $apkPath) {
    $apkFile = Get-Item $apkPath
} elseif (Test-Path $unsignedApkPath) {
    $apkFile = Get-Item $unsignedApkPath
}

if ($apkFile) {
    $sizeMB = [math]::Round($apkFile.Length / 1MB, 2)
    
    Write-Host "APK gerado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Localizacao: $($apkFile.FullName)" -ForegroundColor Cyan
    Write-Host "Tamanho: $sizeMB MB" -ForegroundColor Yellow
    Write-Host "Data: $($apkFile.LastWriteTime)" -ForegroundColor Gray
    
    if ($apkFile.Name -like "*unsigned*") {
        Write-Host ""
        Write-Host "Nota: APK sem assinatura (unsigned)" -ForegroundColor Yellow
        Write-Host "Para publicar na Play Store, voce precisa assinar o APK." -ForegroundColor Yellow
        Write-Host "Consulte: docs/PUBLICAR_GOOGLE_PLAY.md" -ForegroundColor Gray
    }
} else {
    Write-Host "APK nao encontrado!" -ForegroundColor Red
}

