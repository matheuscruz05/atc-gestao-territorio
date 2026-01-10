/**
 * Arquivo de debug para verificar se os botões estão sendo renderizados corretamente
 * 
 * Este arquivo contém funções para testar se os handlers dos botões estão sendo chamados
 */

export function debugLogout() {
  console.log("🔴 [DEBUG] Botão Sair clicado!");
}

export function debugSalvarCadastro() {
  console.log("🔴 [DEBUG] Botão Salvar Cadastro clicado!");
}

export function debugButtonPress(buttonName: string) {
  console.log(`🔴 [DEBUG] Botão "${buttonName}" foi pressionado!`);
}
