import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Componente para verificar e diagnosticar problemas de configuração do Supabase
 * Use este componente temporariamente para diagnosticar problemas de conexão
 */
export default function SupabaseConfigChecker() {
  const [configStatus, setConfigStatus] = useState<{
    hasUrl: boolean;
    hasKey: boolean;
    urlValid: boolean;
    keyValid: boolean;
    connectionTest: 'pending' | 'testing' | 'success' | 'failed';
    errorMessage?: string;
  }>({
    hasUrl: false,
    hasKey: false,
    urlValid: false,
    keyValid: false,
    connectionTest: 'pending',
  });

  useEffect(() => {
    const checkConfig = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const status = {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        urlValid: false,
        keyValid: false,
        connectionTest: 'pending' as const,
        errorMessage: undefined as string | undefined,
      };

      // Validar URL
      if (supabaseUrl) {
        status.urlValid = 
          supabaseUrl.startsWith('https://') && 
          supabaseUrl.includes('.supabase.co') &&
          !supabaseUrl.endsWith('/');
      }

      // Validar chave
      if (supabaseAnonKey) {
        status.keyValid = supabaseAnonKey.length > 50;
      }

      setConfigStatus(status);

      // Testar conexão
      if (status.hasUrl && status.hasKey && status.urlValid && status.keyValid) {
        status.connectionTest = 'testing';
        setConfigStatus({ ...status });

        try {
          // Criar um timeout para o teste de conexão (10 segundos)
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout: A conexão demorou mais de 10 segundos')), 10000);
          });

          // Tentar fazer uma requisição simples ao Supabase usando fetch diretamente primeiro
          // Isso ajuda a identificar se o problema é com o Supabase ou com a configuração
          const testUrl = `${supabaseUrl}/rest/v1/`;
          const testHeaders = {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
          };

          // Teste 1: Verificar se a URL está acessível
          const urlTestController = new AbortController();
          const urlTestTimeout = setTimeout(() => urlTestController.abort(), 5000); // 5 segundos
          
          const urlTestPromise = fetch(testUrl, {
            method: 'HEAD',
            headers: testHeaders,
            signal: urlTestController.signal,
          }).then(response => {
            clearTimeout(urlTestTimeout);
            // Qualquer resposta (mesmo erro) significa que a URL está acessível
            return { urlAccessible: true, status: response.status };
          }).catch(() => {
            clearTimeout(urlTestTimeout);
            return { urlAccessible: false };
          });

          const urlTest = await Promise.race([urlTestPromise, timeoutPromise]) as any;
          
          if (!urlTest?.urlAccessible) {
            status.connectionTest = 'failed';
            status.errorMessage = 'Não foi possível acessar a URL do Supabase. Verifique se a URL está correta e se o projeto está ativo.';
            setConfigStatus({ ...status });
            return;
          }

          // Teste 2: Tentar autenticação (mais leve que getSession)
          const authTestPromise = supabase.auth.getSession();
          const result = await Promise.race([authTestPromise, timeoutPromise]) as any;
          
          if (result?.error) {
            status.connectionTest = 'failed';
            status.errorMessage = result.error.message || 'Erro ao conectar com o Supabase';
            
            // Mensagens mais amigáveis para erros comuns
            if (result.error.message?.includes('Failed to fetch')) {
              status.errorMessage = 'Não foi possível conectar ao Supabase. Verifique sua conexão com a internet e se a URL está correta.';
            } else if (result.error.message?.includes('Invalid API key')) {
              status.errorMessage = 'Chave da API inválida. Verifique se copiou a chave anon/public correta do painel do Supabase.';
            } else if (result.error.message?.includes('JWT')) {
              status.errorMessage = 'Chave da API inválida ou expirada. Obtenha uma nova chave no painel do Supabase.';
            }
          } else {
            status.connectionTest = 'success';
          }
        } catch (err: any) {
          status.connectionTest = 'failed';
          
          if (err?.message?.includes('Timeout')) {
            status.errorMessage = 'A conexão está demorando muito. Possíveis causas: internet lenta, URL incorreta, ou projeto Supabase pausado.';
          } else if (err?.message?.includes('Failed to fetch') || err?.name === 'TypeError') {
            status.errorMessage = 'Erro de rede. Verifique sua conexão com a internet e se o projeto Supabase está ativo.';
          } else {
            status.errorMessage = err?.message || 'Erro desconhecido ao testar conexão';
          }
        }

        setConfigStatus({ ...status });
      } else {
        status.connectionTest = 'failed';
        if (!status.hasUrl || !status.hasKey) {
          status.errorMessage = 'Variáveis de ambiente não encontradas';
        } else if (!status.urlValid) {
          status.errorMessage = 'URL do Supabase inválida';
        } else if (!status.keyValid) {
          status.errorMessage = 'Chave anônima do Supabase inválida';
        }
        setConfigStatus({ ...status });
      }
    };

    checkConfig();
  }, []);

  const getStatusIcon = (status: boolean) => (status ? '✅' : '❌');
  const getStatusText = (status: boolean) => (status ? 'OK' : 'ERRO');

  return (
    <div className="p-6 bg-black/90 border border-white/30 rounded-lg max-w-2xl mx-auto mt-8">
      <h2 className="text-xl font-bold text-white mb-4">Diagnóstico de Configuração do Supabase</h2>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between p-3 bg-white/5 rounded">
          <span className="text-white/80">Arquivo .env existe</span>
          <span className="font-mono">
            {getStatusIcon(configStatus.hasUrl && configStatus.hasKey)} {getStatusText(configStatus.hasUrl && configStatus.hasKey)}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded">
          <span className="text-white/80">VITE_SUPABASE_URL configurada</span>
          <span className="font-mono">
            {getStatusIcon(configStatus.hasUrl)} {getStatusText(configStatus.hasUrl)}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded">
          <span className="text-white/80">VITE_SUPABASE_ANON_KEY configurada</span>
          <span className="font-mono">
            {getStatusIcon(configStatus.hasKey)} {getStatusText(configStatus.hasKey)}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded">
          <span className="text-white/80">Formato da URL válido</span>
          <span className="font-mono">
            {getStatusIcon(configStatus.urlValid)} {getStatusText(configStatus.urlValid)}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded">
          <span className="text-white/80">Formato da chave válido</span>
          <span className="font-mono">
            {getStatusIcon(configStatus.keyValid)} {getStatusText(configStatus.keyValid)}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded">
          <span className="text-white/80">Teste de conexão</span>
          <span className="font-mono">
            {configStatus.connectionTest === 'testing' && '🔄 Testando...'}
            {configStatus.connectionTest === 'success' && '✅ Sucesso'}
            {configStatus.connectionTest === 'failed' && '❌ Falhou'}
            {configStatus.connectionTest === 'pending' && '⏳ Pendente'}
          </span>
        </div>

        {configStatus.errorMessage && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-xs">
            <strong>Erro:</strong> {configStatus.errorMessage}
          </div>
        )}

        {configStatus.connectionTest === 'failed' && (
          <div className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-300 text-xs space-y-2">
            <p><strong>Como resolver:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Verifique se o projeto Supabase está ativo (não pausado) em <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="underline">app.supabase.com</a></li>
              <li>Verifique sua conexão com a internet</li>
              <li>Confirme que a URL no arquivo <code className="bg-black/30 px-1 rounded">.env</code> está correta e acessível</li>
              <li>Verifique se copiou a chave <strong>anon/public</strong> correta (não a service_role)</li>
              <li>Reinicie o servidor de desenvolvimento após modificar o <code className="bg-black/30 px-1 rounded">.env</code></li>
              <li>Verifique o console do navegador (F12) para mais detalhes do erro</li>
              <li>Tente acessar a URL do Supabase diretamente no navegador para verificar se está online</li>
            </ol>
          </div>
        )}

        {configStatus.connectionTest === 'testing' && (
          <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded text-blue-300 text-xs">
            <p>⏳ Testando conexão com o Supabase... Isso pode levar alguns segundos.</p>
            <p className="mt-2 text-blue-400/80">Se demorar mais de 10 segundos, verifique sua conexão com a internet.</p>
          </div>
        )}

        {configStatus.connectionTest === 'success' && (
          <div className="p-4 bg-green-500/20 border border-green-500/50 rounded text-green-300 text-xs">
            <p>✅ Conexão com o Supabase estabelecida com sucesso!</p>
            <p className="mt-2 text-green-400/80">Você pode tentar fazer login agora.</p>
          </div>
        )}
      </div>
    </div>
  );
}

