# Configuração do Capacitor - Android

## ✅ O que foi configurado:

1. **Dependências adicionadas ao package.json:**
   - `@capacitor/core`
   - `@capacitor/android`
   - `@capacitor/cli` (dev)

2. **Arquivo de configuração criado:**
   - `capacitor.config.ts`

3. **Scripts adicionados:**
   - `npm run cap:sync` - Sincroniza o build web com o projeto Android
   - `npm run cap:open` - Abre o projeto no Android Studio

## 📋 Próximos passos (execute quando quiser compilar):

### 1. Instalar as dependências:
```bash
npm install
```

### 2. Fazer build da aplicação web:
```bash
npm run build
```

### 3. Adicionar a plataforma Android:
```bash
npx cap add android
```

Isso vai criar a pasta `android/` com o projeto nativo.

### 4. Sincronizar o build:
```bash
npm run cap:sync
```

Este comando copia o build da pasta `dist/` para o projeto Android.

### 5. Abrir no Android Studio:
```bash
npm run cap:open
```

Ou abra manualmente a pasta `android/` no Android Studio.

## 🔄 Workflow de desenvolvimento:

### Para testar na web (como você está fazendo agora):
```bash
npm run dev
```
**Nada muda!** Continue usando normalmente.

### Quando quiser compilar para Android:

1. **Desenvolva e teste na web** (`npm run dev`)
2. **Quando estiver pronto para testar no Android:**
   ```bash
   npm run build        # Compila a web app
   npm run cap:sync     # Sincroniza com Android
   npm run cap:open     # Abre no Android Studio
   ```
3. **No Android Studio:**
   - Clique em "Run" ou pressione Shift+F10
   - Escolha um emulador ou dispositivo conectado
   - O app será instalado e executado

## ⚠️ Importante:

- **A pasta `android/` será criada apenas quando você executar `npx cap add android`**
- **Você pode continuar desenvolvendo normalmente com `npm run dev`**
- **O build Android usa os arquivos da pasta `dist/` (gerada pelo `npm run build`)**
- **Sempre execute `npm run build` antes de `npm run cap:sync` para ter as últimas mudanças**

## 🎯 Quando estiver pronto:

Execute estes comandos na ordem:
```bash
npm install              # Instala as dependências do Capacitor
npm run build            # Compila a aplicação
npx cap add android      # Cria o projeto Android (só precisa fazer uma vez)
npm run cap:sync         # Sincroniza o build
npm run cap:open         # Abre no Android Studio
```

Depois disso, você pode compilar o APK/AAB normalmente no Android Studio! 🚀

