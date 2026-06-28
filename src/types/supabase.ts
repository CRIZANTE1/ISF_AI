export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
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
      blocked_ips: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          blocked_until: string | null
          id: string
          ip_address: unknown
          is_active: boolean | null
          metadata: Json | null
          policy_id: string | null
          reason: string
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          blocked_until?: string | null
          id?: string
          ip_address: unknown
          is_active?: boolean | null
          metadata?: Json | null
          policy_id?: string | null
          reason: string
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          blocked_until?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean | null
          metadata?: Json | null
          policy_id?: string | null
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_ips_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "security_policies"
            referencedColumns: ["id"]
          },
        ]
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
      custom_checklist_items: {
        Row: {
          action_plan_template: string | null
          created_at: string | null
          id: string
          item_order: number | null
          question_text: string
          section_id: string | null
        }
        Insert: {
          action_plan_template?: string | null
          created_at?: string | null
          id?: string
          item_order?: number | null
          question_text: string
          section_id?: string | null
        }
        Update: {
          action_plan_template?: string | null
          created_at?: string | null
          id?: string
          item_order?: number | null
          question_text?: string
          section_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_checklist_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "custom_checklist_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_checklist_sections: {
        Row: {
          checklist_id: string | null
          created_at: string | null
          id: string
          section_name: string
          section_order: number | null
        }
        Insert: {
          checklist_id?: string | null
          created_at?: string | null
          id?: string
          section_name: string
          section_order?: number | null
        }
        Update: {
          checklist_id?: string | null
          created_at?: string | null
          id?: string
          section_name?: string
          section_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_checklist_sections_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "custom_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_checklists: {
        Row: {
          created_at: string | null
          description: string | null
          equipment_type_id: string | null
          id: string
          inspection_type: string | null
          is_active: boolean | null
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          equipment_type_id?: string | null
          id?: string
          inspection_type?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          equipment_type_id?: string | null
          id?: string
          inspection_type?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_checklists_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "custom_equipment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_equipment: {
        Row: {
          created_at: string | null
          custom_fields: Json | null
          data_cadastro: string | null
          equipment_type_id: string | null
          id: string
          id_equipamento: string
          latitude: number | null
          localizacao: string | null
          longitude: number | null
          numero_serie: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_fields?: Json | null
          data_cadastro?: string | null
          equipment_type_id?: string | null
          id?: string
          id_equipamento: string
          latitude?: number | null
          localizacao?: string | null
          longitude?: number | null
          numero_serie?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_fields?: Json | null
          data_cadastro?: string | null
          equipment_type_id?: string | null
          id?: string
          id_equipamento?: string
          latitude?: number | null
          localizacao?: string | null
          longitude?: number | null
          numero_serie?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_equipment_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "custom_equipment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_equipment_fields: {
        Row: {
          created_at: string | null
          display_order: number | null
          equipment_type_id: string | null
          field_label: string
          field_name: string
          field_type: string
          id: string
          is_required: boolean | null
          options: Json | null
          placeholder: string | null
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          equipment_type_id?: string | null
          field_label: string
          field_name: string
          field_type: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
          placeholder?: string | null
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          equipment_type_id?: string | null
          field_label?: string
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          options?: Json | null
          placeholder?: string | null
          validation_rules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_equipment_fields_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "custom_equipment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_equipment_inspections: {
        Row: {
          created_at: string | null
          data_inspecao: string | null
          data_proxima_inspecao: string | null
          equipment_type_id: string | null
          id: string
          id_equipamento: string
          inspetor: string | null
          latitude: number | null
          link_foto_nao_conformidade: string | null
          longitude: number | null
          plano_de_acao: string | null
          resultados_json: Json | null
          status_geral: string | null
          tipo_inspecao: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_inspecao?: string | null
          data_proxima_inspecao?: string | null
          equipment_type_id?: string | null
          id?: string
          id_equipamento: string
          inspetor?: string | null
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          longitude?: number | null
          plano_de_acao?: string | null
          resultados_json?: Json | null
          status_geral?: string | null
          tipo_inspecao?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_inspecao?: string | null
          data_proxima_inspecao?: string | null
          equipment_type_id?: string | null
          id?: string
          id_equipamento?: string
          inspetor?: string | null
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          longitude?: number | null
          plano_de_acao?: string | null
          resultados_json?: Json | null
          status_geral?: string | null
          tipo_inspecao?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_equipment_inspections_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "custom_equipment_types"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_equipment_types: {
        Row: {
          created_at: string | null
          description: string | null
          has_data_cadastro: boolean | null
          icon_name: string | null
          id: string
          id_field_label: string
          id_field_name: string
          is_active: boolean | null
          name: string
          requires_gps: boolean | null
          requires_location: boolean | null
          slug: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          has_data_cadastro?: boolean | null
          icon_name?: string | null
          id?: string
          id_field_label?: string
          id_field_name?: string
          is_active?: boolean | null
          name: string
          requires_gps?: boolean | null
          requires_location?: boolean | null
          slug: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          has_data_cadastro?: boolean | null
          icon_name?: string | null
          id?: string
          id_field_label?: string
          id_field_name?: string
          is_active?: boolean | null
          name?: string
          requires_gps?: boolean | null
          requires_location?: boolean | null
          slug?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      device_push_tokens: {
        Row: {
          fcm_token: string
          id: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          fcm_token: string
          id?: string
          platform?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          fcm_token?: string
          id?: string
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          email_address: string | null
          email_type: string
          id: string
          sent_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          email_address?: string | null
          email_type: string
          id?: string
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          email_address?: string | null
          email_type?: string
          id?: string
          sent_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      extintores: {
        Row: {
          ano_fabricacao: number | null
          capacidade: number | null
          created_at: string
          id: number
          marca_fabricante: string | null
          numero_identificacao: string
          numero_serie: string | null
          peso_cheio_placa_kg: number | null
          peso_vazio_conjunto_kg: number | null
          tipo_agente: string | null
          user_id: string | null
        }
        Insert: {
          ano_fabricacao?: number | null
          capacidade?: number | null
          created_at?: string
          id?: number
          marca_fabricante?: string | null
          numero_identificacao: string
          numero_serie?: string | null
          peso_cheio_placa_kg?: number | null
          peso_vazio_conjunto_kg?: number | null
          tipo_agente?: string | null
          user_id?: string | null
        }
        Update: {
          ano_fabricacao?: number | null
          capacidade?: number | null
          created_at?: string
          id?: number
          marca_fabricante?: string | null
          numero_identificacao?: string
          numero_serie?: string | null
          peso_cheio_placa_kg?: number | null
          peso_vazio_conjunto_kg?: number | null
          tipo_agente?: string | null
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
          latitude: number | null
          longitude: number | null
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
          latitude?: number | null
          longitude?: number | null
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
          latitude?: number | null
          longitude?: number | null
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
          latitude: number | null
          link_foto_nao_conformidade: string | null
          longitude: number | null
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
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          longitude?: number | null
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
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          longitude?: number | null
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
          latitude: number | null
          link_foto_nao_conformidade: string | null
          longitude: number | null
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
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          longitude?: number | null
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
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          longitude?: number | null
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
          latitude: number | null
          link_foto_nao_conformidade: string | null
          longitude: number | null
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
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          longitude?: number | null
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
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          longitude?: number | null
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
          latitude: number | null
          link_foto_nao_conformidade: string | null
          longitude: number | null
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
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          longitude?: number | null
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
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          longitude?: number | null
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
      inspecoes_extintores: {
        Row: {
          aprovado_inspecao: string | null
          carga_nominal_kg: number | null
          created_at: string | null
          data_proxima_inspecao: string | null
          data_proxima_manutencao_2_nivel: string | null
          data_proxima_manutencao_3_nivel: string | null
          data_proxima_pesagem_co2: string | null
          data_servico: string
          data_ultimo_ensaio_hidrostatico: string | null
          empresa_executante: string | null
          id: number
          inspetor_responsavel: string | null
          latitude: number | null
          link_foto_nao_conformidade: string | null
          link_relatorio_pdf: string | null
          longitude: number | null
          numero_identificacao: string
          numero_selo_inmetro: string | null
          observacoes_gerais: string | null
          perda_kg: number | null
          peso_cheio_placa_snapshot_kg: number | null
          peso_medido_conjunto_kg: number | null
          plano_de_acao: string | null
          status_geral: string | null
          tipo_servico: string | null
          user_id: string | null
        }
        Insert: {
          aprovado_inspecao?: string | null
          carga_nominal_kg?: number | null
          created_at?: string | null
          data_proxima_inspecao?: string | null
          data_proxima_manutencao_2_nivel?: string | null
          data_proxima_manutencao_3_nivel?: string | null
          data_proxima_pesagem_co2?: string | null
          data_servico: string
          data_ultimo_ensaio_hidrostatico?: string | null
          empresa_executante?: string | null
          id?: number
          inspetor_responsavel?: string | null
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          link_relatorio_pdf?: string | null
          longitude?: number | null
          numero_identificacao: string
          numero_selo_inmetro?: string | null
          observacoes_gerais?: string | null
          perda_kg?: number | null
          peso_cheio_placa_snapshot_kg?: number | null
          peso_medido_conjunto_kg?: number | null
          plano_de_acao?: string | null
          status_geral?: string | null
          tipo_servico?: string | null
          user_id?: string | null
        }
        Update: {
          aprovado_inspecao?: string | null
          carga_nominal_kg?: number | null
          created_at?: string | null
          data_proxima_inspecao?: string | null
          data_proxima_manutencao_2_nivel?: string | null
          data_proxima_manutencao_3_nivel?: string | null
          data_proxima_pesagem_co2?: string | null
          data_servico?: string
          data_ultimo_ensaio_hidrostatico?: string | null
          empresa_executante?: string | null
          id?: number
          inspetor_responsavel?: string | null
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          link_relatorio_pdf?: string | null
          longitude?: number | null
          numero_identificacao?: string
          numero_selo_inmetro?: string | null
          observacoes_gerais?: string | null
          perda_kg?: number | null
          peso_cheio_placa_snapshot_kg?: number | null
          peso_medido_conjunto_kg?: number | null
          plano_de_acao?: string | null
          status_geral?: string | null
          tipo_servico?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      inspecoes_mangueiras: {
        Row: {
          created_at: string | null
          data_inspecao: string
          data_proxima_inspecao: string | null
          id: number
          id_mangueira: string
          inspetor: string | null
          latitude: number | null
          link_foto_nao_conformidade: string | null
          longitude: number | null
          observacoes: string | null
          plano_de_acao: string | null
          resultado: string
          resultados_json: Json | null
          status_geral: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_inspecao: string
          data_proxima_inspecao?: string | null
          id?: number
          id_mangueira: string
          inspetor?: string | null
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          longitude?: number | null
          observacoes?: string | null
          plano_de_acao?: string | null
          resultado: string
          resultados_json?: Json | null
          status_geral?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_inspecao?: string
          data_proxima_inspecao?: string | null
          id?: number
          id_mangueira?: string
          inspetor?: string | null
          latitude?: number | null
          link_foto_nao_conformidade?: string | null
          longitude?: number | null
          observacoes?: string | null
          plano_de_acao?: string | null
          resultado?: string
          resultados_json?: Json | null
          status_geral?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_mangueira"
            columns: ["id_mangueira"]
            isOneToOne: false
            referencedRelation: "mangueiras"
            referencedColumns: ["id_mangueira"]
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
          marca: string | null
          margem_erro_cilindro: number | null
          margem_erro_co: number | null
          margem_erro_h2s: number | null
          margem_erro_lel: number | null
          margem_erro_o2: number | null
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
          marca?: string | null
          margem_erro_cilindro?: number | null
          margem_erro_co?: number | null
          margem_erro_h2s?: number | null
          margem_erro_lel?: number | null
          margem_erro_o2?: number | null
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
          marca?: string | null
          margem_erro_cilindro?: number | null
          margem_erro_co?: number | null
          margem_erro_h2s?: number | null
          margem_erro_lel?: number | null
          margem_erro_o2?: number | null
          modelo?: string | null
          numero_serie?: string | null
          o2_cilindro?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      licenses: {
        Row: {
          activation_token: string | null
          client_email: string | null
          client_name: string | null
          created_at: string
          id: string
          install_date: string
          is_active: boolean
          is_lifetime: boolean
          last_activation_date: string | null
          license_type: Database["public"]["Enums"]["license_type_enum"] | null
          machine_id: string
          notes: string | null
          revoked_at: string | null
          revoked_by: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activation_token?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          install_date?: string
          is_active?: boolean
          is_lifetime?: boolean
          last_activation_date?: string | null
          license_type?: Database["public"]["Enums"]["license_type_enum"] | null
          machine_id: string
          notes?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activation_token?: string | null
          client_email?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          install_date?: string
          is_active?: boolean
          is_lifetime?: boolean
          last_activation_date?: string | null
          license_type?: Database["public"]["Enums"]["license_type_enum"] | null
          machine_id?: string
          notes?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string
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
          inspection_id: number | null
          photo_link: string | null
          plano_resolvido: boolean | null
          plano_resolvido_em: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
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
          inspection_id: number | null
          photo_link: string | null
          plano_resolvido: boolean | null
          plano_resolvido_em: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
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
          inspection_id: number | null
          photo_link: string | null
          plano_resolvido: boolean | null
          plano_resolvido_em: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
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
          inspection_id: number | null
          photo_link: string | null
          plano_resolvido: boolean | null
          plano_resolvido_em: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
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
          inspection_id: number | null
          photo_link: string | null
          plano_resolvido: boolean | null
          plano_resolvido_em: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
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
          inspection_id: number | null
          photo_link: string | null
          plano_resolvido: boolean | null
          plano_resolvido_em: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      log_acoes_mangueiras: {
        Row: {
          acao_realizada: string | null
          data_acao: string | null
          id: number
          id_mangueira: number | null
          inspection_id: number | null
          photo_link: string | null
          plano_resolvido: boolean | null
          plano_resolvido_em: string | null
          problema_original: string | null
          responsavel_acao: string | null
          user_id: string | null
        }
        Insert: {
          acao_realizada?: string | null
          data_acao?: string | null
          id?: number
          id_mangueira?: number | null
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Update: {
          acao_realizada?: string | null
          data_acao?: string | null
          id?: number
          id_mangueira?: number | null
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
          problema_original?: string | null
          responsavel_acao?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      log_acoes_multigas: {
        Row: {
          acao_realizada: string | null
          created_at: string
          data_acao: string | null
          id: number
          id_equipamento: string
          inspection_id: number | null
          photo_link: string | null
          plano_resolvido: boolean | null
          plano_resolvido_em: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
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
          inspection_id: number | null
          photo_link: string | null
          plano_resolvido: boolean | null
          plano_resolvido_em: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
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
          inspection_id?: number | null
          photo_link?: string | null
          plano_resolvido?: boolean | null
          plano_resolvido_em?: string | null
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
        Relationships: []
      }
      log_retention_config: {
        Row: {
          access_logs_retention_days: number
          action_logs_retention_days: number
          id: number
          last_cleanup_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_logs_retention_days?: number
          action_logs_retention_days?: number
          id?: number
          last_cleanup_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_logs_retention_days?: number
          action_logs_retention_days?: number
          id?: number
          last_cleanup_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      mangueiras: {
        Row: {
          ano_fabricacao: number | null
          comprimento: number | null
          created_at: string
          diametro: number | null
          id: number
          id_mangueira: string
          marca: string | null
          numero_serie: string | null
          tipo: string | null
          user_id: string | null
        }
        Insert: {
          ano_fabricacao?: number | null
          comprimento?: number | null
          created_at?: string
          diametro?: number | null
          id?: number
          id_mangueira: string
          marca?: string | null
          numero_serie?: string | null
          tipo?: string | null
          user_id?: string | null
        }
        Update: {
          ano_fabricacao?: number | null
          comprimento?: number | null
          created_at?: string
          diametro?: number | null
          id?: number
          id_mangueira?: string
          marca?: string | null
          numero_serie?: string | null
          tipo?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          app_tours: Json
          avatar_url: string | null
          dev: boolean
          full_name: string | null
          id: string
          plan: Database["public"]["Enums"]["user_plan"] | null
          role: Database["public"]["Enums"]["user_role"] | null
          trial_ends_at: string | null
          updated_at: string | null
          weekly_inspection_goal: number
        }
        Insert: {
          app_tours?: Json
          avatar_url?: string | null
          dev?: boolean
          full_name?: string | null
          id: string
          plan?: Database["public"]["Enums"]["user_plan"] | null
          role?: Database["public"]["Enums"]["user_role"] | null
          trial_ends_at?: string | null
          updated_at?: string | null
          weekly_inspection_goal?: number
        }
        Update: {
          app_tours?: Json
          avatar_url?: string | null
          dev?: boolean
          full_name?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["user_plan"] | null
          role?: Database["public"]["Enums"]["user_role"] | null
          trial_ends_at?: string | null
          updated_at?: string | null
          weekly_inspection_goal?: number
        }
        Relationships: []
      }
      purchases: {
        Row: {
          acknowledged: boolean | null
          created_at: string
          id: string
          order_id: string | null
          original_json: Json | null
          product_id: string
          purchase_state: number
          purchase_time: string
          purchase_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          created_at?: string
          id?: string
          order_id?: string | null
          original_json?: Json | null
          product_id: string
          purchase_state?: number
          purchase_time: string
          purchase_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean | null
          created_at?: string
          id?: string
          order_id?: string | null
          original_json?: Json | null
          product_id?: string
          purchase_state?: number
          purchase_time?: string
          purchase_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_alerts: {
        Row: {
          alert_type: string
          created_at: string
          description: string
          id: string
          ip_address: unknown
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          resource_id: string | null
          resource_type: string | null
          severity: string
          title: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          description: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          resource_id?: string | null
          resource_type?: string | null
          severity: string
          title: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          description?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          resource_id?: string | null
          resource_type?: string | null
          severity?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_policies: {
        Row: {
          config: Json
          created_at: string
          description: string | null
          enabled: boolean | null
          id: string
          policy_name: string
          policy_type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config: Json
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          policy_name: string
          policy_type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          policy_name?: string
          policy_type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_access_logs: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          id: number
          ip_address: unknown
          session_id: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          id?: number
          ip_address?: unknown
          session_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          id?: number
          ip_address?: unknown
          session_id?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_action_logs: {
        Row: {
          action_type: string
          created_at: string
          details: Json | null
          id: number
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          details?: Json | null
          id?: number
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: number
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string | null
          id: string
          message: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      water_reservoir_action_logs: {
        Row: {
          action_type: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          inspection_id: string | null
          reservoir_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          inspection_id?: string | null
          reservoir_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          inspection_id?: string | null
          reservoir_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_reservoir_action_logs_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "water_reservoir_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_reservoir_action_logs_reservoir_id_fkey"
            columns: ["reservoir_id"]
            isOneToOne: false
            referencedRelation: "water_reservoirs"
            referencedColumns: ["id"]
          },
        ]
      }
      water_reservoir_inspections: {
        Row: {
          action_plan: string | null
          checklist_json: Json | null
          condition: string
          corrective_action_needed: boolean
          corrective_action_notes: string | null
          created_at: string
          id: string
          inspected_at: string
          inspected_at_ts: string | null
          inspection_type: string | null
          inspector_name: string | null
          inspector_user_id: string | null
          level_reading: string | null
          next_inspection_at: string | null
          normalized_at: string | null
          overall_status: string | null
          overflow_clear: boolean
          reservoir_id: string
          suction_clean: boolean
        }
        Insert: {
          action_plan?: string | null
          checklist_json?: Json | null
          condition: string
          corrective_action_needed?: boolean
          corrective_action_notes?: string | null
          created_at?: string
          id?: string
          inspected_at: string
          inspected_at_ts?: string | null
          inspection_type?: string | null
          inspector_name?: string | null
          inspector_user_id?: string | null
          level_reading?: string | null
          next_inspection_at?: string | null
          normalized_at?: string | null
          overall_status?: string | null
          overflow_clear?: boolean
          reservoir_id: string
          suction_clean?: boolean
        }
        Update: {
          action_plan?: string | null
          checklist_json?: Json | null
          condition?: string
          corrective_action_needed?: boolean
          corrective_action_notes?: string | null
          created_at?: string
          id?: string
          inspected_at?: string
          inspected_at_ts?: string | null
          inspection_type?: string | null
          inspector_name?: string | null
          inspector_user_id?: string | null
          level_reading?: string | null
          next_inspection_at?: string | null
          normalized_at?: string | null
          overall_status?: string | null
          overflow_clear?: boolean
          reservoir_id?: string
          suction_clean?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "water_reservoir_inspections_reservoir_id_fkey"
            columns: ["reservoir_id"]
            isOneToOne: false
            referencedRelation: "water_reservoirs"
            referencedColumns: ["id"]
          },
        ]
      }
      water_reservoirs: {
        Row: {
          capacity_m3: number
          code: string | null
          created_at: string
          created_by: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          inspection_periodicity: string
          location: string | null
          name: string
          notes: string | null
          product_type: string
          reservoir_type: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          capacity_m3: number
          code?: string | null
          created_at?: string
          created_by?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          inspection_periodicity?: string
          location?: string | null
          name: string
          notes?: string | null
          product_type?: string
          reservoir_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          capacity_m3?: number
          code?: string | null
          created_at?: string
          created_by?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          inspection_periodicity?: string
          location?: string | null
          name?: string
          notes?: string | null
          product_type?: string
          reservoir_type?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      associate_all_licenses_to_most_active_user: {
        Args: never
        Returns: {
          licenses_associated: number
          user_email: string
          user_id: string
        }[]
      }
      associate_license_to_user: {
        Args: { p_machine_id: string; p_user_id: string }
        Returns: boolean
      }
      associate_licenses_to_users: {
        Args: never
        Returns: {
          association_method: string
          license_id: string
          machine_id: string
          success: boolean
          user_id: string
        }[]
      }
      block_ip: {
        Args: {
          p_blocked_until?: string
          p_ip: unknown
          p_metadata?: Json
          p_policy_id?: string
          p_reason: string
        }
        Returns: string
      }
      cleanup_old_logs: { Args: never; Returns: undefined }
      cleanup_old_logs_v2: {
        Args: never
        Returns: {
          deleted_access_logs: number
          deleted_action_logs: number
          retention_days: number
        }[]
      }
      create_security_alert: {
        Args: {
          p_alert_type: string
          p_description: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_severity: string
          p_title: string
          p_user_id?: string
        }
        Returns: string
      }
      deletar_usuarios_com_aviso_expirado: { Args: never; Returns: undefined }
      ensure_profile_exists: {
        Args: { p_user_id: string }
        Returns: {
          full_name: string
          id: string
          plan: Database["public"]["Enums"]["user_plan"]
          role: Database["public"]["Enums"]["user_role"]
          trial_ends_at: string
        }[]
      }
      enviar_alertas_vencimento: { Args: never; Returns: undefined }
      enviar_lembrete_inatividade: { Args: never; Returns: undefined }
      enviar_notificacao_trial_expirando: { Args: never; Returns: undefined }
      enviar_notificacoes_dev: { Args: never; Returns: undefined }
      enviar_notificacoes_pendencias: { Args: never; Returns: undefined }
      enviar_relatorio_diario: { Args: never; Returns: undefined }
      enviar_relatorio_mensal: { Args: never; Returns: undefined }
      enviar_relatorio_semanal: { Args: never; Returns: undefined }
      notify_engagement_streak: { Args: never; Returns: undefined }
      notify_weekly_summary: { Args: never; Returns: undefined }
      generate_unique_equipment_id: {
        Args: {
          p_id_field_name: string
          p_prefix: string
          p_table_name: string
          p_user_id: string
        }
        Returns: string
      }
      get_local_date: { Args: { timestamp_with_tz: string }; Returns: string }
      is_ip_blocked: { Args: { p_ip: unknown }; Returns: boolean }
      limpar_usuarios_inativos: { Args: never; Returns: undefined }
      list_unassociated_licenses: {
        Args: never
        Returns: {
          created_at: string
          is_active: boolean
          last_activation_date: string
          license_id: string
          license_type: string
          machine_id: string
        }[]
      }
      log_user_access: {
        Args: {
          p_action: string
          p_error_message?: string
          p_ip_address?: unknown
          p_session_id?: string
          p_success?: boolean
          p_user_agent?: string
        }
        Returns: undefined
      }
      log_user_action: {
        Args: {
          p_action_type: string
          p_details?: Json
          p_ip_address?: unknown
          p_resource_id?: string
          p_resource_type?: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      testar_cron_job_individual: {
        Args: { p_funcao_nome: string }
        Returns: {
          mensagem: string
          sucesso: boolean
          tempo_execucao: string
          timestamp_fim: string
          timestamp_inicio: string
        }[]
      }
      testar_todos_cron_jobs: {
        Args: never
        Returns: {
          cron_job: string
          funcao_sql: string
          mensagem: string
          sucesso: boolean
          tempo_execucao: string
        }[]
      }
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
      license_type_enum: "experimental" | "premium" | "lifetime"
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
      license_type_enum: ["experimental", "premium", "lifetime"],
      user_plan: ["trial", "premium"],
      user_role: ["user", "admin"],
    },
  },
} as const
