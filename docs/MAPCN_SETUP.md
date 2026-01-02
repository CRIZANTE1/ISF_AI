# mapcn - Documentação

Componentes de mapa bonitos, acessíveis e customizáveis para React.

## Introdução

**mapcn** fornece componentes de mapa lindamente projetados, acessíveis e customizáveis. Construído sobre MapLibre GL, estilizado com Tailwind CSS e projetado para funcionar com shadcn/ui.

## Por que mapcn?

Não existe uma integração de mapa adequada, fácil de usar e copiar-colar para React. A maioria das soluções requer configurações complexas, chaves de API ou bibliotecas wrapper pesadas. O mapcn oferece mapas bonitos com um único comando.

## Características

### Zero Config

Funciona imediatamente com tiles de mapa gratuitos. Não requer chaves de API.

### Theme Aware

Adapta-se automaticamente aos modos claro e escuro.

### Composable

Construa UIs complexas com componentes simples e composáveis.

### TypeScript

Suporte completo ao TypeScript com segurança de tipos abrangente.

## Pré-requisitos

- Um projeto com Tailwind CSS e shadcn/ui configurados
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

## Configuração do Alias de Importação

O shadcn/ui requer um alias de importação configurado. Se você receber o erro "No import alias found in your tsconfig.json file", siga estes passos:

### 1. Configurar TypeScript (`tsconfig.app.json`)

Adicione o alias `@/*` no `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    // ... outras opções ...
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 2. Configurar Vite (`vite.config.ts`)

Adicione o alias no `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ... resto da configuração
});
```

### 3. Instalar @types/node (se necessário)

Se você receber erros relacionados ao módulo `path`, instale os tipos do Node.js:

```bash
npm install --save-dev @types/node
```

### 4. Configurar tsconfig.node.json

Atualize o `tsconfig.node.json` para incluir os tipos do Node.js:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts"]
}
```

## Instalação

Execute o seguinte comando para adicionar o componente de mapa:

```bash
npx shadcn@latest add map
```

Isso instalará `maplibre-gl` e adicionará o componente de mapa ao seu projeto.

## Uso Básico

Importe e use o componente de mapa:

```tsx
import { Map } from "@/components/ui/map"

export default function MapExample() {
  return (
    <Map
      className="h-[600px] w-full rounded-lg"
      initialViewState={{
        longitude: -74.006,
        latitude: 40.7128,
        zoom: 10,
      }}
    />
  )
}
```

## Referência da API

### Componentes Principais

#### Map

O componente raiz do container que inicializa o MapLibre GL e fornece contexto aos componentes filhos. Gerencia automaticamente a troca de temas entre modo claro e escuro.

**Props:** Estende `MapOption` do MapLibre GL (excluindo `container` e `style`).

