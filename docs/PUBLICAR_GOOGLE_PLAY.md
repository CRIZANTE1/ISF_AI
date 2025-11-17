# 📱 Guia: Publicar App no Google Play Console

## 📋 Resumo

Este guia explica passo a passo como publicar o app **ISF IA** no Google Play Console, desde a preparação até a publicação.

## 🎯 Informações do App

- **Nome do App**: ISF IA
- **Package Name**: `com.isfia.app`
- **Versão Atual**: 1.0 (versionCode: 2)
- **Ícone Play Store**: `icons/android/play_store_512.png`

## 📋 Pré-requisitos

### 1. Conta Google Play Developer

- Acesse: https://play.google.com/console
- Crie uma conta de desenvolvedor (taxa única de $25 USD)
- Complete o perfil de desenvolvedor

### 2. Ferramentas Necessárias

- ✅ Android Studio instalado
- ✅ Java JDK 8 ou superior
- ✅ Node.js e npm
- ✅ Capacitor CLI

## 🔐 Passo 1: Criar Keystore para Assinatura

O app precisa ser assinado digitalmente para publicação. Siga estes passos:

### 1.1 Gerar Keystore

Execute no terminal na raiz do projeto:

```bash
cd android/app
keytool -genkey -v -keystore isfia-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias isfia-key
```

**Informações solicitadas:**
- **Senha do keystore**: Escolha uma senha forte e guarde em local seguro
- **Nome e sobrenome**: Seu nome ou da organização
- **Unidade organizacional**: Departamento (ex: "Desenvolvimento")
- **Organização**: Nome da organização (ex: "ISF IA")
- **Cidade**: Sua cidade
- **Estado**: Seu estado
- **Código do país**: BR (para Brasil)

**⚠️ IMPORTANTE**: Guarde a senha do keystore e o arquivo `isfia-release-key.jks` em local seguro. Você precisará deles para todas as atualizações futuras!

### 1.2 Configurar build.gradle

Edite o arquivo `android/app/build.gradle` e adicione a configuração de assinatura:

```gradle
android {
    // ... código existente ...
    
    signingConfigs {
        release {
            storeFile file('isfia-release-key.jks')
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: "sua_senha_aqui"
            keyAlias "isfia-key"
            keyPassword System.getenv("KEY_PASSWORD") ?: "sua_senha_aqui"
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

**⚠️ SEGURANÇA**: Para produção, use variáveis de ambiente ao invés de senhas hardcoded:

```bash
# Windows PowerShell
$env:KEYSTORE_PASSWORD="sua_senha"
$env:KEY_PASSWORD="sua_senha"

