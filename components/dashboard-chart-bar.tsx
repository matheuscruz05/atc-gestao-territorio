import { View, Text, ScrollView } from "react-native";

interface DashboardChartBarProps {
  items: Array<{ label: string; value: number; max?: number }>;
  title?: string;
}

export function DashboardChartBar({ items, title }: DashboardChartBarProps) {
  const maxValue = Math.max(...items.map(i => i.value), 1);

  return (
    <View className="bg-surface rounded-lg p-4 gap-3">
      {title && (
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        {items.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <View key={`${item.label}-${index}`} className="gap-1 items-center">
              <View className="h-32 w-12 bg-border rounded-t-lg overflow-hidden">
                <View
                  className="bg-primary w-full"
                  style={{ height: `${percentage}%` }}
                />
              </View>
              <Text className="text-xs font-semibold text-primary">
                {item.value}
              </Text>
              <Text className="text-xs text-muted text-center w-12">
                {item.label.length > 8
                  ? item.label.substring(0, 8) + "..."
                  : item.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
