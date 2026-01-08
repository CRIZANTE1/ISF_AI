# Template de Email - Reset de Senha (ATUALIZADO)

Este documento contém o template HTML **MELHORADO** para o email de recuperação de senha do Supabase.

## ✨ Novidades desta versão

- ✅ **Link copiável em texto plano** - Agora você pode copiar o link facilmente
- ✅ **Design moderno e profissional** - Gradientes, badges e melhor hierarquia
- ✅ **Box de informações importantes** - Destaque para instruções de segurança
- ✅ **Responsivo** - Funciona perfeitamente em mobile e desktop
- ✅ **Email de suporte** - Contato direto para ajuda
- ✅ **Dicas de segurança** - Orientações claras sobre uso do link

## 🎨 Preview

Abra o arquivo `preview-reset-password.html` no navegador para visualizar o template antes de usar.

## Como Usar no Celular (Mobile)

### Passo 1: Acessar o Supabase Dashboard
1. Abra o navegador do celular
2. Acesse: **https://app.supabase.com**
3. Faça login na sua conta

### Passo 2: Navegar até Email Templates
1. No menu lateral, toque em **Authentication**
2. Toque em **Email Templates**
3. Na lista de templates, toque em **"Reset Password"**

### Passo 3: Copiar e Colar o Template
1. Role a página até encontrar a seção **"📧 COPIAR AQUI"** abaixo
2. **Toque e segure** no código HTML até aparecer as opções
3. Selecione **"Selecionar tudo"** ou arraste para selecionar todo o código
4. Toque em **"Copiar"**
5. No Supabase Dashboard, toque no campo **"Body"** (área de texto)
6. Toque e segure no campo até aparecer **"Colar"**
7. Cole o código copiado
8. Role até o final e toque em **"Save"**

### ⚠️ Importante
Não altere o `{{ .ConfirmationURL }}` - é uma variável do Supabase que será substituída automaticamente pelo link real.

---

## 📧 COPIAR AQUI - Template Completo

**Toque e segure abaixo para selecionar todo o código, depois copie:**

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinir Senha - ISF IA</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%); padding: 50px 40px; text-align: center;">
                            <div style="display: inline-block; background-color: rgba(255,255,255,0.1); padding: 12px 24px; border-radius: 50px; margin-bottom: 20px;">
                                <span style="color: #ffffff; font-size: 14px; font-weight: 500; letter-spacing: 1px;">🔐 SEGURANÇA</span>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Redefinir Senha</h1>
                            <p style="margin: 15px 0 0 0; color: #cccccc; font-size: 16px; font-weight: 400;">ISF IA - Segurança no Trabalho</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 50px 40px;">
                            <p style="color: #333333; font-size: 18px; line-height: 1.7; margin: 0 0 10px 0; font-weight: 500;">Olá!</p>
                            <p style="color: #555555; font-size: 16px; line-height: 1.7; margin: 0 0 30px 0;">Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0 30px 0;">
                                        <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px; font-weight: 700; font-size: 16px; letter-spacing: 0.5px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">✨ Redefinir Minha Senha</a>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                                <tr>
                                    <td style="border-top: 2px solid #f0f0f0; padding-top: 30px;">
                                        <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0; font-weight: 600;">📋 Ou copie e cole o link abaixo:</p>
                                        <div style="background-color: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 16px; word-break: break-all;">
                                            <a href="{{ .ConfirmationURL }}" style="color: #0066cc; font-size: 13px; text-decoration: none; font-family: 'Courier New', monospace;">{{ .ConfirmationURL }}</a>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0 0 0;">
                                <tr>
                                    <td style="background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 20px; border-radius: 8px;">
                                        <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0; font-weight: 600;">⚠️ Informações importantes:</p>
                                        <ul style="color: #856404; font-size: 13px; line-height: 1.7; margin: 0; padding-left: 20px;">
                                            <li>Este link expira em <strong>1 hora</strong></li>
                                            <li>Use o link apenas uma vez</li>
                                            <li>Se você não solicitou esta alteração, ignore este e-mail</li>
                                            <li>Sua senha atual permanece ativa até que você crie uma nova</li>
                                        </ul>
                                    </td>
                                </tr>
                            </table>
                            <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 40px 0 0 0; padding-top: 30px; border-top: 1px solid #eeeeee;">🔒 <strong>Dica de segurança:</strong> Nunca compartilhe este link com outras pessoas. Nossa equipe nunca pedirá sua senha por e-mail ou telefone.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px 40px; text-align: center; border-top: 1px solid #dee2e6;">
                            <p style="color: #6c757d; font-size: 14px; margin: 0 0 10px 0; font-weight: 500;">Precisa de ajuda?</p>
                            <a href="mailto:isfiasegurancanotrabalho@gmail.com" style="color: #000000; text-decoration: none; font-size: 14px; font-weight: 600;">isfiasegurancanotrabalho@gmail.com</a>
                            <p style="color: #adb5bd; font-size: 12px; margin: 20px 0 0 0;">© 2025 ISF IA - Segurança no Trabalho. Todos os direitos reservados.</p>
                        </td>
                    </tr>
                </table>
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="margin-top: 20px;">
                    <tr>
                        <td style="text-align: center; padding: 20px;">
                            <p style="color: #6c757d; font-size: 11px; line-height: 1.5; margin: 0;">Este é um e-mail automático, por favor não responda.<br>Se você não criou uma conta conosco, pode ignorar este e-mail com segurança.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

