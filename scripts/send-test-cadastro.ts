import 'dotenv/config';
import { sendCadastroToSheets, syncCadastrosFromSheets } from '../lib/google-sheets-sync';

(async () => {
  try {
    const id = 'TEST-CAD-' + Date.now();
    const cadastro = {
      cadastroId: id,
      criadoEm: new Date().toISOString(),
      atcEmail: 'test@atc.com',
      atcNome: 'Teste ATC',
      canal: 'Canal Teste',
      unidade: 'Unidade Teste',
      estado: 'SP',
      categoria: 'HIDROSSOLUVEIS',
      produtoRef: 'PROD_TEST',
      produtoNomeLivre: 'Produto Teste',
      unidadePotencial: 'tons',
      implantado: 'Não',
      potencialValor: 1.5,
      concorrentes: 'Nenhum',
      observacao: 'Teste de sincronização',
    } as any;

    console.log('SENDING', id);
    const res = await sendCadastroToSheets(cadastro);
    console.log('SEND_RESULT', res);

    // Wait a short moment to allow API eventual consistency
    await new Promise((r) => setTimeout(r, 1200));

    const cad = await syncCadastrosFromSheets();
    console.log('AFTER_COUNT:', cad.length);
    const found = cad.find((c) => c.cadastroId === id);
    console.log('FOUND:', !!found);
    if (found) console.log(found);
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
