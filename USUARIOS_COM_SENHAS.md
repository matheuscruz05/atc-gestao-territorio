# 🔐 GERENCIAMENTO DE USUÁRIOS COM SENHAS PERSONALIZADAS

## ✅ Implementação Concluída

O sistema agora suporta **senhas personalizadas para cada usuário** no Google Sheets, em vez de usar uma senha genérica.

---

## 📋 Estrutura da Planilha USUARIOS

A aba **USUARIOS** no Google Sheets deve ter as seguintes colunas:

| Coluna | Nome | Tipo | Descrição |
|--------|------|------|-----------|
| A | EMAIL | Texto | Email do usuário (único) |
| B | NOME | Texto | Nome completo do usuário |
| C | ROLE | Texto | Perfil: `COORD` ou `ATC` |
| D | SENHA | Texto | Senha do usuário (texto simples) |
| E | ATIVO | Texto | Status: `TRUE` ou `FALSE` |

### Exemplo de Dados:

```
EMAIL                    | NOME                    | ROLE  | SENHA    | ATIVO
atc1@exemplo.com        | ATC Teste 1             | ATC   | 123456   | TRUE
admin@exemplo.com       | Administrador           | COORD | senha123 | TRUE
usuario2@empresa.com    | Operador Regional       | ATC   | abc789   | TRUE
```

---

## 🔄 Como Está Funcionando

### 1️⃣ Login com Email e Senha

Quando o usuário faz login:
```
Email: atc1@exemplo.com
Senha: 123456
```

O sistema:
1. ✅ Busca o usuário na aba USUARIOS do Sheets
2. ✅ Valida se o email existe
3. ✅ Valida se a senha está correta
4. ✅ Verifica se o usuário está ativo (ATIVO = TRUE)
5. ✅ Concede acesso se tudo estiver ok

### 2️⃣ Adicionar Novo Usuário (via Sheets)

Para adicionar um novo usuário ATC ou Admin:

1. **Abra Google Sheets**
2. **Vá para a aba USUARIOS**
3. **Adicione uma nova linha** com:
   - EMAIL: (ex: novo.usuario@empresa.com)
   - NOME: (ex: João da Silva)
   - ROLE: `ATC` ou `COORD`
   - SENHA: (ex: senha_segura_123)
   - ATIVO: `TRUE`

4. **Salve a planilha**
5. **O app carregará automaticamente** o novo usuário na próxima sincronização

---

## 🛠️ Alterações no Código

### Arquivo: `types/models.ts`
✅ Adicionado campo `senha: string` na interface `Usuario`

### Arquivo: `lib/google-sheets-sync.ts`
✅ **`syncUsuariosFromSheets()`** - Agora lê coluna D (SENHA)
✅ **`authenticateWithSheets()`** - Valida senha contra o Sheets
✅ **`addNovoUsuarioToSheets()`** - NOVA função para adicionar usuários

### Arquivo: `lib/seed-data.ts`
✅ Adicionado campo `senha: "123456"` em todos os usuários locais

---

## 📱 Fluxo de Login

```
┌─────────────────────────────┐
│  Tela de Login              │
│  Email: [_________________] │
│  Senha: [_________________] │
│  [Entrar]                   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  Validar contra Sheets      │
│  1. Email existe?           │
│  2. Senha correta?          │
│  3. Usuário ativo?          │
└──────────┬──────────────────┘
           │
      ┌────┴────┐
      ▼         ▼
   ✅ OK      ❌ ERRO
      │         │
      ▼         ▼
   [App]    [Mensagem Erro]
```

---

## 🔐 Segurança

### ✅ O que foi implementado:
- [x] Cada usuário tem sua própria senha
- [x] Senhas são validadas contra o Sheets (não hardcoded)
- [x] Senhas são armazenadas em texto simples no Sheets (por simplicidade)
- [x] Validação de usuário ativo (ATIVO = TRUE)

