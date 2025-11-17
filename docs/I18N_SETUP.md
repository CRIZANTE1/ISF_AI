# 🌍 Configuração de Multi-idioma (i18n)

**Status:** ✅ Implementado  
**Data:** Janeiro 2025

---

## 📦 Instalação

```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

---

## 🏗️ Estrutura

```
src/
├── i18n/
│   ├── config.ts              # Configuração do i18next
│   └── locales/
│       ├── pt-BR.json         # Traduções em português
│       └── en-US.json         # Traduções em inglês
└── hooks/
    └── useTranslation.ts      # Hook customizado para tradução
```

---

## 🚀 Como Usar

### 1. Em Componentes React

```tsx
import { useTranslation } from '../hooks/useTranslation';

const MyComponent = () => {
  const { t, changeLanguage, currentLanguage } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.welcome', { name: 'João' })}</p>
      
      <button onClick={() => changeLanguage('en-US')}>
        Change to English
      </button>
    </div>
  );
};
```

### 2. Com Valores Dinâmicos

```tsx
const { t } = useTranslation();

// No JSON: "welcome": "Bem-vindo, {{name}}!"
t('dashboard.welcome', { name: 'João' })
// Resultado: "Bem-vindo, João!"
```

### 3. Com Pluralização

```tsx
// No JSON: "items": "{{count}} item", "items_plural": "{{count}} itens"
t('common.items', { count: 1 })  // "1 item"
t('common.items', { count: 5 })  // "5 itens"
```

---

## 🔧 Funcionalidades

### Detecção Automática de Idioma

1. **localStorage** - Idioma salvo pelo usuário
2. **Dispositivo** - Idioma do Android/iOS (via Capacitor)
3. **Navegador** - Idioma do navegador (fallback)

### Idiomas Suportados

- ✅ **pt-BR** - Português (Brasil) - Padrão
- ✅ **en-US** - English (US)

### Persistência

O idioma escolhido é salvo automaticamente no `localStorage` e mantido entre sessões.

---

## 📝 Adicionar Novas Traduções

### 1. Adicionar chave no JSON

**pt-BR.json:**
```json
{
  "mySection": {
    "myKey": "Minha tradução em português"
  }
}
```

**en-US.json:**
```json
{
  "mySection": {
    "myKey": "My translation in English"
  }
}
```

### 2. Usar no código

```tsx
const { t } = useTranslation();
<p>{t('mySection.myKey')}</p>
```

---

## 🎯 Seletor de Idioma

O seletor de idioma está disponível em:
- **Configurações** → **Preferências** → **Idioma**

---

## 🔍 Hook useTranslation

O hook customizado fornece:

```tsx
const {
  t,                    // Função de tradução
  changeLanguage,       // Mudar idioma
  currentLanguage,      // Idioma atual ('pt-BR' | 'en-US')
  isPortuguese,         // true se português
  isEnglish,           // true se inglês
  i18n                 // Instância do i18next (avançado)
} = useTranslation();
```

---

## 📱 Compatibilidade Android

✅ **Funciona perfeitamente no Android/Capacitor**

- Detecta idioma do dispositivo automaticamente
- Salva preferência no localStorage
- Logs aparecem no idioma correto no Logcat

---

## 🐛 Troubleshooting

### Tradução não aparece

1. Verifique se a chave existe nos dois arquivos JSON (pt-BR e en-US)
2. Verifique se o namespace está correto: `t('section.key')`
3. Recarregue a página após adicionar novas traduções

### Idioma não muda

1. Verifique se o idioma está salvo no localStorage: `localStorage.getItem('i18nextLng')`
2. Limpe o cache: `localStorage.removeItem('i18nextLng')` e recarregue

---

## 📚 Recursos

- [Documentação i18next](https://www.i18next.com/)
- [Documentação react-i18next](https://react.i18next.com/)
- [Guia de tradução](https://www.i18next.com/principles/translation-function)

---

**Última atualização:** Janeiro 2025

