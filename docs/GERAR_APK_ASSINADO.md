# 🔐 Guia: Gerar APK Assinado

## 📋 Resumo

Este guia explica como gerar um APK assinado usando o keystore `isfia-key` configurado no projeto.

## ✅ Pré-requisitos

- ✅ Keystore `isfia-key` localizado em `android/app/isfia-key`
- ✅ Senha do keystore
- ✅ JAVA_HOME configurado

## 🔑 Passo 1: Configurar Senhas do Keystore

Antes de gerar o APK assinado, você precisa configurar as senhas do keystore.

### No PowerShell (Windows):

```powershell
# Configure a senha do keystore
$env:KEYSTORE_PASSWORD="sua_senha_aqui"

# Configure a senha da chave (geralmente é a mesma)
$env:KEY_PASSWORD="sua_senha_aqui"
```

**⚠️ IMPORTANTE**: 
- Essas variáveis são válidas apenas para a sessão atual do PowerShell
- Se fechar o terminal, precisará configurar novamente
- Para configurar permanentemente, use o método abaixo

### Configurar Permanentemente (Opcional):

1. Pressione `Win + R`, digite `sysdm.cpl` e pressione Enter
2. Vá na aba "Avançado" → "Variáveis de Ambiente"
3. Em "Variáveis do usuário", clique em "Novo"
4. Adicione:
   - Nome: `KEYSTORE_PASSWORD`
   - Valor: `sua_senha_aqui`
5. Repita para `KEY_PASSWORD` (se diferente)

**⚠️ SEGURANÇA**: Não commite as senhas no código! Use variáveis de ambiente.

## 🚀 Passo 2: Gerar APK Assinado

### Método 1: Usando o Script (Recomendado)

```bash
npm run android:build:apk:signed
```

Este script irá:
1. ✅ Verificar se o keystore existe
2. ✅ Configurar JAVA_HOME automaticamente
3. ✅ Fazer build da aplicação
4. ✅ Sincronizar com Capacitor
5. ✅ Gerar APK assinado

### Método 2: Manual

```bash
# 1. Configurar senhas (se ainda não configurou)
$env:KEYSTORE_PASSWORD="sua_senha"
$env:KEY_PASSWORD="sua_senha"

# 2. Gerar APK
npm run android:build:apk
```

## 📍 Localização do APK Assinado

O APK assinado será gerado em:

```
android/app/build/outputs/apk/release/app-release.apk
```

**Diferença:**
- ✅ **APK assinado**: `app-release.apk` (pronto para publicação)
- ⚠️ **APK não assinado**: `app-release-unsigned.apk` (apenas para testes)

## ✅ Verificar APK Assinado

Após gerar, você pode verificar se o APK está assinado:

```powershell
# Verificar informações do APK
powershell -ExecutionPolicy Bypass -File ./scripts/check-apk.ps1
```

Ou use o comando `jarsigner` (se tiver o JDK no PATH):

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/apk/release/app-release.apk
```

## ⚠️ Problemas Comuns

### Erro: "Keystore não encontrado"

**Solução:**
- Verifique se o arquivo `android/app/isfia-key` existe
- Verifique se o caminho está correto

### Erro: "Senha incorreta"

**Solução:**
- Verifique se `KEYSTORE_PASSWORD` está configurado corretamente
- Verifique se `KEY_PASSWORD` está configurado (pode ser a mesma senha)
- Certifique-se de que as variáveis de ambiente estão definidas na mesma sessão

### APK gerado sem assinatura

**Possíveis causas:**
1. Senhas não configuradas
2. Keystore não encontrado
3. Erro na configuração do build.gradle

**Solução:**
- Verifique as variáveis de ambiente: `echo $env:KEYSTORE_PASSWORD`
- Verifique se o keystore existe: `Test-Path android\app\isfia-key`
- Revise o `android/app/build.gradle`

## 📝 Scripts Disponíveis

- `npm run android:build:apk` - Gera APK (não assinado)
- `npm run android:build:apk:signed` - Gera APK assinado
- `npm run android:build:release` - Gera AAB para Play Store

## 🔒 Segurança

- ✅ **NUNCA** commite o keystore no Git
- ✅ **NUNCA** commite senhas no código
- ✅ Use variáveis de ambiente para senhas
- ✅ Mantenha backup seguro do keystore
- ✅ Guarde as senhas em local seguro

## 📚 Referências

- [Documentação Android - App Signing](https://developer.android.com/studio/publish/app-signing)
- [Guia: Publicar no Google Play](./PUBLICAR_GOOGLE_PLAY.md)
- [Guia: Hospedar APK no GitHub](./HOSPEDAR_APK_GITHUB.md)

---

**Última atualização**: 2024

