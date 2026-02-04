# 📁 Arquivos de Teste Localizados em scripts/local-tests

## Localização Centralizada

Todos os scripts e arquivos de teste local foram organizados em **`scripts/local-tests/`** para manter o workspace limpo e organizado.

## 📋 Arquivos Disponíveis

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `debug-api-base-url.js` | Script | Verifica se `getApiBaseUrl()` está retornando a URL correta |
| `test-api-direct.js` | Script | Testa POST direto para `/api/sheets/create-or-update` |
| `test-cadastro-sync.js` | Script | Teste completo de sincronização (5 testes) |
| `test-sheets-credentials.js` | Script | Valida Google Sheets API credentials |
| `simple-api-test.js` | Script | Teste simples de conectividade HTTP |
| `api-test-payload.json` | Dados | Payload de teste utilizado |
| `api-test-result.json` | Dados | Resultado retornado pela API |
| `DIAGNOSTICO_ERROS_LOCALHOST_27JAN.md` | Documentação | Análise de erros em localhost |

## 🚀 Como Usar

### Verificar API Base URL
```bash
node scripts/local-tests/debug-api-base-url.js
```

### Testar credenciais do Google Sheets
```bash
node scripts/local-tests/test-sheets-credentials.js
```

### Testar sincronização completa
```bash
node scripts/local-tests/test-cadastro-sync.js
```

### Testar API endpoint diretamente
```bash
node scripts/local-tests/test-api-direct.js
```

### Teste simples de conectividade
```bash
node scripts/local-tests/simple-api-test.js
```

## ✅ Referências Atualizadas

Os seguintes arquivos foram atualizados para referenciar o novo caminho:

- ✅ [STATUS_SINCRONIZACAO_ATUAL.md](../STATUS_SINCRONIZACAO_ATUAL.md) - Linhas 184, 186, 257

## 📝 Notas

- Todos os scripts são Node.js executáveis
- Requerem que `pnpm dev` esteja rodando (para testes de API)
- Os JSONs contêm dados reais de teste utilizado com sucesso
- Documentação diagnóstica disponível para referência histórica
