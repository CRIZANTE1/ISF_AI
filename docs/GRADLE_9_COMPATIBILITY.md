# Compatibilidade com Gradle 9.0

Este documento descreve as correções aplicadas para tornar o projeto compatível com Gradle 9.0.

## Correções Aplicadas

### 1. `settings.gradle` - Dependency Resolution Management
- **Antes**: Usava `allprojects` para definir repositórios (deprecado)
- **Depois**: Implementado `dependencyResolutionManagement` com `RepositoriesMode.PREFER_SETTINGS`
- **Benefício**: Usa o novo sistema de gerenciamento de dependências do Gradle 9.0

### 2. `app/build.gradle` - aaptOptions → androidResources
- **Antes**: Usava `aaptOptions` (deprecado no Gradle 9.0)
- **Depois**: Substituído por `androidResources` com `ignoreAssetsPattern`
- **Benefício**: Compatível com Gradle 9.0 e futuras versões

### 3. `capacitor-cordova-android-plugins/build.gradle` - lintOptions → lint
- **Antes**: Usava `lintOptions` (deprecado)
- **Depois**: Substituído por `lint`
- **Benefício**: Usa a nova API de lint do Gradle

### 4. `build.gradle` - Task Registration
- **Antes**: `task clean(type: Delete)`
- **Depois**: `tasks.register('clean', Delete)`
- **Benefício**: Usa a nova API de registro de tasks do Gradle

### 5. `gradle.properties` - Propriedades Adicionais
- Adicionado `android.suppressUnsupportedCompileSdk=34` para suprimir warnings

## Notas Importantes

### Repositórios `flatDir`
Os repositórios `flatDir` ainda são necessários para plugins do Capacitor/Cordova e continuam funcionando no Gradle 9.0, mas podem gerar warnings. Isso é esperado e não afeta a funcionalidade.

### `allprojects` Mantido
O bloco `allprojects` foi mantido no `build.gradle` principal para compatibilidade com plugins antigos, mas a configuração principal de repositórios foi movida para `settings.gradle` usando `dependencyResolutionManagement`.

## Verificação

Para verificar se as correções funcionaram:

```bash
cd android
./gradlew clean build --warning-mode all
```

Se ainda houver warnings sobre recursos deprecados, eles serão exibidos e podem ser corrigidos individualmente.

## Referências

- [Gradle 9.0 Release Notes](https://docs.gradle.org/9.0/release-notes.html)
- [Android Gradle Plugin Compatibility](https://developer.android.com/studio/releases/gradle-plugin)

