import React, { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  Button,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Picker } from "@react-native-picker/picker";
import { PieChart } from "react-native-chart-kit";
import { Calendar } from "react-native-calendars";
import { LocaleConfig } from "react-native-calendars";

LocaleConfig.locales["ja"] = {
  monthNames: [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ],
  monthNamesShort: [
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
  ],
  dayNames: [
    "日曜日",
    "月曜日",
    "火曜日",
    "水曜日",
    "木曜日",
    "金曜日",
    "土曜日",
  ],
  dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"],
  today: "今日",
};

LocaleConfig.defaultLocale = "ja";

const screenWidth = Dimensions.get("window").width;
const Tab = createBottomTabNavigator();

const categories = [
  "遊び",
  "旅行",
  "サブスクリプション",
  "ショッピング",
  "飲食",
  "推し活",
  "その他",
];

const categoryLabels = {
  Games: "遊び",
  Events: "旅行",
  Subscriptions: "サブスクリプション",
  Shopping: "ショッピング",
  Food: "飲食",
  "Hobby gear": "推し活",
  Other: "その他",
};

const getCategoryLabel = (category) => categoryLabels[category] || category;

const colors = [
  "#96abbd",
  "#687c8d",
  "#e9e9e9",
  "#c5bfb9",
  "#948f89",
  "#c0c0c0",
  "#696969",
];

const STORAGE_KEYS = {
  dataList: "DATA_LIST",
  recentItems: "RECENT_ITEMS",
  monthlyLimit: "MONTHLY_LIMIT",
};

const formatDateForCalendar = (date) => {
  const [year, month, day] = date.split("/");

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

function confirmAction(title, message, onConfirm) {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: "キャンセル", style: "cancel" },
    { text: "削除", style: "destructive", onPress: onConfirm },
  ]);
}

