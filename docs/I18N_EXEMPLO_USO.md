# 📖 Exemplos de Uso - Multi-idioma

## Exemplo Básico

```tsx
import { useTranslation } from '../hooks/useTranslation';

const Dashboard = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.welcome')}</p>
    </div>
  );
};
```

## Exemplo com Valores Dinâmicos

```tsx
const Profile = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();

  return (
    <div>
      <h1>{t('profile.myProfile')}</h1>
      <p>{t('profile.memberSince', { 
        date: new Date(profile.created_at).toLocaleDateString() 
      })}</p>
    </div>
  );
};
```

## Exemplo com Mudança de Idioma

```tsx
const Settings = () => {
  const { t, changeLanguage, currentLanguage } = useTranslation();

  return (
    <div>
      <select 
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value as 'pt-BR' | 'en-US')}
      >
        <option value="pt-BR">Português</option>
        <option value="en-US">English</option>
      </select>
    </div>
  );
};
```

## Exemplo com Condicionais

```tsx
const EquipmentCard = ({ equipment }) => {
  const { t, isPortuguese } = useTranslation();

  return (
    <div>
      <h3>{equipment.name}</h3>
      <p>
        {isPortuguese 
          ? `Próxima inspeção: ${equipment.nextInspection}`
          : `Next inspection: ${equipment.nextInspection}`
        }
      </p>
    </div>
  );
};
```

## Exemplo com Fallback

```tsx
const { t } = useTranslation();

// Se a chave não existir, usa o defaultValue
t('settings.newFeature', { 
  defaultValue: 'Nova funcionalidade' 
})
```

