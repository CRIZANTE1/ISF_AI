# Script para preparar APK para release no GitHub
# Uso: .\scripts\prepare-apk-release.ps1

Write-Host "🚀 Preparando APK para GitHub Release..." -ForegroundColor Cyan
Write-Host ""

# Caminho do APK
$APK_PATH = "android/app/build/outputs/apk/release/app-release.apk"

# Verificar se o APK já existe
if (Test-Path $APK_PATH) {
    $fileInfo = Get-Item $APK_PATH
    $fileSize = [math]::Round($fileInfo.Length / 1MB, 2)
    Write-Host "✅ APK encontrado!" -ForegroundColor Green
    Write-Host "   Caminho: $APK_PATH" -ForegroundColor Gray
    Write-Host "   Tamanho: $fileSize MB" -ForegroundColor Gray
    Write-Host "   Data: $($fileInfo.LastWriteTime)" -ForegroundColor Gray
    Write-Host ""
    
    $regenerate = Read-Host "Deseja gerar um novo APK? (s/N)"
    if ($regenerate -eq "s" -or $regenerate -eq "S") {
        Write-Host ""
        Write-Host "🔨 Gerando novo APK..." -ForegroundColor Yellow
        npm run android:build:apk
        
        if (-not $?) {
            Write-Host "❌ Erro ao gerar APK!" -ForegroundColor Red
            exit 1
        }
        
        $fileInfo = Get-Item $APK_PATH
        $fileSize = [math]::Round($fileInfo.Length / 1MB, 2)
        Write-Host "✅ Novo APK gerado!" -ForegroundColor Green
        Write-Host "   Tamanho: $fileSize MB" -ForegroundColor Gray
    }
} else {
    Write-Host "📦 APK não encontrado. Gerando..." -ForegroundColor Yellow
    Write-Host ""
    
    npm run android:build:apk
    
    if (-not $?) {
        Write-Host "❌ Erro ao gerar APK!" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Test-Path $APK_PATH)) {
        Write-Host "❌ APK não foi gerado em $APK_PATH" -ForegroundColor Red
        Write-Host "   Verifique os erros acima." -ForegroundColor Yellow
        exit 1
    }
    
    $fileInfo = Get-Item $APK_PATH
    $fileSize = [math]::Round($fileInfo.Length / 1MB, 2)
    Write-Host "✅ APK gerado com sucesso!" -ForegroundColor Green
    Write-Host "   Tamanho: $fileSize MB" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Acesse seu repositório no GitHub" -ForegroundColor White
Write-Host "2. Vá em 'Releases' → 'Create a new release'" -ForegroundColor White
Write-Host "3. Crie uma tag (ex: v1.0.0)" -ForegroundColor White
Write-Host "4. Faça upload do arquivo:" -ForegroundColor White
Write-Host "   $APK_PATH" -ForegroundColor Gray
Write-Host "5. Publique a release" -ForegroundColor White
Write-Host "6. Copie o link direto do APK" -ForegroundColor White
Write-Host "7. Gere um QR code com o link" -ForegroundColor White
Write-Host ""
Write-Host "📖 Para mais detalhes, consulte:" -ForegroundColor Cyan
Write-Host "   docs/HOSPEDAR_APK_GITHUB.md" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Dica: Você pode copiar o caminho do APK acima e colar" -ForegroundColor Yellow
Write-Host "   diretamente no upload do GitHub!" -ForegroundColor Yellow
Write-Host ""

# Tentar abrir o explorador de arquivos na pasta do APK
$openFolder = Read-Host "Deseja abrir a pasta do APK? (s/N)"
if ($openFolder -eq "s" -or $openFolder -eq "S") {
    $folderPath = Split-Path -Parent $APK_PATH
    Invoke-Item $folderPath
}

Write-Host "✅ Concluído!" -ForegroundColor Green