function InputScreen({
  category,
  setCategory,
  amount,
  setAmount,
  year,
  setYear,
  month,
  setMonth,
  day,
  setDay,
  addItem,
  monthlyLimit,
  setMonthlyLimit,
  memo,
  setMemo,
  recentItems,
  clearRecent,
}) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Hobby Budget</Text>

        <Text style={styles.label}>今月の上限額</Text>
        <TextInput
          style={styles.input}
          placeholder="金額を入力"
          value={monthlyLimit}
          onChangeText={async (text) => {
            const value = text.replace(/[^0-9]/g, "");
            setMonthlyLimit(value);
            await AsyncStorage.setItem(STORAGE_KEYS.monthlyLimit, value);
          }}
          keyboardType="numeric"
        />

        <Text style={styles.label}>最近の入力</Text>
        {recentItems.length > 0 ? (
          <View style={styles.recentContainer}>
            {recentItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  setCategory(item.category);
                  setAmount(String(item.amount));
                  setMemo(item.memo || "");
                }}
                style={styles.recentButton}
              >
                <Text style={styles.recentText}>
                  {getCategoryLabel(item.category)} {item.amount}円
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>最近の入力はありません。</Text>
        )}

        <View style={styles.buttonSpacing}>
          <Button title="履歴を削除" color="#333333" onPress={clearRecent} />
        </View>

        <Text style={styles.label}>メモ</Text>
        <TextInput
          style={styles.input}
          placeholder="例:飲み会"
          value={memo}
          onChangeText={setMemo}
        />

        <Text style={styles.label}>カテゴリ</Text>
        <View style={styles.categoryContainer}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catButton, category === cat && styles.catButtonActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={category === cat ? styles.catTextActive : styles.catText}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>金額</Text>
        <TextInput
          style={styles.input}
          placeholder="金額を入力"
          value={amount}
          onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ""))}
          keyboardType="numeric"
        />

        <View style={styles.quickAmountContainer}>
          {[1000, 2000, 3000, 5000, 10000, 20000, 50000].map((price) => (
            <TouchableOpacity
              key={price}
              onPress={() => setAmount(String(price))}
              style={styles.quickAmountButton}
            >
              <Text style={styles.quickAmountText}>{price}円</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>日付</Text>
        <View style={styles.datePickerRow}>
          <Picker
            style={[styles.picker, { flex: 1.3 }]}
            selectedValue={year}
            onValueChange={setYear}
          >
            {Array.from({ length: 3 }, (_, i) => {
              const value = new Date().getFullYear() - 2 + i;
              return <Picker.Item key={value} label={`${value}`} value={value} />;
            })}
          </Picker>

          <Picker style={styles.picker} selectedValue={month} onValueChange={setMonth}>
            {Array.from({ length: 12 }, (_, i) => {
              const value = i + 1;
              return <Picker.Item key={value} label={`${value}`} value={value} />;
            })}
          </Picker>

          <Picker style={styles.picker} selectedValue={day} onValueChange={setDay}>
            {Array.from({ length: 31 }, (_, i) => {
              const value = i + 1;
              return <Picker.Item key={value} label={`${value}`} value={value} />;
            })}
          </Picker>
        </View>

        <View style={styles.addButton}>
          <Button title="＋追加する" color="#000000" onPress={addItem} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ChartScreen({ limitChartData, categoryChartData, total, limitNum, remaining }) {
  const usageRate = limitNum > 0 ? total / limitNum : 0;
  const warningText =
    usageRate >= 1
      ? "上限額を超えています"
      : usageRate >= 0.8
        ? "⚠️使いすぎ注意"
        : "";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>今月の上限</Text>

      {limitNum > 0 ? (
        <>
          <PieChart
            data={limitChartData}
            width={Math.max(screenWidth - 20, 280)}
            height={220}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="10"
            absolute
            chartConfig={{
              color: () => "#555555",
              labelColor: () => "#555555",
            }}
          />

          <Text style={styles.totalText}>使用済み：{total}円</Text>
          <Text style={[styles.totalText, remaining < 0 && styles.dangerText]}>
            残り：{remaining}円
          </Text>

          {warningText !== "" && (
            <Text style={[styles.warningText, usageRate >= 1 && styles.dangerText]}>
              {warningText}
            </Text>
          )}
        </>
      ) : (
        <Text style={styles.emptyText}>上限額が設定されていません</Text>
      )}

      <Text style={[styles.title, styles.sectionTitle]}>カテゴリ別支出</Text>
      {categoryChartData.length > 0 ? (
        <PieChart
          data={categoryChartData}
          width={Math.max(screenWidth - 20, 280)}
          height={220}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="10"
          absolute
          chartConfig={{
            color: () => "#555555",
            labelColor: () => "#555555",
          }}
        />
      ) : (
        <Text style={styles.emptyText}>まだデータがありません</Text>
      )}
    </ScrollView>
  );
}

function ListScreen({
  dataList,
  selectedItems,
  toggleSelect,
  deleteItem,
  deleteSelected,
  clearAllData,
}) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>支出一覧</Text>
      <Text style={styles.helperText}>{selectedItems.length}件選択中</Text>

      <TouchableOpacity
        onPress={() =>
          confirmAction(
            "選択した項目を削除",
            "削除しますか？",
            deleteSelected,
          )
        }
        style={styles.darkActionButton}
      >
        <Text style={styles.actionButtonText}>選択した項目を削除</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() =>
          confirmAction("全て削除", "削除しますか？", clearAllData)
        }
        style={styles.mutedActionButton}
      >
        <Text style={styles.actionButtonText}>全て削除</Text>
      </TouchableOpacity>

      {dataList.length === 0 ? (
        <Text style={styles.emptyText}>まだ記録がありません</Text>
      ) : (
        [...dataList].reverse().map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => toggleSelect(item.id)}
            style={[
              styles.listCard,
              selectedItems.includes(item.id) && styles.listCardSelected,
            ]}
          >
            <Text style={styles.selectMark}>
              {selectedItems.includes(item.id) ? "選択中" : "タップして選択"}
            </Text>
            <Text style={styles.listText}>{item.date}</Text>
            <Text style={styles.listText}>
              {getCategoryLabel(item.category)}
              {item.memo ? ` / ${item.memo}` : ""}
            </Text>
            <Text style={styles.listAmount}>{item.amount}円</Text>
            <TouchableOpacity
              onPress={() =>
                confirmAction(
                  "削除",
                  "削除しますか？",
                  () => deleteItem(item.id),
                )
              }
              style={styles.deleteLink}
            >
              <Text style={styles.deleteText}>削除</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

function MonthlyScreen({ dataList }) {
  const monthlyData = useMemo(() => {
    return dataList.reduce((acc, item) => {
      const [year, month] = item.date.split("/");
      const key = `${year}/${month}`;

      if (!acc[key]) {
        acc[key] = { total: 0, categories: {} };
      }

      acc[key].total += item.amount;
      acc[key].categories[item.category] =
        (acc[key].categories[item.category] || 0) + item.amount;

      return acc;
    }, {});
  }, [dataList]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>月別集計</Text>

      {Object.keys(monthlyData).length === 0 ? (
        <Text style={styles.emptyText}>支出はまだ登録されていません。</Text>
      ) : (
        Object.entries(monthlyData)
          .reverse()
          .map(([monthLabel, data]) => (
            <View key={monthLabel} style={styles.listCard}>
              <Text style={styles.monthTitle}>{monthLabel}</Text>

              {Object.entries(data.categories).map(([category, amount]) => (
                <Text key={category} style={styles.listText}>
                  {getCategoryLabel(category)}：{amount}円
                </Text>
              ))}

              <Text style={styles.monthTotal}>合計：{data.total}円</Text>
            </View>
          ))
      )}
    </ScrollView>
  );
}

function CalendarScreen({ dataList }) {
  const [currentMonth, setCurrentMonth] = useState(
  new Date().toISOString().split("T")[0]
);
  const [selectedDate, setSelectedDate] = useState(null);
  const currentYear = new Date().getFullYear();

  const minCalendarDate = `${currentYear - 2}-01-01`;
  const maxCalendarDate = `${currentYear}-12-31`;

  const markedDates = {};

dataList.forEach((item) => {
  const date = formatDateForCalendar(item.date);

  markedDates[date] = {
    marked: true,
    dotColor: "#2f5d62",
  };
});

  const selectedItems = selectedDate
    ? dataList.filter(
        (item) => formatDateForCalendar(item.date) === selectedDate
      )
    : [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.title}>カレンダー</Text>
        
      <Calendar
        minDate={minCalendarDate}
        maxDate={maxCalendarDate}
        enableSwipeMonths={false}
        showArrows={true}
        monthFormat={"yyyy年 M月"}
        renderArrow={(direction) => (
          <Text style={{ fontSize: 24 }}>
            {direction === "left" ? "◀" : "▶"}
          </Text>
        )}
        markedDates={{
          ...markedDates,
          ...(selectedDate && {
            [selectedDate]: {
              selected: true,
              selectedColor: "#2f5d62",
              marked: true,
            },
          }),
        }}
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
        }}
      />

      <Text style={[styles.title, styles.sectionTitle]}>
        {selectedDate
          ? `${selectedDate} の支出`
          : "日付を選択してください"}
      </Text>


      {selectedItems.length > 0 ? (
        selectedItems.map((item) => (
          <View key={item.id} style={styles.listCard}>
            <Text style={styles.listText}>
              {getCategoryLabel(item.category)}
            </Text>

            {item.memo && (
              <Text style={styles.listText}>
                {item.memo}
              </Text>
            )}

            <Text style={styles.listAmount}>
              {item.amount}円
            </Text>
          </View>
        ))
      ) : (
        selectedDate && (
          <Text style={styles.emptyText}>
            この日の支出はありません
          </Text>
        )
      )}

    </ScrollView>
  );
}

