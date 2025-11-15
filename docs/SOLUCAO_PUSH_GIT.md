# 🔧 Solução de Problemas com Push do Git

## Problema: Push falhou porque a internet caiu

Quando a internet cai durante um push, o Git pode ficar em um estado inconsistente. Siga estes passos para resolver:

## 📋 Passo a Passo para Resolver

### 1. Verificar o Status Atual

Abra o PowerShell no diretório do projeto e execute:

```powershell
git status
```

Isso mostrará:
- Se há arquivos não commitados
- Se há commits locais não enviados
- O estado atual do repositório

### 2. Verificar os Remotes Configurados

```powershell
git remote -v
```

Isso mostra a URL do repositório remoto (GitHub, GitLab, etc.)

### 3. Verificar Commits Não Enviados

```powershell
git log origin/main..HEAD
# ou
git log origin/master..HEAD
```

Isso mostra os commits que estão locais mas não foram enviados.

### 4. Tentar Push Novamente

Depois que a internet voltar, tente novamente:

```powershell
git push
```

### 5. Se o Push Ainda Falhar

#### Opção A: Fazer Pull Primeiro (Recomendado)

Se outras pessoas fizeram commits enquanto você estava offline:

```powershell
git pull --rebase
git push
```

#### Opção B: Verificar se Precisa Atualizar a Branch Remota

```powershell
git fetch origin
git status
```

Isso atualiza as informações sobre o remoto sem fazer merge.

#### Opção C: Push Forçado (Use com Cuidado!)

⚠️ **ATENÇÃO**: Só use se você tiver certeza de que quer sobrescrever o remoto:

```powershell
git push --force-with-lease
```

**NUNCA use `git push --force` sem `--lease`**, pois pode apagar commits de outras pessoas!

### 6. Se o Remote Estiver Desatualizado

Se a URL do remote mudou ou está incorreta:

```powershell
# Ver a URL atual
git remote get-url origin

# Atualizar a URL (substitua pela URL correta)
git remote set-url origin https://github.com/usuario/repositorio.git
```

## 🚨 Problemas Comuns e Soluções

### Erro: "failed to push some refs"

**Causa**: O repositório remoto tem commits que você não tem localmente.

**Solução**:
```powershell
git pull --rebase origin main
git push
```

### Erro: "remote: Permission denied"

**Causa**: Problemas de autenticação.

**Soluções**:
1. Verifique se está autenticado (GitHub CLI, SSH keys, ou token)
2. Reconfigure as credenciais:
```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### Erro: "Connection timed out"

**Causa**: Problemas de rede ou firewall.

**Soluções**:
1. Verifique sua conexão com a internet
2. Tente novamente após alguns minutos
3. Verifique se não há firewall bloqueando

### Erro: "Updates were rejected"

**Causa**: O branch remoto tem mudanças que você não tem.

**Solução**:
```powershell
git pull --rebase
git push
```

## 🔄 Script Automático

Execute o script `fix_git_push.ps1` na raiz do projeto:

```powershell
.\fix_git_push.ps1
```

Ele fará o diagnóstico automático e tentará resolver o problema.

## ✅ Checklist Rápido

- [ ] Internet está funcionando?
- [ ] Executei `git status` para ver o estado atual?
- [ ] Executei `git fetch origin` para atualizar informações?
- [ ] Tentei `git pull --rebase` antes de fazer push?
- [ ] Verifiquei se as credenciais estão corretas?
- [ ] Tentei `git push` novamente?

## 📞 Ainda com Problemas?

Se nada funcionar:

1. **Verifique os logs do Git**:
```powershell
git log --oneline -10
```

2. **Crie um backup**:
```powershell
git bundle create backup.bundle HEAD
```

3. **Verifique a configuração**:
```powershell
git config --list
```

4. **Entre em contato** com o administrador do repositório ou abra uma issue no GitHub/GitLab.

## 💡 Dicas para Evitar no Futuro

1. **Sempre faça commit antes de push**: Isso garante que suas mudanças estão salvas localmente
2. **Use `git pull --rebase` regularmente**: Mantém seu histórico limpo
3. **Faça push frequentemente**: Não acumule muitos commits locais
4. **Use branches para features grandes**: Facilita o trabalho colaborativo

