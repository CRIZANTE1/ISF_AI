# Changelog - Versão 12 (1.2)

## 📱 Versão 12 (1.2) - Correção de Geolocalização

### 🎯 Principais Mudanças

#### ✅ Correção de Geolocalização
- **Permissões de geolocalização adicionadas**: As permissões `ACCESS_FINE_LOCATION` e `ACCESS_COARSE_LOCATION` foram adicionadas ao `AndroidManifest.xml`
- **Geolocalização funcionando**: O app agora pode solicitar e usar a localização do dispositivo corretamente
- **Compatibilidade com Android 12+**: Permissões configuradas para funcionar em todas as versões do Android

#### 🔧 Melhorias Técnicas
- **Configuração de assinatura de APK**: Adicionada configuração completa de assinatura no `build.gradle` para gerar APKs assinados automaticamente
- **Alias do keystore corrigido**: Alias do keystore atualizado para "isfia-key"

### 📋 Detalhes Técnicos

#### Arquivos Modificados
- `android/app/src/main/AndroidManifest.xml`
  - Adicionada permissão `ACCESS_FINE_LOCATION`
  - Adicionada permissão `ACCESS_COARSE_LOCATION`

- `android/app/build.gradle`
  - `versionCode`: Atualizado para 12
  - `versionName`: Atualizado para "1.2"
  - Adicionada configuração completa de `signingConfigs` para assinatura automática de APKs

### 🐛 Correções de Bugs

1. **Geolocalização não funcionava**: 
   - Permissões de localização não estavam declaradas no AndroidManifest.xml
   - Agora o app pode solicitar e usar a localização corretamente

### 🔄 Compatibilidade

- **Android mínimo**: API 22 (Android 5.1)
- **Android recomendado**: API 30+ (Android 11+)
- **SDK de compilação**: 35
- **SDK alvo**: 35

### 📝 Notas de Atualização

Esta versão corrige o problema de geolocalização que estava impedindo o app de acessar a localização do dispositivo. As permissões necessárias foram adicionadas ao AndroidManifest.xml.

---

**Data de Lançamento**: Novembro 2025  
**Versão Anterior**: 1.1 (versionCode 11)

---

# Changelog - Versão 11 (1.1)

## 📱 Versão 11 (1.1) - Melhorias de Interface e Compatibilidade

### 🎯 Principais Mudanças

#### ✅ Correção de Interface Android
- **Correção do problema de sobreposição com barras do sistema**: O app agora respeita corretamente as áreas das barras de status e navegação do Android, evitando que o conteúdo fique atrás ou por cima dos comandos do sistema
- **Espaçamento automático superior e inferior com fundo preto**: Espaços suficientes são adicionados automaticamente nas partes superior e inferior do app para garantir que nenhum conteúdo sobreponha as barras do sistema. As áreas de espaçamento têm fundo preto para manter a consistência visual
- **Ajuste automático de conteúdo**: O conteúdo é ajustado automaticamente para não sobrepor as barras do sistema, garantindo que todas as áreas interativas sejam acessíveis
- **Implementação de edge-to-edge**: O app agora utiliza toda a área da tela de forma inteligente, respeitando os insets (espaços seguros) do sistema
- **Melhor compatibilidade com diferentes versões do Android**: Suporte aprimorado para Android 11+ (API 30+) e versões anteriores
- **Propagação correta de insets**: Os window insets são propagados corretamente para o WebView do Capacitor, garantindo que o conteúdo respeite as áreas seguras em todos os dispositivos
- **Aplicação de padding ao WebView com fundo preto**: Padding é aplicado diretamente ao WebView do Capacitor e ao contentView para criar espaçamento adequado nas bordas. Todas as áreas de padding têm fundo preto (Color.BLACK) para manter a consistência visual do app

#### 🔧 Melhorias Técnicas
- **Atualização do SDK**: Configurado para usar Android SDK 35 (compileSdk e targetSdk)
- **Otimização de Window Insets**: Implementação de tratamento correto de window insets na MainActivity para garantir que o Capacitor WebView respeite as áreas seguras
- **Comportamento das barras do sistema**: Configuração para manter as barras do sistema sempre acessíveis quando necessário

### 📋 Detalhes Técnicos

#### Arquivos Modificados
- `android/app/src/main/java/com/isfia/app/MainActivity.java`
  - Adicionado método `setupWindowInsets()` para gerenciar corretamente os insets
  - Adicionado método `applyPaddingToWebView()` para aplicar padding ao WebView do Capacitor
  - Implementado suporte para Android 11+ e versões anteriores
  - Configuração de edge-to-edge com respeito aos insets do sistema
  - Aplicação de padding automático ao contentView e WebView para criar espaçamento adequado
  - Aplicação dupla de insets (imediata e após delay) para garantir que o WebView esteja pronto

- `android/app/build.gradle`
  - `versionCode`: Atualizado para 11
  - `versionName`: Atualizado para "1.1"

- `android/variables.gradle`
  - `compileSdkVersion`: 35
  - `targetSdkVersion`: 35

### 🐛 Correções de Bugs

1. **Problema de sobreposição corrigido**: 
   - O app não fica mais atrás das barras de navegação do Android
   - O conteúdo não sobrepõe mais as barras do sistema
   - Melhor experiência visual em dispositivos com diferentes tamanhos de tela

### 🔄 Compatibilidade

- **Android mínimo**: API 22 (Android 5.1)
- **Android recomendado**: API 30+ (Android 11+)
- **SDK de compilação**: 35
- **SDK alvo**: 35

### 📝 Notas de Atualização

Esta versão foca principalmente em melhorias de experiência do usuário relacionadas à interface e compatibilidade com o sistema Android. As mudanças garantem que o app funcione corretamente em todos os dispositivos Android modernos, respeitando as áreas seguras e as barras do sistema.

### 🚀 Próximas Versões

Melhorias planejadas para versões futuras:
- Otimizações de performance
- Novas funcionalidades de inspeção
- Melhorias no sistema offline
- Novos recursos de relatórios

---

**Data de Lançamento**: Janeiro 2025  
**Versão Anterior**: 1.0 (versionCode 9)

