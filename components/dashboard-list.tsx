import { View, Text, ScrollView } from "react-native";

interface DashboardListItemProps {
  label: string;
  value: number | string;
  percentage?: number;
}

interface DashboardListProps {
  items: DashboardListItemProps[];
  title?: string;
  maxItems?: number;
}

export function DashboardList({
  items,
  title,
  maxItems = 5,
}: DashboardListProps) {
  const displayItems = items.slice(0, maxItems);
  const maxValue = Math.max(
    ...displayItems
      .filter((i) => typeof i.value === "number")
      .map((i) => i.value as number),
    1
  );

  return (
    <View className="bg-surface rounded-lg p-4">
      {title && (
        <Text className="text-lg font-semibold text-foreground mb-3">
          {title}
        </Text>
      )}
      <View className="gap-2">
        {displayItems.map((item, index) => {
          const percentage =
            typeof item.value === "number"
              ? (item.value / maxValue) * 100
              : 0;

          return (
            <View
              key={`${item.label}-${index}`}
              className="gap-1 border-b border-border pb-2 last:border-b-0"
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-medium text-foreground flex-1">
                  {item.label}
                </Text>
                <Text className="text-sm font-bold text-primary">
                  {item.value}
                </Text>
              </View>
              {typeof item.value === "number" && (
                <View className="h-1 bg-border rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
