import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes E2E
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  
  /* Executar testes em paralelo */
  fullyParallel: true,
  
  /* Falhar o build se você deixar test.only no CI */
  forbidOnly: !!process.env.CI,
  
  /* Tentar novamente no CI apenas */
  retries: process.env.CI ? 2 : 0,
  
  /* Limitar workers no CI, usar todos os disponíveis localmente */
  workers: process.env.CI ? 1 : undefined,
  
  /* Configuração de relatórios - salvar fora do diretório do app */
  reporter: [
    ['html', { outputFolder: '../test-results/playwright-report' }],
    ['json', { outputFile: '../test-results/playwright-report/results.json' }]
  ],
  
  /* Salvar resultados de testes fora do diretório do app */
  outputDir: '../test-results/playwright',
  
  /* Opções compartilhadas para todos os projetos */
  use: {
    /* URL base para usar em navegação */
    baseURL: 'http://localhost:5173',
    
    /* Coletar trace quando retentar o teste falhado */
    trace: 'on-first-retry',
    
    /* Screenshot apenas quando falhar */
    screenshot: 'only-on-failure',
  },

  /* Configurar projetos para diferentes navegadores */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Testes em dispositivos móveis */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Executar servidor de desenvolvimento antes dos testes */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

