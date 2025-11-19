# 📦 Guia: Hospedar APK no GitHub Releases

## 📋 Resumo

Este guia explica passo a passo como hospedar o APK do app **ISF IA** no GitHub Releases de forma **gratuita e ilimitada**, permitindo que usuários baixem o app através de um QR code antes da publicação na App Store.

## 🎯 Informações do App

- **Nome do App**: ISF IA
- **Package Name**: `com.isfia.app`
- **Arquivo APK**: `android/app/build/outputs/apk/release/app-release.apk`

## ✅ Vantagens do GitHub Releases

- ✅ **Totalmente gratuito** e ilimitado
- ✅ **Link direto** para download do APK
- ✅ **Histórico de versões** organizado
- ✅ **HTTPS automático** (seguro)
- ✅ **Sem necessidade de servidor próprio**
- ✅ **Fácil de compartilhar** via QR code

## 📋 Pré-requisitos

1. ✅ Conta no GitHub (crie em: https://github.com/signup)
2. ✅ Repositório criado no GitHub (pode ser privado ou público)
3. ✅ Node.js e npm instalados
4. ✅ Projeto configurado e build funcionando

---

## 🚀 Passo 1: Preparar o Repositório GitHub

### 1.1 Criar Repositório (se ainda não tiver)

1. Acesse: https://github.com/new
2. Preencha:
   - **Repository name**: `isfia-app` (ou o nome que preferir)
   - **Description**: "ISF IA - App Mobile"
   - **Visibility**: Público ou Privado (ambos funcionam)
3. Clique em **"Create repository"**

### 1.2 Conectar Repositório Local (se ainda não conectou)

Se o projeto ainda não está conectado ao GitHub:

```bash
# Inicializar git (se ainda não foi feito)
git init

# Adicionar remote do GitHub
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git

# Fazer commit inicial (se necessário)
git add .
git commit -m "Initial commit"

# Enviar para GitHub
git push -u origin main
```

**Nota**: Substitua `SEU-USUARIO` e `SEU-REPOSITORIO` pelos seus dados reais.

---

## 🔨 Passo 2: Gerar o APK

### 2.1 Verificar Build do Projeto

Certifique-se de que o projeto está buildado:

```bash
# Na raiz do projeto
npm run build
```

### 2.2 Sincronizar Capacitor

```bash
npm run cap:sync
```

### 2.3 Gerar APK de Release

```bash
npm run android:build:apk
```

Este comando irá:
1. Fazer build da aplicação web
2. Sincronizar com o projeto Android
3. Gerar o APK assinado

### 2.4 Verificar APK Gerado

O APK será gerado em:
```
android/app/build/outputs/apk/release/app-release.apk
```

**Verifique se o arquivo existe:**
- Windows: `dir android\app\build\outputs\apk\release\app-release.apk`
- Linux/Mac: `ls android/app/build/outputs/apk/release/app-release.apk`

**Tamanho esperado**: Geralmente entre 5-50 MB (depende do app)

---

## 📤 Passo 3: Criar Release no GitHub

### 3.1 Acessar a Página de Releases

1. Vá para o seu repositório no GitHub
2. Clique na aba **"Releases"** (no menu superior direito)
3. Clique em **"Create a new release"** ou **"Draft a new release"**

### 3.2 Preencher Informações da Release

Preencha os campos:

#### Tag Version
- Clique em **"Choose tag"** → **"Create new tag"**
- Digite: `v1.0.0` (ou a versão desejada)
- **Formato recomendado**: `v1.0.0`, `v1.0.1`, `v2.0.0`, etc.

#### Release Title
- Digite: `ISF IA v1.0.0` (ou a versão correspondente)

#### Description (Opcional)
Você pode adicionar uma descrição:

```markdown
## 🎉 ISF IA v1.0.0

### Novidades
- Versão inicial do app
- Funcionalidades principais implementadas

### Como Instalar
1. Baixe o arquivo APK abaixo
2. Abra o arquivo no seu dispositivo Android
3. Permita instalação de fontes desconhecidas se solicitado
4. Siga as instruções de instalação
```

### 3.3 Fazer Upload do APK

1. Role a página até a seção **"Attach binaries"**
2. Clique em **"selecting them"** ou arraste o arquivo
3. Navegue até: `android/app/build/outputs/apk/release/app-release.apk`
4. Selecione o arquivo e aguarde o upload

**⏱️ Tempo de upload**: Depende do tamanho do APK e sua conexão (geralmente 1-5 minutos)

### 3.4 Publicar a Release

1. Verifique se todas as informações estão corretas
2. Clique em **"Publish release"** (botão verde no final da página)

**✅ Pronto!** A release foi criada e o APK está disponível.

---

## 🔗 Passo 4: Obter Link Direto do APK

### 4.1 Acessar o Arquivo na Release

1. Após publicar, você será redirecionado para a página da release
2. Na seção **"Assets"**, você verá o arquivo `app-release.apk`
3. **Clique com o botão direito** no arquivo `app-release.apk`
4. Selecione **"Copy link address"** ou **"Copiar endereço do link"**

### 4.2 Formato do Link

O link terá o formato:
```
https://github.com/SEU-USUARIO/SEU-REPOSITORIO/releases/download/v1.0.0/app-release.apk
```

**Exemplo real:**
```
https://github.com/joaosilva/isfia-app/releases/download/v1.0.0/app-release.apk
```

### 4.3 Testar o Link

1. Abra uma janela anônima do navegador
2. Cole o link na barra de endereços
3. O download do APK deve começar automaticamente

**✅ Se o download funcionar, o link está correto!**

---

## 📱 Passo 5: Gerar QR Code

### 5.1 Escolher Gerador de QR Code

Opções gratuitas recomendadas:

1. **QR Code Generator**: https://www.qr-code-generator.com/
2. **QRCode Monkey**: https://www.qrcode-monkey.com/
3. **QR Code API**: https://api.qrserver.com/v1/create-qr-code/

### 5.2 Gerar o QR Code

#### Opção A: QR Code Generator (Recomendado)

1. Acesse: https://www.qr-code-generator.com/
2. Na seção **"URL"**, cole o link do APK:
   ```
   https://github.com/SEU-USUARIO/SEU-REPOSITORIO/releases/download/v1.0.0/app-release.apk
   ```
3. Clique em **"Create QR Code"**
4. Clique em **"Download"** para baixar a imagem
5. Escolha o formato: **PNG** (recomendado) ou **SVG**

#### Opção B: QRCode Monkey

1. Acesse: https://www.qrcode-monkey.com/
2. Selecione **"URL"** no menu
3. Cole o link do APK
4. Personalize (opcional): cores, logo, etc.
5. Clique em **"Create QR Code"**
6. Clique em **"Download PNG"** ou **"Download SVG"**

#### Opção C: Via API (Programático)

Você pode gerar QR codes via URL:

```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=SEU_LINK_AQUI
```

**Exemplo:**
```
https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https://github.com/joaosilva/isfia-app/releases/download/v1.0.0/app-release.apk
```

### 5.3 Testar o QR Code

1. Abra o app de câmera do seu celular
2. Aponte para o QR code gerado
3. O link deve aparecer na tela
4. Toque no link para verificar se abre corretamente

---

## 📲 Passo 6: Compartilhar o QR Code

### 6.1 Opções de Compartilhamento

Você pode compartilhar o QR code de várias formas:

1. **Imprimir**: Imprima o QR code em papel ou cartão
2. **Email**: Envie por email com instruções
3. **WhatsApp/Telegram**: Envie a imagem do QR code
4. **Site/Web**: Publique em uma página web
5. **Apresentação**: Inclua em slides ou documentos

### 6.2 Instruções para Usuários

Forneça estas instruções aos usuários:

```
📱 Como Instalar o ISF IA

1. Abra a câmera do seu celular Android
2. Aponte para o QR code abaixo
3. Toque no link que aparecer
4. O download do APK começará automaticamente
5. Após o download, abra o arquivo
6. Se aparecer "Bloqueado pelo Play Protect":
   - Toque em "Mais detalhes"
   - Toque em "Instalar mesmo assim"
7. Permita a instalação de apps de fontes desconhecidas se solicitado
8. Siga as instruções de instalação
9. Pronto! O app estará instalado

⚠️ Nota: Este app ainda não está na Play Store, por isso é necessário permitir instalação de fontes desconhecidas.
```

---

## 🔄 Passo 7: Atualizar para Nova Versão

Quando precisar atualizar o app:

### 7.1 Gerar Novo APK

```bash
# Atualizar versão no build.gradle primeiro (se necessário)
npm run android:build:apk
```

### 7.2 Criar Nova Release

1. Vá para **"Releases"** → **"Create a new release"**
2. Crie uma nova tag: `v1.0.1` (incremente a versão)
3. Faça upload do novo APK
4. Publique a release

### 7.3 Atualizar QR Code

1. Obtenha o novo link da release
2. Gere um novo QR code com o link atualizado
3. Compartilhe o novo QR code

**💡 Dica**: Mantenha um histórico de versões no GitHub para facilitar o controle.

---

## ⚠️ Problemas Comuns e Soluções

### Problema: "APK não encontrado"

**Solução:**
```bash
# Verifique se o build foi executado
npm run build
npm run cap:sync
npm run android:build:apk

# Verifique o caminho
ls android/app/build/outputs/apk/release/
```

### Problema: "Link não funciona / 404"

**Solução:**
- Verifique se a release foi publicada (não está como draft)
- Verifique se o nome do arquivo está correto no link
- Verifique se a tag da versão está correta

### Problema: "Download bloqueado pelo navegador"

**Solução:**
- Alguns navegadores bloqueiam downloads diretos
- Use o link em um dispositivo Android ou compartilhe via QR code
- O download funciona melhor quando acessado diretamente do celular

### Problema: "Play Protect bloqueia a instalação"

**Solução:**
- Isso é normal para apps não publicados na Play Store
- Instrua os usuários a:
  1. Toque em "Mais detalhes"
  2. Toque em "Instalar mesmo assim"
  3. Permita instalação de fontes desconhecidas nas configurações do Android

### Problema: "QR code não funciona"

**Solução:**
- Verifique se o link está correto no QR code
- Teste o link diretamente no navegador primeiro
- Use um gerador de QR code diferente
- Certifique-se de que a imagem do QR code está nítida

---

## 📊 Checklist Final

Antes de compartilhar, confirme:

- [ ] APK gerado com sucesso (`app-release.apk` existe)
- [ ] Release criada no GitHub
- [ ] APK anexado à release
- [ ] Release publicada (não está como draft)
- [ ] Link direto testado e funcionando
- [ ] QR code gerado
- [ ] QR code testado com celular
- [ ] Instruções de instalação preparadas
- [ ] QR code compartilhado com usuários

---

## 🎉 Pronto!

Agora você tem:

✅ APK hospedado gratuitamente no GitHub  
✅ Link direto para download  
✅ QR code para compartilhamento fácil  
✅ Sistema de versionamento organizado  

**Seu app está pronto para ser distribuído antes da publicação na App Store!**

---

## 📚 Recursos Adicionais

- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [QR Code Generator](https://www.qr-code-generator.com/)
- [Android APK Installation Guide](https://support.google.com/android/answer/7164335)

---

**Última atualização**: 2024  
**Versão do guia**: 1.0

