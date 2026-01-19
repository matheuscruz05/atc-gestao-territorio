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
import { deleteCadastroFromSheets, syncCadastrosFromSheets } from "@/lib/google-sheets-sync";
import { confirmAction } from "@/lib/confirm";
import type { Cadastro, CategoriaData, Implantado } from "@/types/models";
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

  // Helper: Converter cadastro antigo para novo formato
  const normalizeToNewFormat = (cadastro: Cadastro): Cadastro => {
    // Se já tem categorias no novo formato, retornar como está
    if (cadastro.categorias && cadastro.categorias.length > 0) {
      // Garantir migração de campos de potencial e safra
      const migrated = cadastro.categorias.map(cat => ({
        ...cat,
        safra: cat.safra ?? "Verão",
        potencialAtingido: cat.potencialAtingido ?? (cat.implantado === "Sim" ? (cat.potencialValor || 0) : 0),
        potencialTotal: cat.potencialTotal ?? (cat.potencialValor || 0),
      }));
      return {
        ...cadastro,
        categorias: migrated,
      };
    }

    // Se tem apenas categoria antiga, converter
    if (cadastro.categoria) {
      const oldData: CategoriaData = {
        categoria: cadastro.categoria,
        produtoRef: cadastro.produtoRef || "",
        produtoNomeLivre: cadastro.produtoNomeLivre || "",
        unidadePotencial: cadastro.unidadePotencial || "tons",
        implantado: cadastro.implantado || "Não",
        safra: "Verão",
        potencialAtingido: cadastro.implantado === "Sim" ? (cadastro.potencialValor || 0) : 0,
        potencialTotal: cadastro.potencialValor || 0,
        concorrentes: cadastro.concorrentes || "",
        observacao: cadastro.observacao || "",
      };

      const newCategorias = CATEGORIAS.map((cat) =>
        cat === cadastro.categoria
          ? oldData
          : {
              categoria: cat,
              produtoRef: "",
              produtoNomeLivre: "",
              unidadePotencial: "tons" as const,
              implantado: "Não" as Implantado,
              potencialAtingido: 0,
              potencialTotal: 0,
              concorrentes: "",
              observacao: "",
            }
      );

      return {
        ...cadastro,
        categorias: newCategorias,
      };
    }

    // Se não tem nem categoria antiga nem nova, retornar com 5 categorias vazias
    return {
      ...cadastro,
      categorias: CATEGORIAS.map((cat) => ({
        categoria: cat,
        produtoRef: "",
        produtoNomeLivre: "",
        unidadePotencial: "tons" as const,
        implantado: "Não" as Implantado,
        potencialAtingido: 0,
        potencialTotal: 0,
        concorrentes: "",
        observacao: "",
      })),
    };
  };

  const loadCadastros = useCallback(async () => {
    try {
      // Buscar SEMPRE do Google Sheets (ambiente web/Vercel)
      let allCadastros: Cadastro[] = [];
      try {
        const sheetsCadastros = await syncCadastrosFromSheets();
        if (sheetsCadastros && sheetsCadastros.length > 0) {
          allCadastros = sheetsCadastros;
          console.log(`✅ [Cadastros Screen] Carregados ${allCadastros.length} cadastros do Google Sheets`);
        } else {
          // Fallback para localStorage se Sheets estiver vazio
          console.warn(`⚠️ [Cadastros Screen] Google Sheets vazio, usando localStorage como fallback`);
          allCadastros = await getCadastros();
        }
      } catch (error) {
        console.error(`❌ [Cadastros Screen] Erro ao buscar do Google Sheets, usando localStorage:`, error);
        allCadastros = await getCadastros();
      }
      
      // Filtrar cadastros não deletados e converter para novo formato
      const active = allCadastros
        .filter(c => !c.deletado)
        .map(c => normalizeToNewFormat(c));
      setCadastros(active);
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
          (c.produtoRef && c.produtoRef.toLowerCase().includes(query)) ||
          (c.produtoNomeLivre && c.produtoNomeLivre.toLowerCase().includes(query)) ||
          (c.canal && c.canal.toLowerCase().includes(query)) ||
          (c.unidade && c.unidade.toLowerCase().includes(query)) ||
          (c.atcNome && c.atcNome.toLowerCase().includes(query))
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
    // Helper: verificar se categoria está completa
    const isCategoriaCompleta = (catData: any) => {
      return (
        catData.categoria &&
        (catData.produtoRef || catData.produtoNomeLivre) &&
        catData.unidadePotencial &&
        catData.implantado &&
        catData.potencialTotal > 0 &&
        catData.concorrentes && catData.concorrentes.trim() &&
        catData.observacao && catData.observacao.trim()
      );
    };

    return (
      <View className="bg-surface rounded-lg border border-border overflow-hidden mb-3">
        {/* Header com Gradiente */}
        <View className="bg-gradient-to-r from-primary to-primary-light p-3">
          <Text className="text-lg font-bold text-white">
            {item.canal} • {item.unidade}
          </Text>
          <Text className="text-xs text-white opacity-80 mt-1">
            {item.estado}
          </Text>
        </View>

        {/* Conteúdo Principal */}
        <View className="p-4 gap-3">
          {/* Info ATC e Data */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-xs text-muted">ATC</Text>
              <Text className="text-sm font-semibold text-foreground">{item.atcNome}</Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-xs text-muted">Criado em</Text>
              <Text className="text-sm font-semibold text-foreground">
                {new Date(item.criadoEm).toLocaleDateString("pt-BR")}
              </Text>
            </View>
          </View>

          {/* Categorias com detalhes */}
          {item.categorias && item.categorias.length > 0 && (
            <View className="gap-3 border-t border-border pt-3">
              {item.categorias.map((catData: any, idx: number) => {
                const completa = isCategoriaCompleta(catData);
                const produtoNome = catData.produtoNomeLivre || catData.produtoRef;

                return (
                  <View key={idx} className="bg-background rounded-lg p-3 border border-border">
                    {/* Categoria, Safra e Status */}
                    <View className="flex-row items-center gap-2 mb-3">
                      <Text className={`text-xl font-bold ${completa ? "text-success" : "text-warning"}`}>
                        {completa ? "✓" : "?"}
                      </Text>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold text-foreground">
                          {catData.categoria}
                        </Text>
                        <Text className="text-xs text-muted">{produtoNome}</Text>
                      </View>
                      {/* Safra Badge */}
                      <View className={`px-2 py-1 rounded ${catData.safra === "Verão" ? "bg-orange-500/20" : "bg-blue-500/20"}`}>
                        <Text className={`text-xs font-bold ${catData.safra === "Verão" ? "text-orange-500" : "text-blue-500"}`}>
                          {catData.safra === "Verão" ? "☀️ Verão" : "❄️ Inverno"}
                        </Text>
                      </View>
                    </View>

                    {/* Grid com informações */}
                    <View className="gap-2">
                      {/* Potenciais */}
                      {catData.implantado === "Sim" && catData.potencialAtingido > 0 && (
                        <View className="flex-row items-center gap-2">
                          <Text className="text-xs font-semibold text-muted w-24">
                            📊 Pot. Atingido:
                          </Text>
                          <Text className="text-xs text-foreground flex-1">
                            {catData.potencialAtingido} {catData.unidadePotencial === "tons" ? "tons" : "litros"}
                          </Text>
                        </View>
                      )}
                      
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs font-semibold text-muted w-24">
                          📊 Pot. Total:
                        </Text>
                        <Text className="text-xs text-foreground flex-1">
                          {catData.potencialTotal || catData.potencialValor || 0} {catData.unidadePotencial === "tons" ? "tons" : "litros"}
                        </Text>
                      </View>

                      {catData.potencialTotal > 0 && (
                        <View className="flex-row items-center gap-2 bg-primary/10 rounded p-2 -mx-1">
                          <Text className="text-xs font-semibold text-primary w-24">
                            💡 Pot. Real:
                          </Text>
                          <Text className="text-xs font-bold text-primary flex-1">
                            {((catData.potencialTotal || catData.potencialValor || 0) - (catData.potencialAtingido || 0)).toFixed(1)} {catData.unidadePotencial === "tons" ? "tons" : "litros"}
                          </Text>
                        </View>
                      )}

                      {/* Produtor já utiliza? */}
                      <View className="flex-row items-center gap-2">
                        <Text className="text-xs font-semibold text-muted w-24">
                          ✅ Produtor já utiliza?:
                        </Text>
                        <Text className={`text-xs font-semibold px-2 py-1 rounded ${
                          catData.implantado === "Sim"
                            ? "bg-success text-white"
                            : "bg-gray-700 text-white"
                        }`}>
                          {catData.implantado}
                        </Text>
                      </View>

                      {/* Concorrentes */}
                      <View className="flex-row gap-2">
                        <Text className="text-xs font-semibold text-muted w-24">
                          🏆 Concorrente:
                        </Text>
                        <Text className="text-xs text-foreground flex-1">
                          {catData.concorrentes || "—"}
                        </Text>
                      </View>

                      {/* Observação */}
                      <View className="gap-1">
                        <Text className="text-xs font-semibold text-muted">
                          📝 Observação:
                        </Text>
                        <Text className="text-xs text-foreground bg-surface rounded p-2 border border-border leading-relaxed">
                          {catData.observacao || "—"}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Botões Editar e Excluir */}
          {isCoord && (
            <View className="flex-row gap-2 border-t border-border pt-3 mt-2">
              <TouchableOpacity
                className="flex-1 bg-primary rounded-lg py-2.5 flex-row items-center justify-center"
                onPress={() => handleEdit(item)}
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold">✏️ Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 bg-error rounded-lg py-2.5 flex-row items-center justify-center"
                onPress={() => handleDelete(item)}
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold">🗑️ Excluir</Text>
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

      // Marcar como deletado (soft delete) ao invés de remover
      const all = await getCadastros();
      const updated = all.map((c) => 
        c.cadastroId === item.cadastroId ? { ...c, deletado: true } : c
      );
      await setCadastrosStorage(updated);

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
                // Restaurar cadastro (remover flag deletado)
                const allCadastros = await getCadastros();
                const restored = allCadastros.map((c) => 
                  c.cadastroId === deletedCadastroRef.current!.cadastroId 
                    ? { ...c, deletado: false } 
                    : c
                );
                await setCadastrosStorage(restored);
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
        <View className="px-6 pt-6 pb-4 gap-3">
          <Text className="text-2xl font-bold text-foreground">
            Todos os Cadastros
          </Text>

          {/* Busca */}
          <TextInput
            className="border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="Buscar por ATC, canal, unidade..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{ backgroundColor: colors.surface, color: colors.foreground }}
          />

          {/* Filtros - Layout em Grid 2x2 */}
          <View className="gap-2">
            {/* Primeira linha: Categoria e Estado */}
            <View className="flex-row gap-2">
              {/* Categoria */}
              <View className="flex-1">
                <Text className="text-sm font-semibold text-muted mb-1">Categoria</Text>
                <View className="bg-surface border border-border rounded-lg overflow-hidden">
                  <Picker
                    selectedValue={filterCategoria}
                    onValueChange={(value: string) => setFilterCategoria(value)}
                    style={{ color: colors.foreground, fontSize: 12, backgroundColor: colors.surface }}
                  >
                    <Picker.Item label="Todas" value="" />
                    {CATEGORIAS.map((cat) => (
                      <Picker.Item key={cat} label={cat} value={cat} />
                    ))}
                  </Picker>
                </View>
              </View>

              {/* Estado */}
              <View className="flex-1">
                <Text className="text-sm font-semibold text-muted mb-1">Estado</Text>
                <View className="bg-surface border border-border rounded-lg overflow-hidden">
                  <Picker
                    selectedValue={filterEstado}
                    onValueChange={(value: string) => setFilterEstado(value)}
                    style={{ color: colors.foreground, fontSize: 12, backgroundColor: colors.surface }}
                  >
                    <Picker.Item label="Todos" value="" />
                    <Picker.Item label="PR" value="PR" />
                    <Picker.Item label="SC" value="SC" />
                  </Picker>
                </View>
              </View>
            </View>

            {/* Segunda linha: Produto já utiliza? */}
            <View>
              <Text className="text-sm font-semibold text-muted mb-1">Produtor já utiliza?</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg ${filterImplantado === "" ? "bg-primary" : "bg-surface border border-border"}`}
                  onPress={() => setFilterImplantado("")}
                  activeOpacity={0.7}
                >
                  <Text className={`text-center text-sm font-semibold ${filterImplantado === "" ? "text-white" : "text-foreground"}`}>
                    TODOS
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg ${filterImplantado === "Sim" ? "bg-primary" : "bg-surface border border-border"}`}
                  onPress={() => setFilterImplantado("Sim")}
                  activeOpacity={0.7}
                >
                  <Text className={`text-center text-sm font-semibold ${filterImplantado === "Sim" ? "text-white" : "text-foreground"}`}>
                    Sim
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 py-3 rounded-lg ${filterImplantado === "Não" ? "bg-primary" : "bg-surface border border-border"}`}
                  onPress={() => setFilterImplantado("Não")}
                  activeOpacity={0.7}
                >
                  <Text className={`text-center text-sm font-semibold ${filterImplantado === "Não" ? "text-white" : "text-foreground"}`}>
                    Não
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Contador */}
          <Text className="text-xs text-muted mt-1">
            Exibindo {filteredCadastros.length} de {cadastros.length} cadastro(s)
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
