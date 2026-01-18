import { View, Text, ScrollView } from "react-native";

interface DashboardChartBarProps {
  items: Array<{ label: string; value: number; max?: number }>;
  title?: string;
  subtitle?: string;
}

export function DashboardChartBar({ items, title, subtitle }: DashboardChartBarProps) {
  const maxValue = Math.max(...items.map(i => i.value), 1);

  return (
    <View className="bg-surface rounded-lg p-4 gap-2">
      {title && (
        <View>
          <Text className="text-lg font-semibold text-foreground">{title}</Text>
          {subtitle && <Text className="text-xs text-muted mt-1">{subtitle}</Text>}
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingVertical: 4, paddingHorizontal: 4 }}
      >
        {items.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <View key={`${item.label}-${index}`} className="gap-1 items-center">
              <View className="h-28 w-14 bg-border rounded-t-lg overflow-hidden justify-end">
                <View
                  className="bg-primary w-full"
                  style={{ height: `${percentage}%` }}
                />
              </View>
              <Text className="text-[11px] font-semibold text-primary">
                {item.value}
              </Text>
              <Text className="text-[10px] text-muted text-center w-14">
                {item.label.length > 10
                  ? item.label.substring(0, 10) + "..."
                  : item.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
