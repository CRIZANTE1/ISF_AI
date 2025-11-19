#!/bin/bash
# Script para preparar APK para release no GitHub
# Uso: ./scripts/prepare-apk-release.sh

echo "🚀 Preparando APK para GitHub Release..."
echo ""

# Caminho do APK
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

# Verificar se o APK já existe
if [ -f "$APK_PATH" ]; then
    FILE_SIZE=$(du -h "$APK_PATH" | cut -f1)
    FILE_DATE=$(stat -f "%Sm" "$APK_PATH" 2>/dev/null || stat -c "%y" "$APK_PATH" 2>/dev/null)
    
    echo "✅ APK encontrado!"
    echo "   Caminho: $APK_PATH"
    echo "   Tamanho: $FILE_SIZE"
    echo "   Data: $FILE_DATE"
    echo ""
    
    read -p "Deseja gerar um novo APK? (s/N): " regenerate
    if [ "$regenerate" = "s" ] || [ "$regenerate" = "S" ]; then
        echo ""
        echo "🔨 Gerando novo APK..."
        npm run android:build:apk
        
        if [ $? -ne 0 ]; then
            echo "❌ Erro ao gerar APK!"
            exit 1
        fi
        
        FILE_SIZE=$(du -h "$APK_PATH" | cut -f1)
        echo "✅ Novo APK gerado!"
        echo "   Tamanho: $FILE_SIZE"
    fi
else
    echo "📦 APK não encontrado. Gerando..."
    echo ""
    
    npm run android:build:apk
    
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao gerar APK!"
        exit 1
    fi
    
    if [ ! -f "$APK_PATH" ]; then
        echo "❌ APK não foi gerado em $APK_PATH"
        echo "   Verifique os erros acima."
        exit 1
    fi
    
    FILE_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo "✅ APK gerado com sucesso!"
    echo "   Tamanho: $FILE_SIZE"
fi

echo ""
echo "============================================================"
echo "📋 PRÓXIMOS PASSOS:"
echo "============================================================"
echo ""
echo "1. Acesse seu repositório no GitHub"
echo "2. Vá em 'Releases' → 'Create a new release'"
echo "3. Crie uma tag (ex: v1.0.0)"
echo "4. Faça upload do arquivo:"
echo "   $APK_PATH"
echo "5. Publique a release"
echo "6. Copie o link direto do APK"
echo "7. Gere um QR code com o link"
echo ""
echo "📖 Para mais detalhes, consulte:"
echo "   docs/HOSPEDAR_APK_GITHUB.md"
echo ""
echo "✅ Concluído!"

