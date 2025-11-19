# Scripts Auxiliares

## 📦 prepare-apk-release

Scripts para facilitar a preparação do APK para publicação no GitHub Releases.

### Windows (PowerShell)

```bash
npm run prepare:release:win
```

Ou execute diretamente:

```powershell
.\scripts\prepare-apk-release.ps1
```

### Linux/Mac (Bash)

```bash
chmod +x scripts/prepare-apk-release.sh
./scripts/prepare-apk-release.sh
```

### O que o script faz:

1. ✅ Verifica se o APK já existe
2. ✅ Pergunta se deseja gerar um novo APK
3. ✅ Gera o APK se necessário (`npm run android:build:apk`)
4. ✅ Mostra informações do APK (tamanho, data)
5. ✅ Fornece instruções dos próximos passos
6. ✅ Opção de abrir a pasta do APK

### Documentação Completa

Para instruções detalhadas sobre como hospedar o APK no GitHub, consulte:

📖 `docs/HOSPEDAR_APK_GITHUB.md`

