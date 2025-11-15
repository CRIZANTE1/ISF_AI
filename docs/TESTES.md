# Guia de Testes Automatizados

Este projeto usa **Vitest** e **React Testing Library** para testes automatizados, similar ao flake8 para Python.

## 📦 Bibliotecas Instaladas

### Testes Unitários e de Componentes
- **Vitest**: Framework de testes rápido e moderno (compatível com Vite)
- **React Testing Library**: Para testar componentes React de forma realista
- **@testing-library/jest-dom**: Matchers adicionais para DOM
- **@testing-library/user-event**: Simular interações do usuário
- **jsdom**: Ambiente DOM para testes

### Testes E2E (End-to-End) - Opcional
Para testes completos do app, você pode adicionar:
- **Playwright**: Recomendado para testes E2E modernos
- **Cypress**: Alternativa popular

## 🚀 Comandos Disponíveis

```bash
# Executar testes em modo watch (desenvolvimento)
npm run test

# Executar testes com interface gráfica
npm run test:ui

# Executar testes uma vez e gerar relatório de cobertura
npm run test:coverage

# Executar testes uma vez (CI/CD)
npm run test:run
```

## 📝 Exemplo de Teste

Veja o arquivo de exemplo: `src/components/__tests__/FloatingActionButton.test.tsx`

## 🔧 Configuração

- **vitest.config.ts**: Configuração principal do Vitest
- **src/test/setup.ts**: Setup global para todos os testes

## 📚 Recursos

- [Documentação do Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright](https://playwright.dev/) - Para testes E2E

## 💡 Próximos Passos

1. Instalar as dependências: `npm install`
2. Criar mais testes para seus componentes
3. ✅ **Playwright configurado!** Execute `npm run test:e2e` para testes E2E completos

## 🎭 Testes E2E com Playwright

### Comandos Disponíveis

```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar com interface gráfica
npm run test:e2e:ui

# Executar em modo headed (ver o navegador)
npm run test:e2e:headed

# Executar em modo debug
npm run test:e2e:debug
```

### Configuração

- **playwright.config.ts**: Configuração principal do Playwright
- **e2e/**: Pasta com os testes E2E
- **e2e/example.spec.ts**: Exemplo básico de testes E2E
- **e2e/app-complete.spec.ts**: ✅ **Testes E2E completos do app** (recomendado)

### Testes Disponíveis

O arquivo `app-complete.spec.ts` contém testes completos para:

- ✅ **Autenticação**: Login, signup, redirecionamentos
- ✅ **Navegação**: Barra principal, todos os botões, posicionamento
- ✅ **Dashboard**: Carregamento, estatísticas, elementos principais
- ✅ **Página de Inspeções**: Seletor orbital, tipos de equipamentos
- ✅ **Lista de Equipamentos**: Todos os tipos (extintor, mangueira, scba, etc.)
- ✅ **Adicionar Equipamento**: Navegação e formulários
- ✅ **Perfil do Usuário**: Páginas de perfil e configurações
- ✅ **Histórico**: Página de histórico de inspeções
- ✅ **Mapa**: Página de mapa de equipamentos
- ✅ **Rotas Protegidas**: Proteção de rotas admin e autenticação
- ✅ **Responsividade**: Testes em mobile, tablet e desktop
- ✅ **Acessibilidade**: Labels, contraste, elementos acessíveis
- ✅ **Performance**: Tempo de carregamento, otimização de imagens
- ✅ **Fluxos Completos**: Fluxo end-to-end de adicionar equipamento

### Instalar Navegadores

Após instalar o Playwright, execute:
```bash
npx playwright install
```

Isso instalará os navegadores necessários (Chromium, Firefox, WebKit).

