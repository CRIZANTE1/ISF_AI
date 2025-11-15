# 🎨 Como Gerar Ícones para Android

## 📋 Pré-requisitos

Você precisa de uma imagem do logo em **PNG ou SVG** com pelo menos **1024x1024 pixels**.

## 🚀 Método Rápido (Recomendado)

### Opção 1: Android Asset Studio (Mais Fácil)

1. **Acesse**: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html

2. **Faça upload** da sua imagem de logo (1024x1024 PNG)

3. **Configure**:
   - **Foreground**: Sua imagem do logo
   - **Background**: Cor branca (#FFFFFF)
   - **Shape**: None (para manter formato original)
   - **Padding**: 0%

4. **Clique em "Download"** - isso gerará um ZIP com todos os ícones

5. **Extraia o ZIP** e copie os arquivos para:
   ```
   android/app/src/main/res/
   ├── mipmap-mdpi/
   ├── mipmap-hdpi/
   ├── mipmap-xhdpi/
   ├── mipmap-xxhdpi/
   └── mipmap-xxxhdpi/
   ```

### Opção 2: Icon Generator Online

1. **Acesse**: https://icon-generator-online.com/pt

2. **Faça upload** da imagem

3. **Selecione "Android"**

4. **Baixe o ZIP** e extraia nas pastas corretas

## 📁 Estrutura de Pastas

Após gerar os ícones, você deve ter:

```
android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png (48x48)
│   ├── ic_launcher_round.png (48x48)
│   └── ic_launcher_foreground.png (108x108)
├── mipmap-hdpi/
│   ├── ic_launcher.png (72x72)
│   ├── ic_launcher_round.png (72x72)
│   └── ic_launcher_foreground.png (162x162)
├── mipmap-xhdpi/
│   ├── ic_launcher.png (96x96)
│   ├── ic_launcher_round.png (96x96)
│   └── ic_launcher_foreground.png (216x216)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png (144x144)
│   ├── ic_launcher_round.png (144x144)
│   └── ic_launcher_foreground.png (324x324)
└── mipmap-xxxhdpi/
    ├── ic_launcher.png (192x192)
    ├── ic_launcher_round.png (192x192)
    └── ic_launcher_foreground.png (432x432)
```

## ✅ Após Gerar os Ícones

1. **Sincronize o Capacitor**:
   ```bash
   npm run cap:sync
   ```

2. **Limpe o build**:
   ```bash
   cd android
   ./gradlew clean
   ```

3. **Abra no Android Studio**:
   ```bash
   npm run cap:open
   ```

4. **Compile e teste** no dispositivo

## 🎨 Ícone Atual

O ícone SVG base foi criado em `resources/icon.svg` com:
- Escudo hexagonal vermelho
- Design de circuito branco
- Chama vermelha no centro
- Fundo branco

Use este SVG como base para gerar os PNGs em todas as resoluções.

## ⚠️ Importante

- Os arquivos PNG devem ser gerados a partir do SVG ou de uma imagem de alta resolução
- Mantenha o design simples e reconhecível em tamanhos pequenos
- Teste o ícone em diferentes dispositivos Android

