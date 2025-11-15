# Configuração de Notificações

## Instalação

Para habilitar notificações push em dispositivos móveis (Android/iOS), você precisa instalar o plugin do Capacitor:

```bash
npm install @capacitor/push-notifications
npx cap sync
```

## Funcionalidades Implementadas

### ✅ Serviço de Notificações (`src/services/notificationService.ts`)
- Solicita permissão de notificações
- Verifica status da permissão
- Envia notificações locais
- Suporta web e nativo (Android/iOS)

### ✅ Hook de Notificações (`src/hooks/useNotifications.ts`)
- Gerencia estado de permissões
- Facilita uso em componentes React

### ✅ Página de Configurações Atualizada
- Toggle funcional de notificações
- Solicita permissão quando necessário
- Mostra status da permissão

### ✅ Utilitários de Notificações (`src/utils/notificationUtils.ts`)
- Notificações para equipamentos vencidos
- Notificações para múltiplos equipamentos
- Notificações de atualizações de inspeções

## Como Usar

### Em Componentes React

```typescript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const { permissionStatus, requestPermission, showNotification } = useNotifications();

  const handleNotify = async () => {
    if (!permissionStatus.granted) {
      await requestPermission();
    }
    await showNotification('Título', 'Mensagem');
  };

  return (
    <button onClick={handleNotify}>
      Enviar Notificação
    </button>
  );
}
```

### Para Notificar Equipamentos Vencidos

```typescript
import { notifyEquipmentExpiring } from '../utils/notificationUtils';

// Notificar equipamento vencido
await notifyEquipmentExpiring('EXT-001', 'Extintor', -5); // -5 dias = vencido

// Notificar equipamento próximo do vencimento
await notifyEquipmentExpiring('EXT-002', 'Extintor', 3); // 3 dias restantes
```

## Permissões no Android

Para notificações funcionarem no Android, você precisa adicionar as permissões no arquivo `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

## Testando

### No Navegador (Web)
1. Acesse a página de Configurações
2. Ative o toggle de Notificações
3. Permita notificações quando solicitado
4. As notificações funcionarão usando a API do navegador

### No Android
1. Instale o plugin: `npm install @capacitor/push-notifications`
2. Sincronize: `npx cap sync`
3. Adicione a permissão no AndroidManifest.xml
4. Compile e instale o app
5. Ative notificações nas configurações do app

## Notas Importantes

- As notificações web funcionam mesmo sem o plugin instalado
- Para notificações push (servidor → dispositivo), você precisará configurar um serviço de push (Firebase Cloud Messaging, etc.)
- As notificações locais funcionam tanto na web quanto no nativo
- O código está preparado para funcionar mesmo se o plugin não estiver instalado (fallback para web)

