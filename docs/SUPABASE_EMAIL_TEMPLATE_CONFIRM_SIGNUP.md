# Template de Email - Confirmação de Cadastro (Signup)

Este documento contém o template HTML para o email de confirmação de cadastro do Supabase.

## Como Usar no Celular (Mobile)

### Passo 1: Acessar o Supabase Dashboard
1. Abra o navegador do celular
2. Acesse: **https://app.supabase.com**
3. Faça login na sua conta

### Passo 2: Navegar até Email Templates
1. No menu lateral, toque em **Authentication**
2. Toque em **Email Templates**
3. Na lista de templates, toque em **"Confirm signup"**

### Passo 3: Copiar e Colar o Template
1. Role a página até encontrar a seção **"COPIAR AQUI"** abaixo
2. **Toque e segure** no código HTML até aparecer as opções
3. Selecione **"Selecionar tudo"** ou arraste para selecionar todo o código
4. Toque em **"Copiar"**
5. No Supabase Dashboard, toque no campo **"Body"** (área de texto)
6. Toque e segure no campo até aparecer **"Colar"**
7. Cole o código copiado
8. Toque em **"Save"** no final da página

### Dica: Se tiver dificuldade para copiar
- Use a versão **"CÓDIGO LIMPO"** abaixo (sem formatação markdown)
- Ou use a versão **"SIMPLIFICADA"** que é menor e mais fácil de copiar

---

## 📱 COPIAR AQUI - Código Limpo (Mobile)

**Toque e segure abaixo para selecionar todo o código, depois copie:**

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background-color: #000000; padding: 30px; text-align: center;">
                            <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Confirm your signup</h2>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Follow this link to confirm your user:
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 30px 0;">
                                        <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                            Confirm your mail
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                If you didn't sign up for this account, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                © 2025 ISF IA. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

---

## Versão Simplificada - COPIAR AQUI (Mobile)

**Versão mais curta e fácil de copiar no celular:**

<h2 style="color: #000000; font-size: 24px; font-weight: 600; margin-bottom: 20px;">Confirm your signup</h2>

<p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
    Follow this link to confirm your user:
</p>

<p style="text-align: center; margin: 30px 0;">
    <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Confirm your mail
    </a>
</p>

<p style="color: #666666; font-size: 14px; line-height: 1.6; margin-top: 30px;">
    If you didn't sign up for this account, you can safely ignore this email.
</p>

---

## Template HTML (Com Formatação - Desktop)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <tr>
                        <td style="background-color: #000000; padding: 30px; text-align: center;">
                            <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Confirm your signup</h2>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Follow this link to confirm your user:
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 30px 0;">
                                        <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                                            Confirm your mail
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                                If you didn't sign up for this account, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">
                                © 2025 ISF IA. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## Características do Template

- ✅ **Design Moderno**: Cores e estilo alinhados com a identidade visual do ISF IA
- ✅ **Responsivo**: Funciona bem em dispositivos móveis e desktop
- ✅ **Compatível com Clientes de Email**: Usa tabelas HTML para máxima compatibilidade
- ✅ **Conciso**: Não é muito grande, mantém o essencial
- ✅ **Profissional**: Visual limpo e profissional
- ✅ **Otimizado**: Sem propriedades CSS que causam problemas em emails

---

## Variáveis Disponíveis

No template do Supabase, você pode usar as seguintes variáveis:

- `{{ .ConfirmationURL }}` - URL de confirmação (OBRIGATÓRIO para confirmação de signup)
- `{{ .Email }}` - Email do usuário
- `{{ .Token }}` - Token de confirmação (se necessário)

---

## Customização

### Alterar Cores

Para alterar as cores do template, modifique:
- `#000000` - Cor principal (preto)
- `#ffffff` - Cor do texto no botão
- `#f5f5f5` - Cor de fundo externa
- `#ffffff` - Cor de fundo do card

### Alterar Texto

Os textos podem ser traduzidos ou personalizados conforme necessário:
- Título: "Confirm your signup"
- Descrição: "Follow this link to confirm your user:"
- Botão: "Confirm your mail"
- Aviso: "If you didn't sign up for this account, you can safely ignore this email."

---

**Última atualização**: Janeiro 2025

