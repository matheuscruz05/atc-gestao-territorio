import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/lib/auth-context";
import { useColors } from "@/hooks/use-colors";
import {
  getProdutos,
  getCanais,
  getUnidades,
  addCadastro,
  generateUniqueId,
  getCadastros,
} from "@/lib/storage";
import { sendCadastroToSheets } from "@/lib/google-sheets-sync";
import { useToast } from "@/lib/toast";
import { enqueueCadastro } from "@/lib/sync-queue";
import type {
  Produto,
  Canal,
  Unidade,
  Categoria,
  Implantado,
  Cadastro,
} from "@/types/models";
import { CATEGORIAS, ESTADOS_UF } from "@/types/models";
import { Picker } from "@react-native-picker/picker";

export default function NovoCadastroScreen() {
  const { user } = useAuth();
  const colors = useColors();
  const router = useRouter();
  const toast = useToast();

  // Dados de referência
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [canais, setCanais] = useState<Canal[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);

  // Campos do formulário
  const [canal, setCanal] = useState("");
  const [unidade, setUnidade] = useState("");
  const [estado, setEstado] = useState("");
  const [categoria, setCategoria] = useState<Categoria | "">("");
  const [produtoRef, setProdutoRef] = useState("");
  const [produtoNomeLivre, setProdutoNomeLivre] = useState("");
  const [implantado, setImplantado] = useState<Implantado>("Não");
  const [potencialValor, setPotencialValor] = useState("");
  const [concorrentes, setConcorrentes] = useState("");
  const [observacao, setObservacao] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originalCreatedEm, setOriginalCreatedEm] = useState<string | null>(null);

  const params = useLocalSearchParams();
  const editId = (params as any)?.editId as string | undefined;

  // Carregar dados de referência
  useEffect(() => {
    async function loadData() {
      const [produtosData, canaisData, unidadesData] = await Promise.all([
        getProdutos(),
        getCanais(),
        getUnidades(),
      ]);
      setProdutos(produtosData.filter((p) => p.ativo));
      setCanais(canaisData.filter((c) => c.ativo));
      setUnidades(unidadesData.filter((u) => u.ativo));
    }
    loadData();
  }, []);

  // Se vier editId, carregar cadastro existente
  useEffect(() => {
    async function loadForEdit() {
      if (!editId) return;
      try {
        const all = await getCadastros();
        const found = all.find((c) => c.cadastroId === editId);
        if (found) {
          setCanal(found.canal);
          setUnidade(found.unidade);
          setEstado(found.estado);
          setCategoria(found.categoria as any);
          setProdutoRef(found.produtoRef);
          setProdutoNomeLivre(found.produtoNomeLivre || "");
          setImplantado(found.implantado || "Não");
          setPotencialValor(String(found.potencialValor || ""));
          setConcorrentes(found.concorrentes || "");
          setObservacao(found.observacao || "");
          setIsEditing(true);
          setEditingId(found.cadastroId);
          setOriginalCreatedEm(found.criadoEm || null);
        }
      } catch (error) {
        console.error("Erro ao carregar cadastro para edição:", error);
      }
    }

    loadForEdit();
  }, [editId]);

  // Produtos filtrados por categoria
  const produtosFiltrados = categoria
    ? produtos.filter((p) => p.categoria === categoria)
    : [];

  // Unidade potencial do produto selecionado
  const unidadePotencial = produtoRef
    ? produtos.find((p) => p.produtoId === produtoRef)?.unidadePotencial || ""
    : "";

  // Validar e salvar
  const handleSalvar = async () => {
    // Validações
    if (!canal) {
      Alert.alert("Erro", "Selecione um canal");
      return;
    }
    if (!unidade) {
      Alert.alert("Erro", "Selecione uma unidade");
      return;
    }
    if (!estado) {
      Alert.alert("Erro", "Selecione um estado");
      return;
    }
    if (!categoria) {
      Alert.alert("Erro", "Selecione uma categoria");
      return;
    }
    if (!produtoRef) {
      Alert.alert("Erro", "Selecione um produto");
      return;
    }

    // Validação: Produto Livre obrigatório para HIDROSSOLÚVEIS
    if (categoria === "HIDROSSOLÚVEIS" && !produtoNomeLivre.trim()) {
      Alert.alert("Erro", "Produto Livre é obrigatório para HIDROSSOLÚVEIS");
      return;
    }

    // Validação: Potencial obrigatório se Implantado = Sim
    if (implantado === "Sim" && !potencialValor.trim()) {
      Alert.alert("Erro", "Potencial é obrigatório quando Implantado = Sim");
      return;
    }

    setIsLoading(true);
    try {
      const novoCadastro: Cadastro = {
        cadastroId: isEditing && editingId ? editingId : generateUniqueId(),
        criadoEm: isEditing && originalCreatedEm ? originalCreatedEm : new Date().toISOString(),
        atcEmail: user!.email,
        atcNome: user!.nome,
        canal,
        unidade,
        estado,
        categoria: categoria as Categoria,
        produtoRef,
        produtoNomeLivre: produtoNomeLivre.trim() || undefined,
        unidadePotencial: unidadePotencial as any,
        implantado,
        potencialValor: parseFloat(potencialValor) || 0,
        concorrentes,
        observacao,
      };

      // Salvar localmente
      await addCadastro(novoCadastro);

      // Tentar sincronizar com Google Sheets
      const syncResult = await sendCadastroToSheets(novoCadastro);

      if (syncResult.success) {
        const title = isEditing ? "✅ Cadastro Atualizado" : "✅ Sucesso";
        const message = isEditing
          ? "Cadastro atualizado e sincronizado com Google Sheets!"
          : "Cadastro salvo e sincronizado com Google Sheets!";

        toast.show("success", title, message);
        // Small delay so the toast is visible before navigating back
        setTimeout(() => router.back(), 600);
      } else {
        // Enfileirar para retry em segundo plano e notificar o usuário
        await enqueueCadastro(novoCadastro);
        const title = isEditing ? "⚠️ Cadastro Atualizado" : "⚠️ Cadastro Salvo";
        const message = (isEditing ? "Dados atualizados localmente." : "Dados salvos localmente.") +
          " Sincronização pendente — será tentada automaticamente.";

        toast.show("info", title, message);
        setTimeout(() => router.back(), 600);
      }
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro ao salvar o cadastro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        <View className="p-6 gap-4">
          {/* Header */}
          <View className="flex-row items-center gap-4 mb-2">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-primary text-base">← Voltar</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-foreground flex-1">
              Novo Cadastro
            </Text>
          </View>

          {/* Canal */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Canal *
            </Text>
            <View className="bg-surface border border-border rounded-lg overflow-hidden">
              <Picker
                selectedValue={canal}
                onValueChange={setCanal}
                style={{ color: colors.foreground, backgroundColor: colors.surface }}
              >
                <Picker.Item label="Selecione..." value="" />
                {canais.map((c) => (
                  <Picker.Item key={c.canalId} label={c.canal} value={c.canal} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Unidade */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Unidade *
            </Text>
            <View className="bg-surface border border-border rounded-lg overflow-hidden">
              <Picker
                selectedValue={unidade}
                onValueChange={setUnidade}
                style={{ color: colors.foreground, backgroundColor: colors.surface }}
              >
                <Picker.Item label="Selecione..." value="" />
                {unidades.map((u) => (
                  <Picker.Item
                    key={u.unidadeId}
                    label={`${u.unidade}${u.estadoUf ? ` (${u.estadoUf})` : ""}`}
                    value={u.unidade}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Estado */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Estado (UF) *
            </Text>
            <View className="bg-surface border border-border rounded-lg overflow-hidden">
              <Picker
                selectedValue={estado}
                onValueChange={setEstado}
                style={{ color: colors.foreground, backgroundColor: colors.surface }}
              >
                <Picker.Item label="Selecione..." value="" />
                {ESTADOS_UF.map((uf) => (
                  <Picker.Item key={uf} label={uf} value={uf} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Categoria */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Categoria *
            </Text>
            <View className="bg-surface border border-border rounded-lg overflow-hidden">
              <Picker
                selectedValue={categoria}
                onValueChange={(value: string) => {
                  setCategoria(value as Categoria);
                  setProdutoRef(""); // Resetar produto ao mudar categoria
                }}
                style={{ color: colors.foreground, backgroundColor: colors.surface }}
              >
                <Picker.Item label="Selecione..." value="" />
                {CATEGORIAS.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Produto */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Produto *
            </Text>
            <View className="bg-surface border border-border rounded-lg overflow-hidden">
              <Picker
                selectedValue={produtoRef}
                onValueChange={setProdutoRef}
                enabled={!!categoria}
                style={{ color: colors.foreground, backgroundColor: colors.surface }}
              >
                <Picker.Item label="Selecione..." value="" />
                {produtosFiltrados.map((p) => (
                  <Picker.Item
                    key={p.produtoId}
                    label={p.produto}
                    value={p.produtoId}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Produto Livre (apenas para HIDROSSOLÚVEIS) */}
          {categoria === "HIDROSSOLÚVEIS" && (
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">
                Produto Livre *
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted"
                placeholder="Nome do produto hidrossolúvel"
                placeholderTextColor={colors.muted}
                value={produtoNomeLivre}
                onChangeText={setProdutoNomeLivre}
                style={{ color: colors.foreground, backgroundColor: colors.surface }}
              />
            </View>
          )}

          {/* Implantado */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Implantado *
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg border ${
                  implantado === "Sim"
                    ? "bg-success border-success"
                    : "bg-surface border-border"
                }`}
                onPress={() => setImplantado("Sim")}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-center font-semibold ${
                    implantado === "Sim" ? "text-white" : "text-foreground"
                  }`}
                >
                  Sim
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg border ${
                  implantado === "Não"
                    ? "bg-primary border-primary"
                    : "bg-surface border-border"
                }`}
                onPress={() => setImplantado("Não")}
                activeOpacity={0.8}
              >
                <Text
                  className={`text-center font-semibold ${
                    implantado === "Não" ? "text-white" : "text-foreground"
                  }`}
                >
                  Não
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Potencial */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Potencial {implantado === "Sim" && "*"}
            </Text>
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted"
                placeholder="0"
                placeholderTextColor={colors.muted}
                value={potencialValor}
                onChangeText={setPotencialValor}
                keyboardType="numeric"
                style={{ color: colors.foreground, backgroundColor: colors.surface }}
              />
              {unidadePotencial && (
                <Text className="text-base font-medium text-muted">
                  {unidadePotencial}
                </Text>
              )}
            </View>
          </View>

          {/* Concorrentes */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Concorrentes
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted"
              placeholder="Liste os concorrentes..."
              placeholderTextColor={colors.muted}
              value={concorrentes}
              onChangeText={setConcorrentes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{ color: colors.foreground, backgroundColor: colors.surface }}
            />
          </View>

          {/* Observação */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">
              Observação
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted"
              placeholder="Observações adicionais..."
              placeholderTextColor={colors.muted}
              value={observacao}
              onChangeText={setObservacao}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{ color: colors.foreground, backgroundColor: colors.surface }}
            />
          </View>

          {/* Botão Salvar */}
          <TouchableOpacity
            className="bg-primary rounded-lg py-4 items-center mt-4"
            onPress={handleSalvar}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Salvar Cadastro
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
