import React, { createContext, useContext, useState, useEffect } from "react";
import type { Usuario } from "@/types/models";
import {
  getCurrentUser,
  setCurrentUser,
  getUsuarios,
  setUsuarios,
  getProdutos,
  setProdutos,
  getCanais,
  setCanais,
  getUnidades,
  setUnidades,
} from "@/lib/storage";
import {
  SEED_USUARIOS,
  SEED_PRODUTOS,
  SEED_CANAIS,
  SEED_UNIDADES,
} from "@/lib/seed-data";
import {
  syncUsuariosFromSheets,
  authenticateWithSheets,
  syncProdutosFromSheets,
  syncCanaisFromSheets,
  syncUnidadesFromSheets,
  isGoogleSheetsConfigured,
} from "@/lib/google-sheets-sync";

interface AuthContextType {
  user: Usuario | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isCoord: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inicializar dados seed na primeira execução
  useEffect(() => {
    async function initializeApp() {
      try {
        // Verificar se há usuário logado
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Sincronizar dados do Google Sheets se configurado
        const sheetsConfigured = isGoogleSheetsConfigured();
        if (sheetsConfigured) {
          console.log("Sincronizando dados com Google Sheets...");
          const [usuarios, produtos, canais, unidades] = await Promise.all([
            syncUsuariosFromSheets(),
            syncProdutosFromSheets(),
            syncCanaisFromSheets(),
            syncUnidadesFromSheets(),
          ]);

          // Salvar dados sincronizados
          if (usuarios.length > 0) {
            await setUsuarios(usuarios);
            console.log("Usuários sincronizados:", usuarios.length);
          }
          if (produtos.length > 0) {
            await setProdutos(produtos);
            console.log("Produtos sincronizados:", produtos.length);
          }
          if (canais.length > 0) {
            await setCanais(canais);
            console.log("Canais sincronizados:", canais.length);
          }
          if (unidades.length > 0) {
            await setUnidades(unidades);
            console.log("Unidades sincronizadas:", unidades.length);
          }
        } else {
          // Usar dados seed como fallback
          const existingUsuarios = await getUsuarios();
          if (existingUsuarios.length === 0) {
            console.log("Usando dados seed padrão...");
            await setUsuarios(SEED_USUARIOS);
            await setProdutos(SEED_PRODUTOS);
            await setCanais(SEED_CANAIS);
            await setUnidades(SEED_UNIDADES);
          }
        }
      } catch (error) {
        console.error("Error initializing app:", error);
        // Fallback para dados locais em caso de erro
        const usuarios = await getUsuarios();
        if (usuarios.length === 0) {
          await setUsuarios(SEED_USUARIOS);
          await setProdutos(SEED_PRODUTOS);
          await setCanais(SEED_CANAIS);
          await setUnidades(SEED_UNIDADES);
        }
      } finally {
        setIsLoading(false);
      }
    }

    initializeApp();
  }, []);

  // Garante que os dados seed estejam disponíveis se a sync ainda não ocorreu
  const ensureSeedData = async (): Promise<Usuario[]> => {
    const usuarios = await getUsuarios();
    if (usuarios.length > 0) return usuarios;

    await setUsuarios(SEED_USUARIOS);
    await setProdutos(SEED_PRODUTOS);
    await setCanais(SEED_CANAIS);
    await setUnidades(SEED_UNIDADES);
    return SEED_USUARIOS;
  };

  const login = async (email: string, senha: string): Promise<boolean> => {
    try {
      // Tentar autenticar com Google Sheets primeiro
      const sheetsConfigured = isGoogleSheetsConfigured();
      if (sheetsConfigured) {
        const result = await authenticateWithSheets(email, senha);
        if (result.success && result.usuario) {
          await setCurrentUser(result.usuario);
          setUser(result.usuario);
          return true;
        }

        // Se a autenticação via Sheets falhar, registrar motivo e cair para local
        if (result.error) {
          console.warn("Auth Sheets fallback:", result.error);
        }
      }

      // Fallback para autenticação local (garantindo seeds carregados)
      const usuarios = await ensureSeedData();
      const usuario = usuarios.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.ativo
      );

      if (usuario && usuario.senha && usuario.senha === senha) {
        await setCurrentUser(usuario);
        setUser(usuario);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await setCurrentUser(null);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isCoord = user?.role === "COORD";

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isCoord }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
