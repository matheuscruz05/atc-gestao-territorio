import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Usuario,
  Produto,
  Canal,
  Unidade,
  Cadastro,
} from "@/types/models";

// Chaves de armazenamento
const KEYS = {
  USUARIOS: "@atc:usuarios",
  PRODUTOS: "@atc:produtos",
  CANAIS: "@atc:canais",
  UNIDADES: "@atc:unidades",
  CADASTROS: "@atc:cadastros",
  CURRENT_USER: "@atc:current_user",
  LAST_SYNC: "@atc:last_sync",
} as const;

// Funções auxiliares
async function getItem<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error getting ${key}:`, error);
    return null;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
  }
}

// Usuários
export async function getUsuarios(): Promise<Usuario[]> {
  return (await getItem<Usuario[]>(KEYS.USUARIOS)) || [];
}

export async function setUsuarios(usuarios: Usuario[]): Promise<void> {
  await setItem(KEYS.USUARIOS, usuarios);
}

export async function addUsuario(usuario: Usuario): Promise<void> {
  const usuarios = await getUsuarios();
  const index = usuarios.findIndex((u) => u.email === usuario.email);
  if (index >= 0) {
    usuarios[index] = usuario;
  } else {
    usuarios.push(usuario);
  }
  await setUsuarios(usuarios);
}

// Produtos
export async function getProdutos(): Promise<Produto[]> {
  return (await getItem<Produto[]>(KEYS.PRODUTOS)) || [];
}

export async function setProdutos(produtos: Produto[]): Promise<void> {
  await setItem(KEYS.PRODUTOS, produtos);
}

export async function addProduto(produto: Produto): Promise<void> {
  const produtos = await getProdutos();
  const index = produtos.findIndex((p) => p.produtoId === produto.produtoId);
  if (index >= 0) {
    produtos[index] = produto;
  } else {
    produtos.push(produto);
  }
  await setProdutos(produtos);
}

// Canais
export async function getCanais(): Promise<Canal[]> {
  return (await getItem<Canal[]>(KEYS.CANAIS)) || [];
}

export async function setCanais(canais: Canal[]): Promise<void> {
  await setItem(KEYS.CANAIS, canais);
}

export async function addCanal(canal: Canal): Promise<void> {
  const canais = await getCanais();
  const index = canais.findIndex((c) => c.canalId === canal.canalId);
  if (index >= 0) {
    canais[index] = canal;
  } else {
    canais.push(canal);
  }
  await setCanais(canais);
}

// Unidades
export async function getUnidades(): Promise<Unidade[]> {
  return (await getItem<Unidade[]>(KEYS.UNIDADES)) || [];
}

export async function setUnidades(unidades: Unidade[]): Promise<void> {
  await setItem(KEYS.UNIDADES, unidades);
}

export async function addUnidade(unidade: Unidade): Promise<void> {
  const unidades = await getUnidades();
  const index = unidades.findIndex((u) => u.unidadeId === unidade.unidadeId);
  if (index >= 0) {
    unidades[index] = unidade;
  } else {
    unidades.push(unidade);
  }
  await setUnidades(unidades);
}

// Cadastros
export async function getCadastros(): Promise<Cadastro[]> {
  return (await getItem<Cadastro[]>(KEYS.CADASTROS)) || [];
}

export async function setCadastros(cadastros: Cadastro[]): Promise<void> {
  await setItem(KEYS.CADASTROS, cadastros);
}

export async function addCadastro(cadastro: Cadastro): Promise<void> {
  const cadastros = await getCadastros();
  const index = cadastros.findIndex((c) => c.cadastroId === cadastro.cadastroId);
  if (index >= 0) {
    cadastros[index] = cadastro;
  } else {
    cadastros.push(cadastro);
  }
  await setCadastros(cadastros);
}

// Usuário atual
export async function getCurrentUser(): Promise<Usuario | null> {
  return await getItem<Usuario>(KEYS.CURRENT_USER);
}

export async function setCurrentUser(user: Usuario | null): Promise<void> {
  if (user) {
    await setItem(KEYS.CURRENT_USER, user);
  } else {
    await AsyncStorage.removeItem(KEYS.CURRENT_USER);
  }
}

// Última sincronização
export async function getLastSync(): Promise<string | null> {
  return await getItem<string>(KEYS.LAST_SYNC);
}

export async function setLastSync(date: string): Promise<void> {
  await setItem(KEYS.LAST_SYNC, date);
}

// Limpar todos os dados
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  } catch (error) {
    console.error("Error clearing data:", error);
  }
}

// Gerar ID único
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
