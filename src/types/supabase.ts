export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      abrigos: {
        Row: {
          cliente: string | null
          created_at: string
          id: number
          id_abrigo: string
          itens_json: Json | null
          latitude: number | null
          local: string | null
          longitude: number | null
          numero_serie: string | null
          user_id: string | null
        }
        Insert: {
          cliente?: string | null
          created_at?: string
          id?: number
          id_abrigo: string
          itens_json?: Json | null
          latitude?: number | null
          local?: string | null
          longitude?: number | null
          numero_serie?: string | null
          user_id?: string | null
        }
        Update: {
          cliente?: string | null
          created_at?: string
          id?: number
          id_abrigo?: string
          itens_json?: Json | null
          latitude?: number | null
          local?: string | null
          longitude?: number | null
          numero_serie?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      conjuntos_autonomos: {
        Row: {
          created_at: string
          data_teste: string | null
          data_validade: string | null
          empresa_executante: string | null
          id: number
          inspetor_responsavel: string | null
          link_relatorio_pdf: string | null
          marca: string | null
          modelo: string | null
          numero_serie_equipamento: string
          numero_serie_mascara: string | null
          numero_serie_segundo_estagio: string | null
          resultado_final: string | null
          user_id: string | null
          vazamento_mascara_resultado: string | null
        }
        Insert: {
          created_at?: string
          data_teste?: string | null
          data_validade?: string | null
          empresa_executante?: string | null
          id?: number
          inspetor_responsavel?: string | null
          link_relatorio_pdf?: string | null
          marca?: string | null
          modelo?: string | null
          numero_serie_equipamento: string
          numero_serie_mascara?: string | null
          numero_serie_segundo_estagio?: string | null
          resultado_final?: string | null
          user_id?: string | null
          vazamento_mascara_resultado?: string | null
        }
        Update: {
          created_at?: string
          data_teste?: string | null
          data_validade?: string | null
          empresa_executante?: string | null
          id?: number
          inspetor_responsavel?: string | null
          link_relatorio_pdf?: string | null
          marca?: string | null
          modelo?: string | null
          numero_serie_equipamento?: string
          numero_serie_mascara?: string | null
          numero_serie_segundo_estagio?: string | null
          resultado_final?: string | null
          user_id?: string | null
          vazamento_mascara_resultado?: string | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          created_at: string
          data_validade: string | null
          equipment_id: string
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          id: number
          localizacao: string | null
          proxima_inspecao: string | null
          qr_code: string | null
          specifications: Json | null
          status: Database["public"]["Enums"]["equipment_status"]
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_validade?: string | null
          equipment_id: string
          equipment_type: Database["public"]["Enums"]["equipment_type"]
          id?: number
          localizacao?: string | null
          proxima_inspecao?: string | null
          qr_code?: string | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["equipment_status"]
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_validade?: string | null
          equipment_id?: string
          equipment_type?: Database["public"]["Enums"]["equipment_type"]
          id?: number
          localizacao?: string | null
          proxima_inspecao?: string | null
          qr_code?: string | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["equipment_status"]
          user_id?: string | null
        }
        Relationships: []
      }
      extintores: {
        Row: {
          ano_fabricacao: number | null
          aprovado_inspecao: string | null
          capacidade: number | null
          created_at: string
          data_proxima_inspecao: string | null
          data_proxima_manutencao_2_nivel: string | null
          data_proxima_manutencao_3_nivel: string | null
          data_servico: string | null
          data_ultimo_ensaio_hidrostatico: string | null
          empresa_executante: string | null
          id: number
          inspetor_responsavel: string | null
          latitude: number | null
          link_foto_nao_conformidade: string | null
          link_relatorio_pdf: string | null
          local_id: string | null
          longitude: number | null
          marca_fabricante: string | null
          numero_identificacao: string
          numero_selo_inmetro: string | null
          observacoes_gerais: string | null
          plano_de_acao: string | null
          tipo_agente: string | null
          tipo_servico: string | null
          user_id: string | null
        }
        Insert: {
          ano_fabricacao?: number | null
          aprovado_inspecao?: string | null
          capacidade?: number | null
          created_at?: string
          data_proxima_inspecao?: string | null
          data_proxima_manutencao_2_nivel?: string | null
          data_proxima_manutencao_3_nivel?: string | null
          data_servico?: string | null
          data_ultimo_ensaio_hidrostatico?: string | null
          empresa_executante?: string | null
          id?: number
          inspetor_responsavel?: string | null
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          link_relatorio_pdf?: string | null
          local_id?: string | null
          longitude?: number | null
          marca_fabricante?: string | null
          numero_identificacao: string
          numero_selo_inmetro?: string | null
          observacoes_gerais?: string | null
          plano_de_acao?: string | null
          tipo_agente?: string | null
          tipo_servico?: string | null
          user_id?: string | null
        }
        Update: {
          ano_fabricacao?: number | null
          aprovado_inspecao?: string | null
          capacidade?: number | null
          created_at?: string
          data_proxima_inspecao?: string | null
          data_proxima_manutencao_2_nivel?: string | null
          data_proxima_manutencao_3_nivel?: string | null
          data_servico?: string | null
          data_ultimo_ensaio_hidrostatico?: string | null
          empresa_executante?: string | null
          id?: number
          inspetor_responsavel?: string | null
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          link_relatorio_pdf?: string | null
          local_id?: string | null
          longitude?: number | null
          marca_fabricante?: string | null
          numero_identificacao?: string
          numero_selo_inmetro?: string | null
          observacoes_gerais?: string | null
          plano_de_acao?: string | null
          tipo_agente?: string | null
          tipo_servico?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      inspecoes_abrigos: {
        Row: {
          created_at: string
          data_inspecao: string | null
          data_proxima_inspecao: string | null
          id: number
          id_abrigo: string
          inspetor: string | null
          plano_de_acao: string | null
          resultados_json: Json | null
          status_geral: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_inspecao?: string | null
          data_proxima_inspecao?: string | null
          id?: number
          id_abrigo: string
          inspetor?: string | null
          plano_de_acao?: string | null
          resultados_json?: Json | null
          status_geral?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_inspecao?: string | null
          data_proxima_inspecao?: string | null
          id?: number
          id_abrigo?: string
          inspetor?: string | null
          plano_de_acao?: string | null
          resultados_json?: Json | null
          status_geral?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspecoes_abrigos_id_abrigo_fkey"
            columns: ["id_abrigo"]
            isOneToOne: false
            referencedRelation: "abrigos"
            referencedColumns: ["id_abrigo"]
          },
        ]
      }
      inspecoes_alarmes: {
        Row: {
          created_at: string
          data_inspecao: string | null
          data_proxima_inspecao: string | null
          id: number
          id_sistema: string
          inspetor: string | null
          link_foto_nao_conformidade: string | null
          plano_de_acao: string | null
          resultados_json: Json | null
          status_geral: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_inspecao?: string | null
          data_proxima_inspecao?: string | null
          id?: number
          id_sistema: string
          inspetor?: string | null
          link_foto_nao_conformidade?: string | null
          plano_de_acao?: string | null
          resultados_json?: Json | null
          status_geral?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_inspecao?: string | null
          data_proxima_inspecao?: string | null
          id?: number
          id_sistema?: string
          inspetor?: string | null
          link_foto_nao_conformidade?: string | null
          plano_de_acao?: string | null
          resultados_json?: Json | null
          status_geral?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspecoes_alarmes_id_sistema_fkey"
            columns: ["id_sistema"]
            isOneToOne: false
            referencedRelation: "inventario_alarmes"
            referencedColumns: ["id_sistema"]
          },
        ]
      }
      inspecoes_camaras_espuma: {
        Row: {
          created_at: string
          data_inspecao: string | null
          data_proxima_inspecao: string | null
          id: number
          id_camara: string
          inspetor: string | null
          link_foto_nao_conformidade: string | null
          plano_de_acao: string | null
          resultados_json: Json | null
          status_geral: string | null
          tipo_inspecao: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_inspecao?: string | null
          data_proxima_inspecao?: string | null
          id?: number
          id_camara: string
          inspetor?: string | null
          link_foto_nao_conformidade?: string | null
          plano_de_acao?: string | null
          resultados_json?: Json | null
          status_geral?: string | null
          tipo_inspecao?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_inspecao?: string | null
          data_proxima_inspecao?: string | null
          id?: number
          id_camara?: string
          inspetor?: string | null
          link_foto_nao_conformidade?: string | null
          plano_de_acao?: string | null
          resultados_json?: Json | null
          status_geral?: string | null
          tipo_inspecao?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspecoes_camaras_espuma_id_camara_fkey"
            columns: ["id_camara"]
            isOneToOne: false
            referencedRelation: "inventario_camaras_espuma"
            referencedColumns: ["id_camara"]
          },
        ]
      }
      inspecoes_canhoes_monitores: {
        Row: {
          created_at: string
          data_inspecao: string | null
          data_proxima_inspecao: string | null
          id: number
          id_equipamento: string
          inspetor: string | null
          link_foto_nao_conformidade: string | null
          plano_de_acao: string | null
          resultados_json: Json | null
          status_geral: string | null
          tipo_inspecao: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_inspecao?: string | null
          data_proxima_inspecao?: string | null
          id?: number
          id_equipamento: string
          inspetor?: string | null
          link_foto_nao_conformidade?: string | null
          plano_de_acao?: string | null
          resultados_json?: Json | null
          status_geral?: string | null
          tipo_inspecao?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_inspecao?: string | null
          data_proxima_inspecao?: string | null
          id?: number
          id_equipamento?: string
          inspetor?: string | null
          link_foto_nao_conformidade?: string | null
          plano_de_acao?: string | null
          resultados_json?: Json | null
          status_geral?: string | null
          tipo_inspecao?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspecoes_canhoes_monitores_id_equipamento_fkey"
            columns: ["id_equipamento"]
            isOneToOne: false
            referencedRelation: "inventario_canhoes_monitores"
            referencedColumns: ["id_equipamento"]
          },
        ]
      }
      inspecoes_chuveiros_lava_olhos: {
        Row: {
          created_at: string
          data_inspecao: string | null
          data_proxima_inspecao: string | null
          id: number
          id_equipamento: string
          inspetor: string | null
          link_foto_nao_conformidade: string | null
          plano_de_acao: string | null
          resultados_json: Json | null
          status_geral: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_inspecao?: string | null
          data_proxima_inspecao?: string | null
          id?: number
          id_equipamento: string
          inspetor?: string | null
          link_foto_nao_conformidade?: string | null
          plano_de_acao?: string | null
          resultados_json?: Json | null
          status_geral?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_inspecao?: string | null
          data_proxima_inspecao?: string | null
          id?: number
          id_equipamento?: string
          inspetor?: string | null
          link_foto_nao_conformidade?: string | null
          plano_de_acao?: string | null
          resultados_json?: Json | null
          status_geral?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspecoes_chuveiros_lava_olhos_id_equipamento_fkey"
            columns: ["id_equipamento"]
            isOneToOne: false
            referencedRelation: "inventario_chuveiros_lava_olhos"
            referencedColumns: ["id_equipamento"]
          },
        ]
      }
      inspecoes_multigas: {
        Row: {
          co_encontrado: number | null
          co_referencia: number | null
          created_at: string
          data_proximo_teste: string | null
          data_teste: string | null
          h2s_encontrado: number | null
          h2s_referencia: number | null
          id: number
          id_equipamento: string
          inspetor: string | null
          lel_encontrado: number | null
          lel_referencia: number | null
          o2_encontrado: number | null
          o2_referencia: number | null
          observacoes: string | null
          plano_de_acao: string | null
          resultado_teste: string | null
          tipo_teste: string | null
          user_id: string | null
        }
        Insert: {
          co_encontrado?: number | null
          co_referencia?: number | null
          created_at?: string
          data_proximo_teste?: string | null
          data_teste?: string | null
          h2s_encontrado?: number | null
          h2s_referencia?: number | null
          id?: number
          id_equipamento: string
          inspetor?: string | null
          lel_encontrado?: number | null
          lel_referencia?: number | null
          o2_encontrado?: number | null
          o2_referencia?: number | null
          observacoes?: string | null
          plano_de_acao?: string | null
          resultado_teste?: string | null
          tipo_teste?: string | null
          user_id?: string | null
        }
        Update: {
          co_encontrado?: number | null
          co_referencia?: number | null
          created_at?: string
          data_proximo_teste?: string | null
          data_teste?: string | null
          h2s_encontrado?: number | null
          h2s_referencia?: number | null
          id?: number
          id_equipamento?: string
          inspetor?: string | null
          lel_encontrado?: number | null
          lel_referencia?: number | null
          o2_encontrado?: number | null
          o2_referencia?: number | null
          observacoes?: string | null
          plano_de_acao?: string | null
          resultado_teste?: string | null
          tipo_teste?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspecoes_multigas_id_equipamento_fkey"
            columns: ["id_equipamento"]
            isOneToOne: false
            referencedRelation: "inventario_multigas"
            referencedColumns: ["id_equipamento"]
          },
        ]
      }
      inspecoes_scba: {
        Row: {
          created_at: string
          data_inspecao: string | null
          data_proxima_inspecao: string | null
          id: number
          inspetor: string | null
          numero_serie_equipamento: string
          plano_de_acao: string | null
          resultados_json: Json | null
          status_geral: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_inspecao?: string | null
          data_proxima_inspecao?: string | null
          id?: number
          inspetor?: string | null
          numero_serie_equipamento: string
          plano_de_acao?: string | null
          resultados_json?: Json | null
          status_geral?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_inspecao?: string | null
          data_proxima_inspecao?: string | null
          id?: number
          inspetor?: string | null
          numero_serie_equipamento?: string
          plano_de_acao?: string | null
          resultados_json?: Json | null
          status_geral?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspecoes_scba_numero_serie_equipamento_fkey"
            columns: ["numero_serie_equipamento"]
            isOneToOne: false
            referencedRelation: "conjuntos_autonomos"
            referencedColumns: ["numero_serie_equipamento"]
          },
        ]
      }
      inventario_alarmes: {
        Row: {
          created_at: string
          data_cadastro: string | null
          id: number
          id_sistema: string
          localizacao: string
          marca: string | null
          modelo: string | null
          numero_serie: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_cadastro?: string | null
          id?: number
          id_sistema: string
          localizacao: string
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_cadastro?: string | null
          id?: number
          id_sistema?: string
          localizacao?: string
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      inventario_camaras_espuma: {
        Row: {
          created_at: string
          data_cadastro: string | null
          id: number
          id_camara: string
          latitude: number | null
          localizacao: string | null
          longitude: number | null
          marca: string | null
          modelo: string | null
          numero_mcs: string | null
          numero_serie: string | null
          tamanho_especifico: string | null
          tipo_camara: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_cadastro?: string | null
          id?: number
          id_camara: string
          latitude?: number | null
          localizacao?: string | null
          longitude?: number | null
          marca?: string | null
          modelo?: string | null
          numero_mcs?: string | null
          numero_serie?: string | null
          tamanho_especifico?: string | null
          tipo_camara?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_cadastro?: string | null
          id?: number
          id_camara?: string
          latitude?: number | null
          localizacao?: string | null
          longitude?: number | null
          marca?: string | null
          modelo?: string | null
          numero_mcs?: string | null
          numero_serie?: string | null
          tamanho_especifico?: string | null
          tipo_camara?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      inventario_canhoes_monitores: {
        Row: {
          created_at: string
          data_cadastro: string | null
          id: number
          id_equipamento: string
          latitude: number | null
          localizacao: string | null
          longitude: number | null
          marca: string | null
          modelo: string | null
          numero_serie: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_cadastro?: string | null
          id?: number
          id_equipamento: string
          latitude?: number | null
          localizacao?: string | null
          longitude?: number | null
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_cadastro?: string | null
          id?: number
          id_equipamento?: string
          latitude?: number | null
          localizacao?: string | null
          longitude?: number | null
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      inventario_chuveiros_lava_olhos: {
        Row: {
          created_at: string
          data_cadastro: string | null
          id: number
          id_equipamento: string
          latitude: number | null
          localizacao: string | null
          longitude: number | null
          marca: string | null
          modelo: string | null
          numero_serie: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_cadastro?: string | null
          id?: number
          id_equipamento: string
          latitude?: number | null
          localizacao?: string | null
          longitude?: number | null
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_cadastro?: string | null
          id?: number
          id_equipamento?: string
          latitude?: number | null
          localizacao?: string | null
          longitude?: number | null
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      inventario_multigas: {
        Row: {
          co_cilindro: number | null
          created_at: string
          data_cadastro: string | null
          h2s_cilindro: number | null
          id: number
          id_equipamento: string
          lel_cilindro: number | null
          margem_erro_cilindro: number | null
          marca: string | null
          modelo: string | null
          numero_serie: string | null
          o2_cilindro: number | null
          user_id: string | null
        }
        Insert: {
          co_cilindro?: number | null
          created_at?: string
          data_cadastro?: string | null
          h2s_cilindro?: number | null
          id?: number
          id_equipamento: string
          lel_cilindro?: number | null
          margem_erro_cilindro?: number | null
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          o2_cilindro?: number | null
          user_id?: string | null
        }
        Update: {
          co_cilindro?: number | null
          created_at?: string
          data_cadastro?: string | null
          h2s_cilindro?: number | null
          id?: number
          id_equipamento?: string
          lel_cilindro?: number | null
          margem_erro_cilindro?: number | null
          marca?: string | null
          modelo?: string | null
          numero_serie?: string | null
          o2_cilindro?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      locais: {
        Row: {
          created_at: string
          id: number
          local_descricao: string
          local_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          local_descricao: string
          local_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          local_descricao?: string
          local_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      log_acoes_abrigos: {
        Row: {
          acao_realizada: string | null
          created_at: string
          data_acao: string | null
          id: number
          id_equipamento: string
          problema_original: string | null
          responsavel_acao: string | null
          user_id: string | null
        }
        Insert: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento: string
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Update: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento?: string
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_acoes_abrigos_id_equipamento_fkey"
            columns: ["id_equipamento"]
            isOneToOne: false
            referencedRelation: "abrigos"
            referencedColumns: ["id_abrigo"]
          },
        ]
      }
      log_acoes_alarmes: {
        Row: {
          acao_realizada: string | null
          created_at: string
          data_acao: string | null
          id: number
          id_equipamento: string
          photo_link: string | null
          problema_original: string | null
          responsavel_acao: string | null
          user_id: string | null
        }
        Insert: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento: string
          photo_link?: string | null
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Update: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento?: string
          photo_link?: string | null
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_acoes_alarmes_id_equipamento_fkey"
            columns: ["id_equipamento"]
            isOneToOne: false
            referencedRelation: "inventario_alarmes"
            referencedColumns: ["id_sistema"]
          },
        ]
      }
      log_acoes_camaras_espuma: {
        Row: {
          acao_realizada: string | null
          created_at: string
          data_acao: string | null
          id: number
          id_equipamento: string
          problema_original: string | null
          responsavel_acao: string | null
          user_id: string | null
        }
        Insert: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento: string
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Update: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento?: string
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_acoes_camaras_espuma_id_equipamento_fkey"
            columns: ["id_equipamento"]
            isOneToOne: false
            referencedRelation: "inventario_camaras_espuma"
            referencedColumns: ["id_camara"]
          },
        ]
      }
      log_acoes_canhoes_monitores: {
        Row: {
          acao_realizada: string | null
          created_at: string
          data_acao: string | null
          id: number
          id_equipamento: string
          photo_link: string | null
          problema_original: string | null
          responsavel_acao: string | null
          user_id: string | null
        }
        Insert: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento: string
          photo_link?: string | null
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Update: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento?: string
          photo_link?: string | null
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_acoes_canhoes_monitores_id_equipamento_fkey"
            columns: ["id_equipamento"]
            isOneToOne: false
            referencedRelation: "inventario_canhoes_monitores"
            referencedColumns: ["id_equipamento"]
          },
        ]
      }
      log_acoes_chuveiros_lava_olhos: {
        Row: {
          acao_realizada: string | null
          created_at: string
          data_acao: string | null
          id: number
          id_equipamento: string
          photo_link: string | null
          problema_original: string | null
          responsavel_acao: string | null
          user_id: string | null
        }
        Insert: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento: string
          photo_link?: string | null
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Update: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento?: string
          photo_link?: string | null
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_acoes_chuveiros_lava_olhos_id_equipamento_fkey"
            columns: ["id_equipamento"]
            isOneToOne: false
            referencedRelation: "inventario_chuveiros_lava_olhos"
            referencedColumns: ["id_equipamento"]
          },
        ]
      }
      log_acoes_extintores: {
        Row: {
          acao_realizada: string | null
          created_at: string
          data_acao: string | null
          id: number
          id_equipamento: string
          id_substituto: string | null
          photo_link: string | null
          problema_original: string | null
          responsavel_acao: string | null
          user_id: string | null
        }
        Insert: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento: string
          id_substituto?: string | null
          photo_link?: string | null
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Update: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento?: string
          id_substituto?: string | null
          photo_link?: string | null
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_acoes_extintores_id_equipamento_fkey"
            columns: ["id_equipamento"]
            isOneToOne: false
            referencedRelation: "extintores"
            referencedColumns: ["numero_identificacao"]
          },
        ]
      }
      log_acoes_multigas: {
        Row: {
          acao_realizada: string | null
          created_at: string
          data_acao: string | null
          id: number
          id_equipamento: string
          photo_link: string | null
          problema_original: string | null
          responsavel_acao: string | null
          user_id: string | null
        }
        Insert: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento: string
          photo_link?: string | null
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Update: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento?: string
          photo_link?: string | null
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_acoes_multigas_id_equipamento_fkey"
            columns: ["id_equipamento"]
            isOneToOne: false
            referencedRelation: "inventario_multigas"
            referencedColumns: ["id_equipamento"]
          },
        ]
      }
      log_acoes_scba: {
        Row: {
          acao_realizada: string | null
          created_at: string
          data_acao: string | null
          id: number
          id_equipamento: string
          problema_original: string | null
          responsavel_acao: string | null
          user_id: string | null
        }
        Insert: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento: string
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Update: {
          acao_realizada?: string | null
          created_at?: string
          data_acao?: string | null
          id?: number
          id_equipamento?: string
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_acoes_scba_id_equipamento_fkey"
            columns: ["id_equipamento"]
            isOneToOne: false
            referencedRelation: "conjuntos_autonomos"
            referencedColumns: ["numero_serie_equipamento"]
          },
        ]
      }
      log_baixa_extintores: {
        Row: {
          created_at: string
          data_baixa: string | null
          id: number
          link_foto_evidencia: string | null
          motivo_condenacao: string | null
          numero_identificacao: string
          numero_identificacao_substituto: string | null
          observacoes: string | null
          responsavel_baixa: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data_baixa?: string | null
          id?: number
          link_foto_evidencia?: string | null
          motivo_condenacao?: string | null
          numero_identificacao: string
          numero_identificacao_substituto?: string | null
          observacoes?: string | null
          responsavel_baixa?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data_baixa?: string | null
          id?: number
          link_foto_evidencia?: string | null
          motivo_condenacao?: string | null
          numero_identificacao?: string
          numero_identificacao_substituto?: string | null
          observacoes?: string | null
          responsavel_baixa?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "log_baixa_extintores_numero_identificacao_fkey"
            columns: ["numero_identificacao"]
            isOneToOne: false
            referencedRelation: "extintores"
            referencedColumns: ["numero_identificacao"]
          },
        ]
      }
      mangueiras: {
        Row: {
          ano_fabricacao: number | null
          comprimento: number | null
          created_at: string
          data_inspecao: string | null
          data_proximo_teste: string | null
          diametro: number | null
          empresa_executante: string | null
          id: number
          id_mangueira: string
          link_certificado_pdf: string | null
          marca: string | null
          registrado_por: string | null
          resp_tecnico_certificado: string | null
          resultado: string | null
          tipo: string | null
          user_id: string | null
        }
        Insert: {
          ano_fabricacao?: number | null
          comprimento?: number | null
          created_at?: string
          data_inspecao?: string | null
          data_proximo_teste?: string | null
          diametro?: number | null
          empresa_executante?: string | null
          id?: number
          id_mangueira: string
          link_certificado_pdf?: string | null
          marca?: string | null
          registrado_por?: string | null
          resp_tecnico_certificado?: string | null
          resultado?: string | null
          tipo?: string | null
          user_id?: string | null
        }
        Update: {
          ano_fabricacao?: number | null
          comprimento?: number | null
          created_at?: string
          data_inspecao?: string | null
          data_proximo_teste?: string | null
          diametro?: number | null
          empresa_executante?: string | null
          id?: number
          id_mangueira?: string
          link_certificado_pdf?: string | null
          marca?: string | null
          registrado_por?: string | null
          resp_tecnico_certificado?: string | null
          resultado?: string | null
          tipo?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          plan: Database["public"]["Enums"]["user_plan"] | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          plan?: Database["public"]["Enums"]["user_plan"] | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["user_plan"] | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inspections: {
        Row: {
          created_at: string
          equipment_id: number
          id: number
          inspection_date: string
          notes: string | null
          status: "aprovado" | "reprovado" | "pendente"
          user_id: string
        }
        Insert: {
          created_at?: string
          equipment_id: number
          id?: number
          inspection_date?: string
          notes?: string | null
          status: "aprovado" | "reprovado" | "pendente"
          user_id: string
        }
        Update: {
          created_at?: string
          equipment_id?: number
          id?: number
          inspection_date?: string
          notes?: string | null
          status?: "aprovado" | "reprovado" | "pendente"
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      equipment_status:
        | "ok"
        | "vencido"
        | "pendente"
        | "nao_conforme"
        | "baixado"
      equipment_type:
        | "extintor"
        | "mangueira"
        | "abrigo"
        | "scba"
        | "chuveiro_lavaolhos"
        | "camara_espuma"
        | "multigas"
        | "alarme"
        | "canhao_monitor"
      user_plan: "trial" | "premium"
      user_role: "user" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      equipment_status: [
        "ok",
        "vencido",
        "pendente",
        "nao_conforme",
        "baixado",
      ],
      equipment_type: [
        "extintor",
        "mangueira",
        "abrigo",
        "scba",
        "chuveiro_lavaolhos",
        "camara_espuma",
        "multigas",
        "alarme",
        "canhao_monitor",
      ],
      user_plan: ["trial", "premium"],
      user_role: ["user", "admin"],
    },
  },
} as const
