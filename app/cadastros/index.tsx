import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import { getCadastros, setCadastros as setCadastrosStorage } from "@/lib/storage";
import { deleteCadastroFromSheets } from "@/lib/google-sheets-sync";
import { confirmAction } from "@/lib/confirm";
import type { Cadastro } from "@/types/models";
import { Picker } from "@react-native-picker/picker";
import { CATEGORIAS, ESTADOS_UF } from "@/types/models";

export default function CadastrosScreen() {
  const { isCoord } = useAuth();
  const colors = useColors();
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [filteredCadastros, setFilteredCadastros] = useState<Cadastro[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Para funcionalidade de undo
  const deletedCadastroRef = useRef<Cadastro | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterImplantado, setFilterImplantado] = useState("");

  const loadCadastros = useCallback(async () => {
    try {
      const allCadastros = await getCadastros();
      setCadastros(allCadastros);
    } catch (error) {
      console.error("Error loading cadastros:", error);
    }
  }, []);

  const router = useRouter();

  useEffect(() => {
    loadCadastros();
  }, [loadCadastros]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...cadastros];

    // Busca por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.produtoRef.toLowerCase().includes(query) ||
          c.produtoNomeLivre?.toLowerCase().includes(query) ||
          c.canal.toLowerCase().includes(query) ||
          c.unidade.toLowerCase().includes(query) ||
          c.atcNome.toLowerCase().includes(query)
      );
    }

    // Filtro por categoria
    if (filterCategoria) {
      filtered = filtered.filter((c) => c.categoria === filterCategoria);
    }

    // Filtro por estado
    if (filterEstado) {
      filtered = filtered.filter((c) => c.estado === filterEstado);
    }

    // Filtro por implantado
    if (filterImplantado) {
      filtered = filtered.filter((c) => c.implantado === filterImplantado);
    }

    setFilteredCadastros(filtered);
  }, [searchQuery, filterCategoria, filterEstado, filterImplantado, cadastros]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadCadastros();
    setIsRefreshing(false);
  };

  const renderCadastroCard = ({ item }: { item: Cadastro }) => {
    const produtoNome = item.produtoNomeLivre || item.produtoRef;
    const isImplantado = item.implantado === "Sim";

    return (
      <View className="bg-surface rounded-lg p-4 border border-border mb-3">
        <View className="gap-2">
          {/* Produto */}
          <Text className="text-lg font-semibold text-primary">
            {produtoNome}
          </Text>

          {/* Categoria */}
          <Text className="text-xs font-medium text-foreground">
            {item.categoria}
          </Text>

          {/* Canal e Unidade */}
          <Text className="text-sm text-foreground">
            {item.canal} • {item.unidade}
          </Text>

          {/* Estado */}
          <Text className="text-sm text-foreground">
            {item.estado}
          </Text>

          {/* Status e Potencial */}
          <View className="flex-row items-center gap-2 mt-2">
            <View
              className={`px-3 py-1 rounded-full ${
                isImplantado ? "bg-success" : "bg-border"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isImplantado ? "text-white" : "text-muted"
                }`}
              >
                {item.implantado}
              </Text>
            </View>

            <Text className="text-sm font-medium text-foreground">
              {item.potencialValor} {item.unidadePotencial}
            </Text>
          </View>

          {/* ATC */}
          <Text className="text-xs text-foreground mt-2">
            ATC: {item.atcNome}
          </Text>

          {/* Data */}
          <Text className="text-xs text-foreground">
            Criado em: {new Date(item.criadoEm).toLocaleDateString("pt-BR")}
          </Text>

          {/* Ações do Admin */}
          {isCoord && (
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity
                className="px-3 py-2 bg-primary rounded-lg"
                onPress={() => handleEdit(item)}
                activeOpacity={0.8}
              >
                <Text className="text-white font-medium">Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="px-3 py-2 bg-red-600 rounded-lg"
                onPress={() => handleDelete(item)}
                activeOpacity={0.8}
              >
                <Text className="text-white font-medium">Excluir</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Editar: navega para tela de novo cadastro com query param editId
  const handleEdit = (item: Cadastro) => {
    router.push(`/novo-cadastro?editId=${encodeURIComponent(item.cadastroId)}` as any);
  };

  // Excluir: confirmação (com fallback para web), remoção local e undo
  const handleDelete = async (item: Cadastro) => {
    const message = `Deseja excluir o cadastro "${item.produtoNomeLivre || item.produtoRef}"?`;

    try {
      // Usar confirmação cross-platform (Alert ou window.confirm)
      const confirmed = await confirmAction(message, "Confirmar exclusão");

      if (!confirmed) return;

      // Guardar item para possível undo
      deletedCadastroRef.current = item;

      // Limpar timeout anterior se existir
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }

      // Remover localmente
      const all = await getCadastros();
      const remaining = all.filter((c) => c.cadastroId !== item.cadastroId);
      await setCadastrosStorage(remaining);

      // Tentar remover do Sheets em background (não bloqueia)
      deleteCadastroFromSheets(item.cadastroId).catch((error) => {
        console.warn(
          "Aviso: Cadastro deletado localmente mas falhou na sincronização com Sheets",
          error
        );
      });

      // Recarregar lista
      await loadCadastros();

      // Mostrar alert com opção de desfazer (5 segundos)
      let undoAvailable = true;
      undoTimeoutRef.current = setTimeout(() => {
        undoAvailable = false;
        deletedCadastroRef.current = null;
      }, 5000);

      Alert.alert(
        "✅ Cadastro Excluído",
        `"${item.produtoNomeLivre || item.produtoRef}" foi excluído. Desfazer nos próximos 5 segundos?`,
        [
          {
            text: "Desfazer",
            onPress: async () => {
              if (!undoAvailable || !deletedCadastroRef.current) {
                Alert.alert("Tempo expirado", "O tempo para desfazer expirou");
                return;
              }

              try {
                // Restaurar cadastro
                const allCadastros = await getCadastros();
                allCadastros.push(deletedCadastroRef.current);
                await setCadastrosStorage(allCadastros);
                await loadCadastros();

                Alert.alert("✅ Restaurado", "Cadastro restaurado com sucesso");
                deletedCadastroRef.current = null;
              } catch (error) {
                Alert.alert("Erro", "Não foi possível restaurar o cadastro");
              }
            },
          },
          {
            text: "Manter exclusão",
            style: "cancel",
            onPress: () => {
              deletedCadastroRef.current = null;
            },
          },
        ]
      );
    } catch (error) {
      console.error("Erro ao confirmar/excluir cadastro:", error);
      Alert.alert("Erro", "Não foi possível processar a exclusão");
    }
  };

  // Redirecionar se não for coordenador
  if (!isCoord) {
    return (
      <ScreenContainer className="justify-center items-center p-6">
        <Text className="text-base text-muted text-center">
          Acesso restrito a coordenadores
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-4 gap-4">
          <Text className="text-2xl font-bold text-foreground">
            Todos os Cadastros
          </Text>

          {/* Busca */}
          <TextInput
            className="border border-border rounded-lg px-4 py-3"
            placeholder="Buscar por produto, ATC, canal..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ backgroundColor: colors.surface, color: colors.foreground }}
          />

          {/* Filtros */}
          <View className="flex-row gap-2">
            {/* Categoria */}
            <View className="flex-1 bg-surface border border-border rounded-lg overflow-hidden">
              <Picker
                selectedValue={filterCategoria}
                onValueChange={(value: string) => setFilterCategoria(value)}
                style={{ color: colors.foreground, fontSize: 12, backgroundColor: colors.surface }}
              >
                <Picker.Item label="Todas categorias" value="" />
                {CATEGORIAS.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>

            {/* Estado */}
            <View className="flex-1 bg-surface border border-border rounded-lg overflow-hidden">
              <Picker
                selectedValue={filterEstado}
                onValueChange={(value: string) => setFilterEstado(value)}
                style={{ color: colors.foreground, fontSize: 12, backgroundColor: colors.surface }}
              >
                <Picker.Item label="Todos estados" value="" />
                {ESTADOS_UF.map((uf) => (
                  <Picker.Item key={uf} label={uf} value={uf} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Filtro Implantado */}
          <View className="bg-surface border border-border rounded-lg overflow-hidden">
            <Picker
              selectedValue={filterImplantado}
              onValueChange={(value: string) => setFilterImplantado(value)}
              style={{ color: colors.foreground, backgroundColor: colors.surface }}
            >
              <Picker.Item label="Todos os status" value="" />
              <Picker.Item label="Implantado" value="Sim" />
              <Picker.Item label="Não Implantado" value="Não" />
            </Picker>
          </View>

          {/* Contador */}
          <Text className="text-sm text-muted">
            {filteredCadastros.length} de {cadastros.length} cadastro(s)
          </Text>
        </View>

        {/* Lista */}
        <FlatList
          data={filteredCadastros}
          renderItem={renderCadastroCard}
          keyExtractor={(item) => item.cadastroId}
          contentContainerStyle={{ padding: 24, paddingTop: 0 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-base text-muted text-center">
                Nenhum cadastro encontrado
              </Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}
