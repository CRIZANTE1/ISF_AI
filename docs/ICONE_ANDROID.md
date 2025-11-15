# 🎨 Guia: Criar Ícone para App Android

## 📋 Resumo

O app Android precisa de ícones em múltiplas resoluções. Este guia explica como gerar todos os ícones necessários a partir do logo do ISF IA.

## 🎯 Ícone Atual

O ícone foi criado baseado no logo do ISF IA:
- **Escudo hexagonal vermelho** (contorno)
- **Design de circuito branco** (dentro do escudo)
- **Chama vermelha** (centro)
- **Fundo branco**

## 📐 Tamanhos Necessários

O Android requer ícones em diferentes densidades:

| Densidade | Tamanho (px) | Pasta |
|-----------|--------------|-------|
| mdpi | 48x48 | mipmap-mdpi |
| hdpi | 72x72 | mipmap-hdpi |
| xhdpi | 96x96 | mipmap-xhdpi |
| xxhdpi | 144x144 | mipmap-xxhdpi |
| xxxhdpi | 192x192 | mipmap-xxxhdpi |

## 🛠️ Método 1: Usar Gerador Online (Recomendado)

### Passo 1: Preparar a Imagem Base

1. Crie ou obtenha uma imagem PNG do logo em **1024x1024 pixels**
2. A imagem deve ter:
   - Fundo transparente ou branco
   - Resolução alta (1024x1024 ou maior)
   - Formato PNG

### Passo 2: Gerar Ícones

Use uma das seguintes ferramentas:

#### Opção A: Android Asset Studio (Recomendado)
1. Acesse: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
2. Faça upload da imagem de 1024x1024
3. Ajuste as configurações:
   - **Shape**: None (para manter o formato original)
   - **Padding**: 0%
   - **Background Color**: Branco (#FFFFFF)
4. Clique em "Download" para baixar o ZIP com todos os ícones

#### Opção B: Icon Generator Online
1. Acesse: https://icon-generator-online.com/pt
2. Faça upload da imagem
3. Selecione "Android"
4. Baixe o ZIP gerado

### Passo 3: Substituir os Ícones

1. Extraia o ZIP baixado
2. Copie os arquivos para as pastas correspondentes:

```
android/app/src/main/res/
├── mipmap-mdpi/
│   ├── ic_launcher.png
│   ├── ic_launcher_round.png
│   └── ic_launcher_foreground.png
├── mipmap-hdpi/
│   ├── ic_launcher.png
│   ├── ic_launcher_round.png
│   └── ic_launcher_foreground.png
├── mipmap-xhdpi/
│   ├── ic_launcher.png
│   ├── ic_launcher_round.png
│   └── ic_launcher_foreground.png
├── mipmap-xxhdpi/
│   ├── ic_launcher.png
│   ├── ic_launcher_round.png
│   └── ic_launcher_foreground.png
└── mipmap-xxxhdpi/
    ├── ic_launcher.png
    ├── ic_launcher_round.png
    └── ic_launcher_foreground.png
```

## 🛠️ Método 2: Usar Android Studio

1. Abra o projeto no Android Studio
2. Clique com botão direito em `android/app/src/main/res`
3. Selecione **New > Image Asset**
4. Configure:
   - **Asset Type**: Launcher Icons (Adaptive and Legacy)
   - **Foreground Layer**: Faça upload da imagem do logo
   - **Background Layer**: Cor branca (#FFFFFF)
5. Clique em **Next** e depois **Finish**

## 🛠️ Método 3: Usar Capacitor Assets

Se você tem o logo em formato PNG/SVG:

1. Coloque o logo em `resources/icon.png` (1024x1024)
2. Instale o plugin:
   ```bash
   npm install @capacitor/assets
   ```
3. Execute:
   ```bash
   npx capacitor-assets generate
   ```

## ✅ Verificação

Após substituir os ícones:

1. **Limpe o build**:
   ```bash
   cd android
   ./gradlew clean
   ```

2. **Sincronize o Capacitor**:
   ```bash
   npm run cap:sync
   ```

3. **Abra no Android Studio**:
   ```bash
   npm run cap:open
   ```

4. **Compile e teste** no dispositivo/emulador

## 📝 Notas Importantes

- **Adaptive Icons**: Android 8.0+ usa ícones adaptativos (foreground + background)
- **Safe Zone**: Mantenha elementos importantes no centro (66% da área)
- **Contraste**: Garanta bom contraste entre foreground e background
- **Formato**: Use PNG para melhor qualidade

## 🎨 Cores do Ícone ISF IA

- **Vermelho**: #FC3D39 (escudo e chama)
- **Branco**: #FFFFFF (fundo e circuito)
- **Azul**: #FFFFFF (circuito - ajustado para branco conforme identidade visual)

## 🔄 Atualizar Ícones

Se precisar atualizar os ícones no futuro:

1. Gere novos ícones usando um dos métodos acima
2. Substitua os arquivos nas pastas mipmap-*
3. Execute `npm run cap:sync`
4. Recompile o app

