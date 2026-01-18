import { View, Text, ScrollView } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface CompetitorChartProps {
  items: Array<{ label: string; value: number }>;
  title?: string;
}

export function DashboardCompetitorsChart({ items, title }: CompetitorChartProps) {
  const colors = useColors();
  const maxValue = Math.max(...items.map(i => i.value), 1);

  // Cores para diferentes posições (ranking)
  const getRankColor = (index: number) => {
    if (index === 0) return "from-amber-500 to-amber-600"; // 1º lugar - ouro
    if (index === 1) return "from-gray-400 to-gray-500"; // 2º lugar - prata
    if (index === 2) return "from-orange-600 to-orange-700"; // 3º lugar - bronze
    return "from-blue-500 to-blue-600"; // Demais
  };

  const getBgColor = (index: number) => {
    if (index === 0) return "bg-amber-100 dark:bg-amber-900/20";
    if (index === 1) return "bg-gray-100 dark:bg-gray-800/30";
    if (index === 2) return "bg-orange-100 dark:bg-orange-900/20";
    return "bg-blue-100 dark:bg-blue-900/20";
  };

  return (
    <View className="bg-surface rounded-lg p-4 gap-4 border border-border">
      {title && (
        <Text className="text-lg font-bold text-foreground">{title}</Text>
      )}

      {items.length === 0 ? (
        <View className="items-center justify-center py-8">
          <Text className="text-sm text-muted">Nenhum concorrente registrado</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="gap-3">
          {items.map((item, index) => {
            const percentage = (item.value / maxValue) * 100;
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "▪️";

            return (
              <View
                key={`${item.label}-${index}`}
                className={`rounded-lg p-3 gap-2 ${getBgColor(index)}`}
              >
                {/* Título com ranking */}
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-row items-center gap-2 flex-1">
                    <Text className="text-lg">{medal}</Text>
                    <Text className="text-sm font-semibold text-foreground flex-1 flex-wrap">
                      {item.label}
                    </Text>
                  </View>
                  <View className="bg-primary rounded-full px-2.5 py-1 flex-shrink-0">
                    <Text className="text-xs font-bold text-white">{item.value}x</Text>
                  </View>
                </View>

                {/* Barra de progresso horizontal */}
                <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <View
                    className={`h-full bg-gradient-to-r ${getRankColor(index)}`}
                    style={{ width: `${Math.max(percentage, 8)}%` }}
                  />
                </View>

                {/* Percentual */}
                <Text className="text-xs text-muted text-right">
                  {percentage.toFixed(0)}% da base
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Legenda */}
      {items.length > 0 && (
        <View className="pt-2 border-t border-border gap-2">
          <Text className="text-xs font-semibold text-muted">Interpretação:</Text>
          <Text className="text-xs text-muted leading-relaxed">
            A frequência mostra em quantos cadastros cada concorrente foi mencionado. Barras maiores = concorrentes mais comuns para este produto.
          </Text>
        </View>
      )}
    </View>
  );
}
