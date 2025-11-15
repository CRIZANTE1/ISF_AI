# Script para compilar o projeto Android
Write-Host "🚀 Iniciando compilação para Android..." -ForegroundColor Green

# Passo 1: Build da aplicação web
Write-Host "`n📦 Passo 1: Fazendo build da aplicação web..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao fazer build da aplicação!" -ForegroundColor Red
    exit 1
}

# Passo 2: Verificar se a pasta android existe
Write-Host "`n🔍 Passo 2: Verificando se a plataforma Android já foi adicionada..." -ForegroundColor Yellow
if (-not (Test-Path "android")) {
    Write-Host "📱 Adicionando plataforma Android..." -ForegroundColor Yellow
    npx cap add android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao adicionar plataforma Android!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Plataforma Android já existe!" -ForegroundColor Green
}

# Passo 3: Sincronizar o build
Write-Host "`n🔄 Passo 3: Sincronizando build com projeto Android..." -ForegroundColor Yellow
npm run cap:sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao sincronizar!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Compilação concluída com sucesso!" -ForegroundColor Green
Write-Host "`n📱 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Execute: npm run cap:open" -ForegroundColor White
Write-Host "   2. Ou abra a pasta 'android' no Android Studio" -ForegroundColor White
Write-Host "   3. No Android Studio, clique em 'Run' para compilar e instalar o app" -ForegroundColor White

