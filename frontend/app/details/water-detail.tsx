import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWeeklyWater, getTodayWater, addWater } from '../../utils/api';
import { Colors } from '../../constants/Colors';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';
import * as Notifications from 'expo-notifications';

const screenWidth = Dimensions.get('window').width;

export default function WaterDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, triggerRefresh } = useStore();
  const [weeklyWater, setWeeklyWater] = useState<any[]>([]);
  const [todayWater, setTodayWater] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    loadData();
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  const handleEnableNotifications = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      setNotificationsEnabled(true);
      // Schedule water reminder every 2 hours
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Su İçme Zamanı! 💧',
          body: 'Günlük hedefinize ulaşmak için su içmeyi unutmayın!',
        },
        trigger: {
          seconds: 7200, // 2 hours
          repeats: true,
        },
      });
      alert('Su bildirimleri aktif edildi!');
    } else {
      alert('Bildirim izni reddedildi. Ayarlardan açabilirsiniz.');
    }
  };

  const loadData = async () => {
    try {
      const [water, today] = await Promise.all([
        getWeeklyWater(),
        getTodayWater(),
      ]);
      setWeeklyWater(water);
      setTodayWater(today.total_amount || 0);
    } catch (error) {
      console.error('Error loading water data:', error);
    }
  };

  const handleAddWater = async (amount: number) => {
    try {
      setLoading(true);
      await addWater(amount);
      await loadData();
      triggerRefresh();
    } catch (error) {
      console.error('Error adding water:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = weeklyWater.map((item) => ({
    value: item.amount / 1000,
    label: new Date(item.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
    frontColor: Colors.teal,
  }));

  const lineChartData = weeklyWater.map((item) => ({
    value: item.amount / 1000,
  }));

  const avgWater =
    weeklyWater.length > 0
      ? weeklyWater.reduce((sum, item) => sum + item.amount, 0) / weeklyWater.length / 1000
      : 0;

  const goal = user?.water_goal || 2500;
  const glassCount = Math.floor(todayWater / 250);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={Colors.darkText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Su Takibi</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color={Colors.darkText} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Goal Section */}
        <View style={styles.goalSection}>
          <Text style={styles.goalTitle}>Günlük Hedef: {(goal / 1000).toFixed(1)}L</Text>
          <View style={styles.circularProgress}>
            <View style={styles.circularInner}>
              <Text style={styles.circularText}>Hedef:</Text>
              <Text style={styles.circularValue}>{(goal / 1000).toFixed(0)}.000 ADIM</Text>
              <Text style={styles.circularSubtext}>Günlük Hedef</Text>
            </View>
          </View>
        </View>

        {/* Glass Icons */}
        <View style={styles.glassSection}>
          <View style={styles.glassGrid}>
            {[0, 1, 2, 3].map((index) => (
              <TouchableOpacity
                key={index}
                style={styles.glassItem}
                onPress={() => handleAddWater(250)}
                disabled={loading}
              >
                <Ionicons
                  name="water"
                  size={60}
                  color={index < glassCount ? Colors.teal : '#E0E0E0'}
                />
                <Text style={styles.glassLabel}>+250ml</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Weekly Average */}
        <View style={styles.avgSection}>
          <Text style={styles.avgLabel}>Bu Hafta Ort: {avgWater.toFixed(1)}L / Gün</Text>
        </View>

        {/* Line Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Günlük Hedef: 3L</Text>
          {lineChartData.length > 0 && (
            <LineChart
              data={lineChartData}
              width={screenWidth - 64}
              height={180}
              color={Colors.teal}
              thickness={3}
              startFillColor={Colors.teal}
              startOpacity={0.3}
              endFillColor={Colors.teal}
              endOpacity={0.01}
              areaChart
              curved
              hideRules
              yAxisColor="#E0E0E0"
              xAxisColor="#E0E0E0"
              hideDataPoints={false}
              dataPointsColor={Colors.teal}
              dataPointsRadius={4}
            />
          )}
        </View>

        {/* Bar Chart */}
        <View style={styles.chartCard}>
          {chartData.length > 0 && (
            <BarChart
              data={chartData}
              width={screenWidth - 64}
              height={200}
              barWidth={35}
              spacing={15}
              roundedTop
              roundedBottom
              hideRules
              xAxisColor="#E0E0E0"
              yAxisColor="#E0E0E0"
              yAxisTextStyle={{ color: Colors.lightText }}
              xAxisLabelTextStyle={{ color: Colors.lightText, fontSize: 12 }}
              noOfSections={5}
              maxValue={3}
            />
          )}
        </View>

        {/* Add Button */}
        <TouchableOpacity style={styles.addMoreButton}>
          <Text style={styles.addMoreText}>ÖĞÜNE EKLE</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  menuButton: {
    padding: 8,
  },
  content: {
    padding: 16,
  },
  goalSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 20,
  },
  circularProgress: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 12,
    borderColor: Colors.teal,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  circularInner: {
    alignItems: 'center',
  },
  circularText: {
    fontSize: 14,
    color: Colors.lightText,
  },
  circularValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginVertical: 4,
  },
  circularSubtext: {
    fontSize: 12,
    color: Colors.lightText,
  },
  glassSection: {
    marginBottom: 24,
  },
  glassGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  glassItem: {
    alignItems: 'center',
    gap: 8,
  },
  glassLabel: {
    fontSize: 12,
    color: Colors.darkText,
    fontWeight: '600',
  },
  avgSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avgLabel: {
    fontSize: 16,
    color: Colors.darkText,
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 16,
  },
  notificationButton: {
    backgroundColor: Colors.teal,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  notificationButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