**Referências:**
- [MapOption](https://maplibre.org/maplibre-gl-js/docs/API/classes/maplibregl.Map/#constructor-parameters)
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- [MapLibre Map API](https://maplibre.org/maplibre-gl-js/docs/API/classes/maplibregl.Map/)

#### useMap

Um hook que fornece acesso à instância do mapa MapLibre e ao estado de carregamento. Deve ser usado dentro de um componente Map.

**Retorna:**
- `map` (MapLibre.Map) - A instância do mapa
- `isLoaded` (boolean) - Indica se o mapa está carregado e pronto para uso

**Referências:**
- [MapLibre.Map](https://maplibre.org/maplibre-gl-js/docs/API/classes/maplibregl.Map/)

#### MapControl

Componente para adicionar controles ao mapa (zoom, navegação, etc.).

#### MapMarker

Um container para componentes relacionados a marcadores. Fornece contexto para seus filhos e gerencia o posicionamento de marcadores.

**Props:** Estende `MarkerOption` do MapLibre GL (excluindo `element`).

**Referências:**
- [MarkerOption](https://maplibre.org/maplibre-gl-js/docs/API/classes/maplibregl.Marker/#constructor-parameters)

#### MarkerContent

Componente para renderizar o conteúdo personalizado de um marcador.

#### MarkerPopup

Renderiza um popup anexado ao marcador que abre ao clicar. Deve ser usado dentro de `MapMarker`.

**Props:** Estende `PopupOption` do MapLibre GL (excluindo `className`).

**Referências:**
- [PopupOption](https://maplibre.org/maplibre-gl-js/docs/API/classes/maplibregl.Popup/#constructor-parameters)

#### MarkerTooltip

Renderiza um tooltip que aparece ao passar o mouse. Deve ser usado dentro de `MapMarker`.

**Props:** Estende `PopupOption` do MapLibre GL (excluindo `className`, `closeButton` e `closeOnClick`, pois o tooltip desaparece automaticamente ao sair do hover).

**Referências:**
- [PopupOption](https://maplibre.org/maplibre-gl-js/docs/API/classes/maplibregl.Popup/#constructor-parameters)

#### MarkerLabel

Componente para adicionar um rótulo ao marcador.

#### MapPopup

Um componente popup independente que pode ser colocado em qualquer lugar do mapa sem um marcador. Deve ser usado dentro de `Map`.

**Props:** Estende `PopupOption` do MapLibre GL (excluindo `className`).

**Referências:**
- [PopupOption](https://maplibre.org/maplibre-gl-js/docs/API/classes/maplibregl.Popup/#constructor-parameters)

#### MapRoute

Componente para renderizar rotas no mapa.

## Exemplos

### Mapa Básico

```tsx
import { Map } from "@/components/ui/map"

export default function BasicMap() {
  return (
    <Map
      className="h-[600px] w-full rounded-lg"
      initialViewState={{
        longitude: -74.006,
        latitude: 40.7128,
        zoom: 10,
      }}
    />
  )
}
```

### Marcadores

#### Exemplo Básico

```tsx
import { Map, MapMarker } from "@/components/ui/map"

export default function MarkersExample() {
  return (
    <Map
      className="h-[600px] w-full rounded-lg"
      initialViewState={{
        longitude: -74.006,
        latitude: 40.7128,
        zoom: 10,
      }}
    >
      <MapMarker longitude={-74.006} latitude={40.7128}>
        {/* Conteúdo do marcador */}
      </MapMarker>
      <MapMarker longitude={-73.935242} latitude={40.730610}>
        {/* Conteúdo do marcador */}
      </MapMarker>
    </Map>
  )
}
```

#### Popup Rico

```tsx
import { Map, MapMarker, MarkerPopup } from "@/components/ui/map"

export default function RichPopupExample() {
  return (
    <Map
      className="h-[600px] w-full rounded-lg"
      initialViewState={{
        longitude: -74.006,
        latitude: 40.7128,
        zoom: 10,
      }}
    >
      <MapMarker longitude={-74.006} latitude={40.7128}>
        <MarkerPopup>
          <div className="p-4">
            <h3 className="font-bold">New York City</h3>
            <p>A cidade que nunca dorme. População: 8.3 milhões</p>
          </div>
        </MarkerPopup>
      </MapMarker>
    </Map>
  )
}
```

### Popups

```tsx
import { Map, MapPopup } from "@/components/ui/map"

export default function PopupExample() {
  return (
    <Map
      className="h-[600px] w-full rounded-lg"
      initialViewState={{
        longitude: -74.006,
        latitude: 40.7128,
        zoom: 10,
      }}
    >
      <MapPopup longitude={-74.006} latitude={40.7128}>
        <div className="p-4">
          <h3 className="font-bold">New York City</h3>
          <p>A cidade que nunca dorme. População: 8.3 milhões</p>
          <button>Fechar</button>
        </div>
      </MapPopup>
    </Map>
  )
}
```

### Rotas

#### Rota Básica

```tsx
import { Map, MapRoute } from "@/components/ui/map"

export default function RouteExample() {
  const coordinates = [
    [-74.006, 40.7128], // Nova York
    [-73.935242, 40.730610], // Brooklyn
    [-73.985130, 40.758896], // Manhattan
  ]

  return (
    <Map
      className="h-[600px] w-full rounded-lg"
      initialViewState={{
        longitude: -74.006,
        latitude: 40.7128,
        zoom: 10,
      }}
    >
      <MapRoute coordinates={coordinates} />
    </Map>
  )
}
```

#### Rota Dinâmica do OSRM

```tsx
import { Map, MapRoute } from "@/components/ui/map"
import { useEffect, useState } from "react"

export default function DynamicRouteExample() {
  const [route, setRoute] = useState(null)

  useEffect(() => {
    // Buscar rota do OSRM
    const fetchRoute = async () => {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/-74.006,40.7128;-73.935242,40.730610?overview=full&geometries=geojson`
      )
      const data = await response.json()
      setRoute(data.routes[0].geometry.coordinates)
    }

    fetchRoute()
  }, [])

  return (
    <Map
      className="h-[600px] w-full rounded-lg"
      initialViewState={{
        longitude: -74.006,
        latitude: 40.7128,
        zoom: 10,
      }}
    >
      {route && <MapRoute coordinates={route} />}
    </Map>
  )
}
```

## Uso Avançado

Para exemplos de uso avançado, consulte a [documentação oficial](https://mapcn.vercel.app/docs/advanced-usage).

## Recursos Adicionais

- **Documentação Oficial:** https://mapcn.vercel.app/docs
- **MapLibre GL JS:** https://maplibre.org/maplibre-gl-js/docs/
- **Tailwind CSS:** https://tailwindcss.com/
- **shadcn/ui:** https://ui.shadcn.com/

## Anatomia dos Componentes

A estrutura básica dos componentes do mapcn segue esta hierarquia:

```
Map (componente raiz)
├── MapControl (controles do mapa)
├── MapMarker (marcadores)
│   ├── MarkerContent (conteúdo do marcador)
│   ├── MarkerPopup (popup do marcador)
│   ├── MarkerTooltip (tooltip do marcador)
│   └── MarkerLabel (rótulo do marcador)
├── MapPopup (popup independente)
└── MapRoute (rotas)
```

## Notas Importantes

1. O componente `Map` deve envolver todos os outros componentes do mapcn
2. O hook `useMap` só pode ser usado dentro de um componente `Map`
3. Os componentes de marcador (`MarkerPopup`, `MarkerTooltip`, etc.) devem ser usados dentro de `MapMarker`
4. O mapa se adapta automaticamente ao tema claro/escuro do sistema
5. Não é necessário configurar chaves de API - os tiles são gratuitos

## Suporte

Para mais informações e exemplos, visite a [documentação oficial do mapcn](https://mapcn.vercel.app/docs).

