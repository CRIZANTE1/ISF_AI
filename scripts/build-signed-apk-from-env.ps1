# Script para gerar APK assinado lendo senhas do .env
$javaHome = "C:\Program Files\Android\Android Studio\jbr"

# Configurar JAVA_HOME para esta sessao
$env:JAVA_HOME = $javaHome
$env:Path = "$env:Path;$javaHome\bin"

Write-Host "JAVA_HOME configurado: $env:JAVA_HOME" -ForegroundColor Green
Write-Host ""

# Ler senhas do arquivo .env
$envFile = ".env"
if (Test-Path $envFile) {
    Write-Host "Lendo senhas do arquivo .env..." -ForegroundColor Cyan
    $envContent = Get-Content $envFile
    
    foreach ($line in $envContent) {
        # Ignorar linhas vazias e comentarios
        if ($line -match '^\s*#' -or $line -match '^\s*$') {
            continue
        }
        
        # Procurar por KEYSTORE_PASSWORD e KEY_PASSWORD (suporta varios formatos)
        if ($line -match '^\s*KEYSTORE_PASSWORD\s*=\s*(.+)$') {
            $value = $matches[1].Trim()
            # Remover aspas se existirem
            if ($value -match '^["''](.+)["'']$') {
                $value = $matches[1]
            }
            $env:KEYSTORE_PASSWORD = $value
            Write-Host "KEYSTORE_PASSWORD configurado (tamanho: $($value.Length) caracteres)" -ForegroundColor Green
        }
        if ($line -match '^\s*KEY_PASSWORD\s*=\s*(.+)$') {
            $value = $matches[1].Trim()
            # Remover aspas se existirem
            if ($value -match '^["''](.+)["'']$') {
                $value = $matches[1]
            }
            $env:KEY_PASSWORD = $value
            Write-Host "KEY_PASSWORD configurado (tamanho: $($value.Length) caracteres)" -ForegroundColor Green
        }
    }
    
    # Se KEY_PASSWORD nao foi encontrado, usar KEYSTORE_PASSWORD
    if (-not $env:KEY_PASSWORD -and $env:KEYSTORE_PASSWORD) {
        $env:KEY_PASSWORD = $env:KEYSTORE_PASSWORD
        Write-Host "KEY_PASSWORD configurado (usando KEYSTORE_PASSWORD)" -ForegroundColor Yellow
    }
} else {
    Write-Host "AVISO: Arquivo .env nao encontrado!" -ForegroundColor Yellow
}

# Verificar se as senhas foram configuradas
if (-not $env:KEYSTORE_PASSWORD) {
    Write-Host ""
    Write-Host "ERRO: KEYSTORE_PASSWORD nao encontrado no arquivo .env!" -ForegroundColor Red
    Write-Host "Adicione no arquivo .env:" -ForegroundColor Yellow
    Write-Host "  KEYSTORE_PASSWORD=sua_senha" -ForegroundColor Cyan
    Write-Host "  KEY_PASSWORD=sua_senha" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "Senhas configuradas com sucesso!" -ForegroundColor Green
Write-Host ""

# Verificar se o keystore existe
$keystorePath = "android\app\isfia-key"
if (-not (Test-Path $keystorePath)) {
    Write-Host "ERRO: Keystore nao encontrado em $keystorePath" -ForegroundColor Red
    exit 1
}

Write-Host "Keystore encontrado: $keystorePath" -ForegroundColor Green
Write-Host ""

# Executar o build
Write-Host "Iniciando build do APK assinado..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Build falhou!" -ForegroundColor Red
    exit 1
}

npm run cap:sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Sync falhou!" -ForegroundColor Red
    exit 1
}

# Navegar para android e executar gradlew
cd android

Write-Host "Executando gradlew.bat assembleRelease" -ForegroundColor Yellow
& .\gradlew.bat assembleRelease

$buildSuccess = $LASTEXITCODE -eq 0

# Voltar para o diretorio raiz
cd ..

# Verificar se o APK foi gerado
$apkPath = "android\app\build\outputs\apk\release\app-release.apk"
$unsignedApkPath = "android\app\build\outputs\apk\release\app-release-unsigned.apk"

Write-Host ""
if (Test-Path $apkPath) {
    $file = Get-Item $apkPath
    $sizeMB = [math]::Round($file.Length / 1MB, 2)
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "APK ASSINADO gerado com sucesso!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Localizacao: $($file.FullName)" -ForegroundColor Cyan
    Write-Host "Tamanho: $sizeMB MB" -ForegroundColor Yellow
    Write-Host "Data: $($file.LastWriteTime)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "O APK esta pronto para publicacao!" -ForegroundColor Green
} elseif (Test-Path $unsignedApkPath) {
    Write-Host "AVISO: APK gerado sem assinatura!" -ForegroundColor Yellow
    Write-Host "Verifique se as senhas do keystore estao corretas no arquivo .env" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "ERRO: APK nao encontrado!" -ForegroundColor Red
    if (-not $buildSuccess) {
        Write-Host "O build pode ter falhado. Verifique os erros acima." -ForegroundColor Yellow
    }
    exit 1
}

