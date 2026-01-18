# ✅ CORREÇÃO SERVER-SIDE SYNC - Google Sheets

## 🐛 Problema Identificado

O código estava tentando usar Service Account JWT no **client-side (navegador)**, o que não funciona porque:
- Navegador não pode ler arquivos do sistema (`./secrets/sa-key.json`)
- Navegador não tem acesso a módulos Node.js (`crypto`, `fs`)

## ✅ Solução Implementada

Criamos **endpoints REST no servidor** que fazem a sincronização usando Service Account corretamente.

### Arquivos Modificados

1. **Novo**: `server/sheets-sync.ts` - Endpoints de sincronização
   - `POST /api/sheets/cadastros` - Envia 1 cadastro
   - `POST /api/sheets/cadastros/bulk` - Envia múltiplos
   - `DELETE /api/sheets/cadastros/:id` - Deleta cadastro

2. **Modificado**: `server/_core/index.ts` - Registrou rotas

3. **Modificado**: `lib/google-sheets-sync.ts` - Agora chama endpoints do servidor

## 🧪 Teste Completo (4 Passos)

### Teste 1: Criar e Sincronizar (ATC)
1. Login como ATC
2. Criar novo cadastro com pelo menos 1 categoria
3. Clicar "Sincronizar com Sheets"
4. Verificar mensagem de sucesso
5. **Validar na planilha**: Nova linha com 67 colunas preenchidas

### Teste 2: Pull de Dados (Admin)
1. Login como Admin
2. Ir para aba "Cadastros"
3. Clicar "🔄 Atualizar"
4. **Validar**: Cadastro do Teste 1 aparece na lista

### Teste 3: Editar e Enviar (Admin)
1. Editar algum campo do cadastro
2. Clicar "📤 Enviar"
3. **Validar na planilha**: Dados atualizados

### Teste 4: Deletar (Admin)
1. Deletar o cadastro
2. Clicar "📤 Enviar"
3. **Validar na planilha**: Linha limpa (vazios)

## 🔍 Debug

### Logs do Servidor
```bash
# Ver logs
npm run dev

# Esperado (sucesso):
POST /api/sheets/cadastros 200 OK

# Erro:
Service Account not configured → Verificar ./secrets/sa-key.json
```

### Console do Navegador (F12)
```javascript
// Sucesso:
POST http://localhost:3000/api/sheets/cadastros 200 OK

// Erro:
net::ERR_CONNECTION_REFUSED → Servidor não está rodando
```

## ✅ Checklist

- [ ] Servidor rodando (`npm run dev`)
- [ ] Arquivo `./secrets/sa-key.json` existe
- [ ] Teste 1: Criar e sincronizar ✓
- [ ] Teste 2: Pull de dados ✓
- [ ] Teste 3: Editar e enviar ✓
- [ ] Teste 4: Deletar ✓
- [ ] Dados na planilha corretos

**Status**: ✅ Pronto para Testar