---

## 📋 Instruções de Uso

### 1. Cole o Template no Supabase
Depois de copiar o template acima, cole-o no campo **"Body"** do template "Reset Password" no Supabase Dashboard.

### 2. Configure o Redirect URL
No Supabase Dashboard, verifique se o **"Redirect URL"** está configurado:
- **Mobile (Android/iOS)**: `com.isfia.app://reset-password`
- **Web**: Seu domínio de produção

### 3. Variável Importante
O template usa a variável `{{ .ConfirmationURL }}` que é substituída automaticamente pelo Supabase.
**NÃO ALTERE** essa variável!

---

## 🎨 Características do Novo Design

### Visual
- **Header com gradiente** e badge de segurança
- **Botão destacado** com ícone e gradiente
- **Link copiável** em caixa de texto com borda tracejada
- **Box de informações** com destaque amarelo
- **Footer moderno** com gradiente sutil

### Funcionalidade
- ✅ **Link em texto plano** - Fácil de copiar
- ✅ **Responsivo** - Adapta-se a todos os tamanhos de tela  
- ✅ **Acessível** - Cores contrastantes e texto legível
- ✅ **Profissional** - Design moderno e clean

### Informações Incluídas
- Tempo de expiração do link (1 hora)
- Instruções de segurança
- Email de suporte
- Avisos importantes destacados

---

## 📝 Arquivos de Referência

### Visualizar o Template
Abra o arquivo **`docs/preview-reset-password.html`** no navegador para ver exatamente como o email aparecerá.

### Template HTML Completo
O template completo está disponível em **`docs/email-template-reset-password.html`** para referência ou edição.

---

## ✅ Checklist Final

Antes de salvar no Supabase, verifique:

- [ ] Copiou todo o código HTML (incluindo `<!DOCTYPE html>` e `</html>`)
- [ ] Não alterou a variável `{{ .ConfirmationURL }}`
- [ ] Configurou o Redirect URL corretamente no Supabase
- [ ] Testou enviando um email de reset para verificar

---

## 🆘 Suporte

Se tiver dúvidas ou problemas:
- **Email**: isfiasegurancanotrabalho@gmail.com
- **Arquivo Preview**: `docs/preview-reset-password.html`
- **Arquivo Template**: `docs/email-template-reset-password.html`


## Variáveis Disponíveis

No template do Supabase, você pode usar as seguintes variáveis:

- `{{ .ConfirmationURL }}` - URL de confirmação/reset (OBRIGATÓRIO para reset de senha)
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
- Título: "Reset Password"
- Descrição: "Follow this link to reset the password for your user:"
- Botão: "Reset Password"
- Aviso: "If you didn't request this, you can safely ignore this email."

---

**Última atualização**: Janeiro 2025

