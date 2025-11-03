/**
 * Checklist específico para inspeção visual periódica de SCBA
 */

import ChecklistItem from '../ChecklistItem';

interface ScbaChecklistProps {
  results: Record<string, string>;
  onResultChange: (question: string, value: string) => void;
  onObservationChange: (section: string, observation: string) => void;
  observations: Record<string, string>;
}

const ScbaChecklist = ({ 
  results, 
  onResultChange, 
  onObservationChange,
  observations 
}: ScbaChecklistProps) => {
  const cilindroItems = [
    "Integridade Cilindro",
    "Registro e Valvulas",
    "Manômetro do Cilindro",
    "Pressão Manômetro",
    "Mangueiras e Conexões",
    "Correias/ Tirantes e Alças"
  ];

  const mascaraItems = [
    "Integridade da Máscara",
    "Visor ou Lente",
    "Borrachas de Vedação",
    "Conector da válvula de Inalação",
    "Correias/ Tirantes",
    "Fivelas e Alças",
    "Válvula de Exalação"
  ];

  return (
    <div className="space-y-6">
      {/* Testes Funcionais */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#FFFFFF' }}>
          Testes Funcionais
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0B0' }}>
              1. Teste de Estanqueidade (Vedação Alta Pressão)
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="teste_estanqueidade"
                  value="Aprovado"
                  checked={results["Testes Funcionais.Estanqueidade Alta Pressão"] === 'Aprovado'}
                  onChange={(e) => onResultChange("Testes Funcionais.Estanqueidade Alta Pressão", e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#00C8FF' }}
                />
                <span style={{ color: '#FFFFFF' }}>Aprovado</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="teste_estanqueidade"
                  value="Reprovado"
                  checked={results["Testes Funcionais.Estanqueidade Alta Pressão"] === 'Reprovado'}
                  onChange={(e) => onResultChange("Testes Funcionais.Estanqueidade Alta Pressão", e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#00C8FF' }}
                />
                <span style={{ color: '#FFFFFF' }}>Reprovado</span>
              </label>
            </div>
            <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid' }}>
              <p className="text-xs" style={{ color: '#9E9E9E' }}>
                <strong>Instruções:</strong> 1. Trave a válvula de demanda (bypass). 2. Abra e feche completamente a válvula do cilindro. 3. Monitore os manômetros por 1 minuto. 4. Critério: A queda de pressão deve ser menor que 10 bar.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0B0' }}>
              2. Teste do Alarme Sonoro de Baixa Pressão
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="teste_alarme"
                  value="Aprovado"
                  checked={results["Testes Funcionais.Alarme de Baixa Pressão"] === 'Aprovado'}
                  onChange={(e) => onResultChange("Testes Funcionais.Alarme de Baixa Pressão", e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#00C8FF' }}
                />
                <span style={{ color: '#FFFFFF' }}>Aprovado</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="teste_alarme"
                  value="Reprovado"
                  checked={results["Testes Funcionais.Alarme de Baixa Pressão"] === 'Reprovado'}
                  onChange={(e) => onResultChange("Testes Funcionais.Alarme de Baixa Pressão", e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#00C8FF' }}
                />
                <span style={{ color: '#FFFFFF' }}>Reprovado</span>
              </label>
            </div>
            <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid' }}>
              <p className="text-xs" style={{ color: '#9E9E9E' }}>
                <strong>Instruções:</strong> 1. Com o sistema ainda pressurizado, libere o ar lentamente pelo botão de purga. 2. Observe o manômetro. 3. Critério: O alarme sonoro deve disparar entre 50-55 bar.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0B0' }}>
              3. Teste de Vedação da Peça Facial (Pressão Negativa)
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="teste_vedacao_mascara"
                  value="Aprovado"
                  checked={results["Testes Funcionais.Vedação da Máscara"] === 'Aprovado'}
                  onChange={(e) => onResultChange("Testes Funcionais.Vedação da Máscara", e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#00C8FF' }}
                />
                <span style={{ color: '#FFFFFF' }}>Aprovado</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="teste_vedacao_mascara"
                  value="Reprovado"
                  checked={results["Testes Funcionais.Vedação da Máscara"] === 'Reprovado'}
                  onChange={(e) => onResultChange("Testes Funcionais.Vedação da Máscara", e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: '#00C8FF' }}
                />
                <span style={{ color: '#FFFFFF' }}>Reprovado</span>
              </label>
            </div>
            <div className="mt-2 p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid' }}>
              <p className="text-xs" style={{ color: '#9E9E9E' }}>
                <strong>Instruções:</strong> 1. Vista a máscara e ajuste os tirantes. 2. Cubra a entrada da válvula de demanda com a mão. 3. Inspire suavemente. 4. Critério: A máscara deve ser sugada contra o rosto e permanecer assim, sem vazamentos.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: '#2A2A2A' }}></div>

      {/* Inspeção Visual dos Componentes */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#FFFFFF' }}>
          Inspeção Visual dos Componentes
        </h3>

        {/* Cilindro */}
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-3" style={{ color: '#FFFFFF' }}>
            Item 1.0 - Cilindro de Ar
          </h4>
          <div className="space-y-2">
            {cilindroItems.map((item) => (
              <div key={item} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid' }}>
                <span style={{ color: '#FFFFFF' }}>{item}</span>
                <div className="flex gap-2">
                  {['C', 'N/C', 'N/A'].map((status) => (
                    <label key={status} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name={`cil_${item}`}
                        value={status}
                        checked={results[`Cilindro.${item}`] === status}
                        onChange={(e) => onResultChange(`Cilindro.${item}`, e.target.value)}
                        className="w-4 h-4"
                        style={{ accentColor: '#00C8FF' }}
                      />
                      <span className="text-xs" style={{ color: '#B0B0B0' }}>{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0B0' }}>
              Observações - Cilindro de Ar
            </label>
            <textarea
              value={observations.Cilindro || ''}
              onChange={(e) => onObservationChange('Cilindro', e.target.value)}
              rows={2}
              className="w-full p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
              placeholder="Digite observações sobre o cilindro..."
            />
          </div>
        </div>

        {/* Máscara */}
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-3" style={{ color: '#FFFFFF' }}>
            Item 2.0 - Máscara Facial
          </h4>
          <div className="space-y-2">
            {mascaraItems.map((item) => (
              <div key={item} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid' }}>
                <span style={{ color: '#FFFFFF' }}>{item}</span>
                <div className="flex gap-2">
                  {['C', 'N/C', 'N/A'].map((status) => (
                    <label key={status} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name={`masc_${item}`}
                        value={status}
                        checked={results[`Mascara.${item}`] === status}
                        onChange={(e) => onResultChange(`Mascara.${item}`, e.target.value)}
                        className="w-4 h-4"
                        style={{ accentColor: '#00C8FF' }}
                      />
                      <span className="text-xs" style={{ color: '#B0B0B0' }}>{status}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-2" style={{ color: '#B0B0B0' }}>
              Observações - Máscara Facial
            </label>
            <textarea
              value={observations.Mascara || ''}
              onChange={(e) => onObservationChange('Mascara', e.target.value)}
              rows={2}
              className="w-full p-3 rounded-lg" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px', borderStyle: 'solid', color: '#FFFFFF' }}
              placeholder="Digite observações sobre a máscara..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScbaChecklist;