# Linux/Mac
export KEYSTORE_PASSWORD="sua_senha"
export KEY_PASSWORD="sua_senha"
```

### 1.3 Adicionar keystore ao .gitignore

Adicione ao `.gitignore`:

```
android/app/isfia-release-key.jks
*.jks
```

## 🏗️ Passo 2: Preparar Build para Produção

### 2.1 Atualizar Versão

Edite `android/app/build.gradle`:

```gradle
defaultConfig {
    // ... código existente ...
    versionCode 2  // Incremente a cada publicação (1, 2, 3, ...)
    versionName "1.0"  // Versão visível aos usuários (ex: "1.0", "1.1", "2.0")
}
```

**Regras de Versionamento:**
- `versionCode`: Número inteiro que aumenta a cada publicação (1, 2, 3...)
- `versionName`: String visível aos usuários (ex: "1.0", "1.0.1", "2.0")

### 2.2 Build da Aplicação Web

```bash
npm run build
```

### 2.3 Sincronizar Capacitor

```bash
npm run cap:sync
```

### 2.4 Gerar AAB (Android App Bundle)

O Google Play requer AAB (Android App Bundle), não APK:

```bash
cd android
./gradlew bundleRelease
```

O arquivo será gerado em:
```
android/app/build/outputs/bundle/release/app-release.aab
```

**Alternativa (Android Studio):**
1. Abra o projeto no Android Studio: `npm run cap:open`
2. Build > Generate Signed Bundle / APK
3. Selecione "Android App Bundle"
4. Escolha o keystore criado anteriormente
5. Selecione "release"
6. Clique em "Finish"

## 📦 Passo 3: Criar App no Google Play Console

### 3.1 Acessar Google Play Console

1. Acesse: https://play.google.com/console
2. Faça login com sua conta de desenvolvedor
3. Clique em "Criar app"

### 3.2 Preencher Informações Básicas

**Nome do app:**
- ISF IA

**Idioma padrão:**
- Português (Brasil)

**Tipo de app:**
- App
- Jogo (se aplicável)

**Gratuito ou pago:**
- Gratuito (ou pago, conforme sua escolha)

**Declarações:**
- Marque todas as declarações aplicáveis:
  - ✅ App contém ou acessa conteúdo de terceiros
  - ✅ App coleta dados pessoais e sensíveis
  - ✅ App usa permissões (câmera, localização, etc.)

## 🖼️ Passo 4: Configurar Assets do App

### 4.1 Ícone do App

- **Tamanho**: 512x512 pixels
- **Formato**: PNG (sem transparência)
- **Arquivo**: `icons/android/play_store_512.png`

### 4.2 Imagens de Gráficos

Você precisará criar/fornecer:

1. **Ícone de alta resolução** (512x512px) - ✅ Já existe
2. **Imagem de destaque** (1024x500px) - Criar se necessário
3. **Screenshots** (mínimo 2, máximo 8):
   - Telefone: 16:9 ou 9:16, mínimo 320px, máximo 3840px
   - Tablet: 16:9 ou 9:16, mínimo 320px, máximo 3840px
4. **Banner promocional** (opcional): 180x120px

### 4.3 Vídeo (Opcional)

- YouTube ou Google Play (máximo 2 minutos)

## 📝 Passo 5: Preencher Informações do App

### 5.1 Título e Descrição

**Título do app** (máximo 50 caracteres):
```
ISF IA
```

**Descrição curta** (máximo 80 caracteres):
```
Sistema de gestão de inspeções e equipamentos do ISF
```

**Descrição completa** (máximo 4000 caracteres):
```
[Descreva o app em detalhes, incluindo:
- Funcionalidades principais
- Benefícios para o usuário
- Casos de uso
- Informações técnicas relevantes]
```

### 5.2 Categoria e Tags

- **Categoria**: Selecione a mais apropriada (ex: "Produtividade", "Negócios")
- **Tags**: Adicione palavras-chave relevantes

### 5.3 Contato e Suporte

- **Email de contato**: Seu email
- **Telefone**: (opcional)
- **Website**: URL do site (se houver)
- **Política de privacidade**: URL obrigatória se o app coleta dados

## 🔒 Passo 6: Configurar Política de Privacidade

### 6.1 Criar Política de Privacidade

Você precisa de uma política de privacidade se o app:
- Coleta dados pessoais
- Usa permissões (câmera, localização, etc.)
- Acessa informações do dispositivo

**Conteúdo mínimo:**
- Quais dados são coletados
- Como os dados são usados
- Como os dados são armazenados
- Direitos do usuário
- Contato para questões de privacidade

### 6.2 Hospedar Política

- Publique em um site público (GitHub Pages, Netlify, etc.)
- Forneça a URL no Google Play Console

## 📤 Passo 7: Upload do AAB

### 7.1 Acessar Produção

1. No Google Play Console, vá para "Produção" (ou "Teste interno" para testes)
2. Clique em "Criar nova versão"

### 7.2 Fazer Upload

1. Clique em "Fazer upload de um novo arquivo"
2. Selecione o arquivo `app-release.aab`
3. Aguarde o processamento (pode levar alguns minutos)

### 7.3 Preencher Notas de Versão

Descreva as mudanças desta versão (máximo 500 caracteres):
```
Versão inicial do app ISF IA
- Sistema de gestão de inspeções
- Cadastro de equipamentos
- Upload de fotos
- Geolocalização
```

## ✅ Passo 8: Verificar Requisitos

Antes de publicar, verifique:

### 8.1 Checklist Obrigatório

- ✅ App assinado com keystore válido
- ✅ AAB gerado e validado
- ✅ Ícone do app (512x512px)
- ✅ Screenshots (mínimo 2)
- ✅ Descrição completa preenchida
- ✅ Política de privacidade (se necessário)
- ✅ Categoria selecionada
- ✅ Classificação de conteúdo preenchida
- ✅ Preço configurado (gratuito ou pago)

### 8.2 Classificação de Conteúdo

Responda o questionário sobre:
- Conteúdo do app
- Permissões usadas
- Dados coletados
- Público-alvo

### 8.3 Declarações de Exportação

Se aplicável, preencha declarações de:
- Criptografia
- Exportação de dados
- Conformidade com regulamentações

## 🚀 Passo 9: Publicar App

### 9.1 Revisão Final

1. Revise todas as informações
2. Verifique se todos os campos obrigatórios estão preenchidos
3. Teste o AAB em um dispositivo antes de publicar

### 9.2 Enviar para Revisão

1. Clique em "Revisar versão"
2. Revise os avisos e erros (se houver)
3. Clique em "Iniciar lançamento para produção"

### 9.3 Tempo de Revisão

- **Primeira publicação**: 1-7 dias úteis
- **Atualizações**: Geralmente 1-3 dias úteis
- **Apps com problemas**: Pode levar mais tempo

## 📊 Passo 10: Após Publicação

### 10.1 Monitorar Status

- Acompanhe o status na Google Play Console
- Verifique se há problemas ou rejeições
- Responda a comentários e avaliações

### 10.2 Atualizações Futuras

Para atualizar o app:

1. **Incrementar versão** em `build.gradle`:
   ```gradle
   versionCode 2  // Sempre incremente
   versionName "1.1"  // Versão visível
   ```

2. **Gerar novo AAB**:
   ```bash
   npm run build
   npm run cap:sync
   cd android
   ./gradlew bundleRelease
   ```

3. **Upload no Google Play Console**:
   - Vá para "Produção" > "Criar nova versão"
   - Faça upload do novo AAB
   - Preencha notas de versão
   - Publique

## 🔧 Scripts Úteis

Adicione ao `package.json`:

```json
{
  "scripts": {
    "android:build:release": "npm run build && npm run cap:sync && cd android && ./gradlew bundleRelease",
    "android:build:apk": "npm run build && npm run cap:sync && cd android && ./gradlew assembleRelease"
  }
}
```

Uso:
```bash
npm run android:build:release  # Gera AAB para Play Store
npm run android:build:apk     # Gera APK para testes
```

## ⚠️ Problemas Comuns

### Erro: "App não assinado"
- Verifique se o keystore está configurado corretamente
- Confirme que está usando `bundleRelease` e não `assembleRelease`

### Erro: "Version code já existe"
- Incremente o `versionCode` no `build.gradle`

### Erro: "Permissões não declaradas"
- Verifique o `AndroidManifest.xml`
- Declare todas as permissões usadas

### Erro: "Política de privacidade ausente"
- Crie e hospede uma política de privacidade
- Forneça a URL no console

## 📚 Recursos Adicionais

- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)
- [App Signing](https://developer.android.com/studio/publish/app-signing)
- [Play Console Policies](https://play.google.com/about/developer-content-policy/)

## 📝 Checklist Final

Antes de publicar, confirme:

- [ ] Keystore criado e configurado
- [ ] Versão atualizada no build.gradle
- [ ] Build de produção gerado (`npm run build`)
- [ ] Capacitor sincronizado (`npm run cap:sync`)
- [ ] AAB gerado (`./gradlew bundleRelease`)
- [ ] Conta Google Play Developer criada
- [ ] App criado no console
- [ ] Todas as informações preenchidas
- [ ] Screenshots adicionados
- [ ] Política de privacidade configurada
- [ ] Classificação de conteúdo preenchida
- [ ] AAB enviado para revisão

## 🎉 Pronto!

Após seguir todos os passos, seu app estará em revisão no Google Play. Boa sorte com a publicação!

---

**Última atualização**: 2024
**Versão do app**: 1.0
**Package**: com.isfia.app