export default function App() {
  
  useEffect(() => {
    if (Platform.OS === "web") {
      document.title = "Hobby Budget";
    }
  }, []);
    
  const [dataList, setDataList] = useState([]);
  const [category, setCategory] = useState(categories[0]);
  const [amount, setAmount] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [memo, setMemo] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());
  const [recentItems, setRecentItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [savedList, savedRecent, savedLimit] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.dataList),
          AsyncStorage.getItem(STORAGE_KEYS.recentItems),
          AsyncStorage.getItem(STORAGE_KEYS.monthlyLimit),
        ]);

        if (savedList !== null) {
          setDataList(JSON.parse(savedList));
        }
        if (savedRecent !== null) {
          setRecentItems(JSON.parse(savedRecent));
        }
        if (savedLimit !== null) {
          setMonthlyLimit(savedLimit);
        }
      } catch (error) {
        console.log("Failed to load saved data", error);
      }
    };

    loadData();
  }, []);

  const addItem = async () => {
    if (!amount) {
      return;
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount)) {
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      category,
      amount: numericAmount,
      memo,
      date: `${year}/${month}/${day}`,
    };

    const newList = [...dataList, newItem];
    const updatedRecent = [newItem, ...recentItems].slice(0, 5);

    setDataList(newList);
    setRecentItems(updatedRecent);
    setAmount("");
    setMemo("");

    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.dataList, JSON.stringify(newList)),
      AsyncStorage.setItem(STORAGE_KEYS.recentItems, JSON.stringify(updatedRecent)),
    ]);
  };

  const clearRecent = async () => {
    setRecentItems([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.recentItems);
  };

  const deleteItem = async (id) => {
    const newList = dataList.filter((item) => item.id !== id);
    setDataList(newList);
    setSelectedItems(selectedItems.filter((itemId) => itemId !== id));
    await AsyncStorage.setItem(STORAGE_KEYS.dataList, JSON.stringify(newList));
  };

  const toggleSelect = (id) => {
    setSelectedItems((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id],
    );
  };

  const deleteSelected = async () => {
    const newList = dataList.filter((item) => !selectedItems.includes(item.id));
    setDataList(newList);
    setSelectedItems([]);
    await AsyncStorage.setItem(STORAGE_KEYS.dataList, JSON.stringify(newList));
  };

  const clearAllData = async () => {
    setDataList([]);
    setSelectedItems([]);
    await AsyncStorage.removeItem(STORAGE_KEYS.dataList);
  };

  const total = dataList.reduce((sum, item) => sum + item.amount, 0);
  const limitNum = Number(monthlyLimit);
  const remaining = limitNum - total;

  const limitChartData =
    limitNum > 0
      ? [
          {
            name: "支出",
            amount: Math.min(total, limitNum),
            color: "#2f5d62",
            legendFontColor: "#555555",
            legendFontSize: 14,
          },
          {
            name: "残り",
            amount: Math.max(limitNum - total, 0),
            color: "#d7d9dc",
            legendFontColor: "#555555",
            legendFontSize: 14,
          },
        ]
      : [];

  const categoryChartData = categories
    .map((cat, index) => {
      const sum = dataList
        .filter((item) => getCategoryLabel(item.category) === cat)
        .reduce((currentSum, item) => currentSum + item.amount, 0);

      return sum > 0
        ? {
            name: getCategoryLabel(cat),
            amount: sum,
            color: colors[index],
            legendFontColor: "#555555",
            legendFontSize: 14,
          }
        : null;
    })
    .filter(Boolean);

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="入力">
          {() => (
            <InputScreen
              category={category}
              setCategory={setCategory}
              amount={amount}
              setAmount={setAmount}
              year={year}
              setYear={setYear}
              month={month}
              setMonth={setMonth}
              day={day}
              setDay={setDay}
              addItem={addItem}
              monthlyLimit={monthlyLimit}
              setMonthlyLimit={setMonthlyLimit}
              memo={memo}
              setMemo={setMemo}
              recentItems={recentItems}
              clearRecent={clearRecent}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="グラフ">
          {() => (
            <ChartScreen
              limitChartData={limitChartData}
              categoryChartData={categoryChartData}
              total={total}
              limitNum={limitNum}
              remaining={remaining}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="一覧">
          {() => (
            <ListScreen
              dataList={dataList}
              selectedItems={selectedItems}
              toggleSelect={toggleSelect}
              deleteItem={deleteItem}
              deleteSelected={deleteSelected}
              clearAllData={clearAllData}
            />
          )}
        </Tab.Screen>

        <Tab.Screen name="月別">
          {() => <MonthlyScreen dataList={dataList} />}
        </Tab.Screen>

        <Tab.Screen name="カレンダー">
          {() => <CalendarScreen dataList={dataList} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7f5f1",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 72,
  },
  title: {
    color: "#202124",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  sectionTitle: {
    marginTop: 32,
  },
  label: {
    color: "#4e5358",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#d8d3ca",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  recentContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  recentButton: {
    backgroundColor: "#ffffff",
    borderColor: "#d8d3ca",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  recentText: {
    color: "#333333",
    fontSize: 13,
  },
  buttonSpacing: {
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  catButton: {
    backgroundColor: "#ffffff",
    borderColor: "#d8d3ca",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  catButtonActive: {
    backgroundColor: "#2f5d62",
    borderColor: "#2f5d62",
  },
  catText: {
    color: "#333333",
  },
  catTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  quickAmountContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  quickAmountButton: {
    backgroundColor: "#ffffff",
    borderColor: "#d8d3ca",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickAmountText: {
    color: "#333333",
    fontSize: 12,
  },
  datePickerRow: {
    flexDirection: "row",
    marginBottom: 18,
  },
  picker: {
    flex: 1,
  },
  addButton: {
    marginBottom: 24,
    marginTop: 8,
  },
  emptyText: {
    color: "#697077",
    marginBottom: 12,
    marginTop: 8,
    textAlign: "center",
  },
  helperText: {
    color: "#697077",
    marginBottom: 12,
    textAlign: "center",
  },
  darkActionButton: {
    backgroundColor: "#333333",
    borderRadius: 8,
    marginBottom: 10,
    padding: 12,
  },
  mutedActionButton: {
    backgroundColor: "#777777",
    borderRadius: 8,
    marginBottom: 16,
    padding: 12,
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    textAlign: "center",
  },
  listCard: {
    backgroundColor: "#ffffff",
    borderColor: "#d8d3ca",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  listCardSelected: {
    backgroundColor: "#edf4f2",
    borderColor: "#2f5d62",
  },
  selectMark: {
    color: "#697077",
    fontSize: 12,
    marginBottom: 6,
  },
  listText: {
    color: "#4e5358",
    fontSize: 16,
    marginBottom: 4,
  },
  listAmount: {
    color: "#202124",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  deleteLink: {
    marginTop: 8,
  },
  deleteText: {
    color: "#b3261e",
    fontWeight: "600",
    textAlign: "right",
  },
  totalText: {
    color: "#202124",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  warningText: {
    color: "#b26a00",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
    textAlign: "center",
  },
  dangerText: {
    color: "#b3261e",
  },
  monthTitle: {
    color: "#202124",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  monthTotal: {
    color: "#202124",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  
  monthNavigation: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

arrowButton: {
    fontSize: 24,
    color: "#333333",
    paddingHorizontal: 20,
  },

monthText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#202124",
  },
});
