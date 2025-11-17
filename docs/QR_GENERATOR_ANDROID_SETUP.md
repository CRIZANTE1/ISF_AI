# Configuração do Gerador de QR Code para Android

## ✅ O que foi implementado:

1. **Gerador de QR Code integrado** com suporte a:
   - Formato industrial: `2#7036#EXT#008851#47#31`
   - Formato simples: texto livre
   - Seleção múltipla de extintores cadastrados

2. **Compatibilidade Android**:
   - Detecta automaticamente se está rodando no Android
   - Usa Capacitor Filesystem para salvar arquivos
   - Usa Capacitor Share para compartilhar QR Codes
   - Fallback para método web quando necessário

## 📦 Dependências Necessárias:

### 1. Instalar plugins do Capacitor (versão compatível com Capacitor 6):

```bash
npm install @capacitor/filesystem@6.0.0 @capacitor/share@6.0.0 --legacy-peer-deps
```

**Nota:** Se houver conflito de dependências, use `--legacy-peer-deps` ou adicione ao `package.json` manualmente:
```json
"@capacitor/filesystem": "^6.0.0",
"@capacitor/share": "^6.0.0"
```

### 2. Sincronizar com Android:

```bash
npm run build
npm run cap:sync
```

### ⚠️ Importante:
- O gerador **funciona sem os plugins** (usa método web)
- Os plugins são **opcionais** e apenas melhoram a experiência no Android
- Se não instalar os plugins, o download funcionará normalmente no navegador

## 🔧 Como Funciona:

### No Navegador (Web):
- Usa método tradicional de download (`<a>` com `download`)
- Funciona normalmente em qualquer navegador moderno

### No Android:
- **Salva arquivos** usando `@capacitor/filesystem` na pasta Documents
- **Compartilha arquivos** usando `@capacitor/share` (permite enviar por WhatsApp, email, etc.)
- **Funciona offline** (após primeira geração, se usar biblioteca local)

## ⚠️ Limitações Atuais:

1. **Geração de QR Code**: Atualmente usa API externa (`api.qrserver.com`)
   - **Problema**: Requer internet
   - **Solução recomendada**: Instalar biblioteca local:
     ```bash
     npm install qrcode.react
     ```
   - Isso permitirá gerar QR Codes offline

2. **Download em ZIP**: Atualmente baixa arquivos individualmente
   - **Solução**: Instalar `jszip` para criar ZIP:
     ```bash
     npm install jszip
     ```

## 🚀 Melhorias Recomendadas:

### 1. Biblioteca Local de QR Code (Recomendado):

Substitua o componente `QRCodeDisplay` para usar biblioteca local:

```typescript
import QRCode from 'qrcode.react';

const QRCodeDisplay = ({ value, size = 200 }: { value: string; size?: number }) => {
  return (
    <QRCode
      value={value}
      size={size}
      level="H" // Alta correção de erro
      renderAs="svg" // Melhor qualidade
    />
  );
};
```

### 2. Download em ZIP no Android:

Com `jszip` instalado, você pode criar ZIPs e salvar no Filesystem:

```typescript
import JSZip from 'jszip';

const downloadAllQrCodes = async () => {
  const zip = new JSZip();
  // ... adicionar arquivos ao ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  // Salvar usando Filesystem no Android
};
```

## 📱 Permissões Android:

As permissões necessárias já estão configuradas:
- **WRITE_EXTERNAL_STORAGE**: Para salvar arquivos (Android 9 e abaixo)
- **READ_EXTERNAL_STORAGE**: Para ler arquivos salvos

No Android 10+ (API 29+), o Capacitor Filesystem usa Scoped Storage automaticamente.

## ✅ Testes:

1. **Teste no navegador**: Deve funcionar normalmente
2. **Teste no Android**:
   - Gere um QR Code
   - Clique em "Baixar PNG"
   - Deve abrir o diálogo de compartilhamento do Android
   - Escolha onde salvar/compartilhar

## 🐛 Troubleshooting:

### QR Code não aparece:
- Verifique conexão com internet (se usando API externa)
- Instale biblioteca local: `npm install qrcode.react`

### Download não funciona no Android:
- Verifique se `@capacitor/filesystem` está instalado
- Execute `npm run cap:sync` após instalar
- Verifique permissões no AndroidManifest.xml

### Erro ao compartilhar:
- Verifique se `@capacitor/share` está instalado
- O plugin Share pode não estar disponível em todos os dispositivos