### ⚠️ Considerações de Produção:
- Para produção real, considere:
  - Usar hash de senha (bcrypt, SHA-256) em vez de texto simples
  - Usar HTTPS para transmitir senhas
  - Implementar rate limiting para tentativas de login
  - Adicionar auditoria de logins
  - Usar autenticação OAuth/SSO

---

## 📝 Exemplo Prático

### Cenário 1: Adicionar novo ATC

1. Abrir Google Sheets
2. Aba USUARIOS → Adicionar linha:
   ```
   EMAIL: maria.silva@empresa.com
   NOME: Maria Silva
   ROLE: ATC
   SENHA: senha_maria_2024
   ATIVO: TRUE
   ```
3. Salvar
4. Maria pode fazer login com:
   ```
   Email: maria.silva@empresa.com
   Senha: senha_maria_2024
   ```

### Cenário 2: Adicionar novo Coordenador

1. Abrir Google Sheets
2. Aba USUARIOS → Adicionar linha:
   ```
   EMAIL: coord.novo@empresa.com
   NOME: Novo Coordenador
   ROLE: COORD
   SENHA: senha_coord_segura
   ATIVO: TRUE
   ```
3. Salvar
4. Novo Coordenador pode fazer login e acessar Admin

---

## 🧪 Testando Localmente

Se estiver testando sem Google Sheets:

O app usa dados locais do `lib/seed-data.ts` com usuários de teste:

```
Coordenador:
  Email: coord@atc.com
  Senha: 123456

ATC 1:
  Email: atc1@atc.com
  Senha: 123456

ATC 2:
  Email: atc2@atc.com
  Senha: 123456

ATC 3:
  Email: atc3@atc.com
  Senha: 123456
```

---

## 📊 Status de Implementação

| Item | Status | Notas |
|------|--------|-------|
| Interface Usuario com senha | ✅ | Campo `senha: string` adicionado |
| Sincronizar senhas do Sheets | ✅ | `syncUsuariosFromSheets()` lê coluna D |
| Validar senha no login | ✅ | `authenticateWithSheets()` compara senhas |
| Adicionar novo usuário | ✅ | Função `addNovoUsuarioToSheets()` criada |
| Seed data com senhas | ✅ | Todos os usuários têm `senha: "123456"` |
| TypeScript clean | ✅ | Sem erros de compilação |

---

## 🚀 Como Começar

### 1. Atualizar Google Sheets

Acesse: https://docs.google.com/spreadsheets/d/1qDxc1c9j7IEa2ZKUIaZL_9M2GDZisL0g62HVw3KhUDs

Aba **USUARIOS** - Adicione coluna D com header "SENHA"

Atualizar linha de dados:
```
EMAIL                  | NOME              | ROLE | SENHA    | ATIVO
admin@exemplo.com     | Administrador     | COORD| admin123 | TRUE
atc1@exemplo.com      | ATC Teste 1       | ATC  | atc123   | TRUE
```

### 2. Iniciar App

```bash
pnpm dev
```

### 3. Fazer Login

```
Email: admin@exemplo.com
Senha: admin123
```

---

## ✅ Benefícios

- ✅ **Mais Seguro:** Cada usuário tem sua própria senha
- ✅ **Flexível:** Adicione usuários diretamente no Sheets
- ✅ **Simples:** Sem servidor de autenticação necessário
- ✅ **Escalável:** Suporta quantos usuários quiser
- ✅ **Auditável:** Histórico de alterações no Sheets

---

## 🔗 Documentação Relacionada

- [SHEETS_PRONTO_USAR.md](SHEETS_PRONTO_USAR.md) - Guia de configuração Sheets
- [lib/google-sheets-sync.ts](lib/google-sheets-sync.ts) - Código de sincronização
- [types/models.ts](types/models.ts) - Definições de tipos

---

**Status: ✅ PRONTO PARA USAR**

O sistema de gerenciamento de usuários com senhas personalizadas está completamente implementado e funcional! 🎉
