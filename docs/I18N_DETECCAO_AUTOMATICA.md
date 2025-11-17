# 🌍 Detecção Automática de Idioma por Região

**Status:** ✅ Implementado  
**Data:** Janeiro 2025

---

## 🎯 Como Funciona

O sistema detecta automaticamente o idioma baseado na **região do dispositivo** usando múltiplas estratégias:

### 1. **Intl API (Mais Preciso)**
```javascript
Intl.DateTimeFormat().resolvedOptions().locale
// Exemplo: 'pt-BR', 'en-US', 'pt', 'en'
```

### 2. **Navigator Language**
```javascript
navigator.language || navigator.languages[0]
// Exemplo: 'pt-BR', 'en-US', 'pt', 'en'
```

### 3. **Timezone (Fallback)**
```javascript
Intl.DateTimeFormat().resolvedOptions().timeZone
// Exemplo: 'America/Sao_Paulo' → pt-BR
//          'America/New_York' → en-US
```

---

## 📱 Compatibilidade

✅ **Android (Capacitor)** - Detecta idioma do dispositivo  
✅ **iOS (Capacitor)** - Detecta idioma do dispositivo  
✅ **Web** - Detecta idioma do navegador e timezone

---

## 🔄 Ordem de Prioridade

1. **localStorage** - Idioma escolhido pelo usuário (se houver)
2. **Dispositivo/Região** - Detecção automática
3. **Fallback** - pt-BR (padrão)

---

## 🌎 Regiões Detectadas

### Português (pt-BR)
- Locale: `pt`, `pt-BR`, `pt-PT`
- Timezones brasileiros:
  - `America/Sao_Paulo`
  - `America/Fortaleza`
  - `America/Manaus`
  - `America/Recife`
  - `America/Belem`
  - E outros...

### Inglês (en-US)
- Locale: `en`, `en-US`, `en-GB`
- Timezones dos EUA:
  - `America/New_York`
  - `America/Chicago`
  - `America/Denver`
  - `America/Los_Angeles`
  - E outros...

---

## 💻 Uso em Páginas

### Opção 1: String simples (mantém compatibilidade)
```tsx
<PageHeader title="Configurações" />
```

### Opção 2: Chave de tradução (recomendado)
```tsx
<PageHeader title={{ key: 'settings.title' }} />
```

### Opção 3: Com fallback
```tsx
<PageHeader title={{ 
  key: 'settings.title', 
  defaultValue: 'Configurações' 
}} />
```

---

## 🔧 Como Adicionar em Novas Páginas

1. **Importar o hook:**
```tsx
import { useTranslation } from '../hooks/useTranslation';
```

2. **Usar no componente:**
```tsx
const MyPage = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <PageHeader title={{ key: 'myPage.title' }} />
      <h1>{t('myPage.welcome')}</h1>
    </div>
  );
};
```

3. **Adicionar traduções:**
```json
// pt-BR.json
{
  "myPage": {
    "title": "Minha Página",
    "welcome": "Bem-vindo"
  }
}

// en-US.json
{
  "myPage": {
    "title": "My Page",
    "welcome": "Welcome"
  }
}
```

---

## ✅ Páginas Atualizadas

- ✅ `SettingsPage` - Usa tradução
- ✅ `PlanPaymentPage` - Usa tradução
- ✅ `QrGeneratorPage` - Usa tradução
- ✅ `PageHeader` - Suporta tradução automática

---

## 🧪 Testar Detecção

### No Android:
1. Ajuste o idioma do dispositivo em Configurações
2. Abra o app
3. O idioma será detectado automaticamente

### No Web:
1. Ajuste o idioma do navegador
2. Recarregue a página
3. O idioma será detectado automaticamente

### Forçar Idioma:
```tsx
const { changeLanguage } = useTranslation();
changeLanguage('en-US'); // Força inglês
changeLanguage('pt-BR'); // Força português
```

---

## 📝 Notas Importantes

- A detecção acontece **automaticamente** na inicialização do app
- O idioma escolhido pelo usuário tem **prioridade** sobre a detecção
- A detecção funciona mesmo **offline** (usa configurações do dispositivo)
- Timezone é usado apenas como **fallback** se locale não estiver disponível

---

**Última atualização:** Janeiro 2025

