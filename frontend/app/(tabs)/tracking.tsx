import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWeeklyWater } from '../../utils/api';
import { Colors } from '../../constants/Colors';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { useStore } from '../../store/useStore';

const screenWidth = Dimensions.get('window').width;

export default function TrackingScreen() {
  const { t } = useTranslation();
  const { user } = useStore();
  const [weeklyWater, setWeeklyWater] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const water = await getWeeklyWater();
      setWeeklyWater(water);
    } catch (error) {
      console.error('Error loading tracking data:', error);
    }
  };

  const chartData = weeklyWater.map((item, index) => ({
    value: item.amount / 1000, // Convert to liters
    label: new Date(item.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
    frontColor: Colors.teal,
  }));

  const lineChartData = weeklyWater.map((item) => ({
    value: item.amount / 1000,
  }));

  const avgWater = weeklyWater.length > 0
    ? weeklyWater.reduce((sum, item) => sum + item.amount, 0) / weeklyWater.length / 1000
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{t('tracking')}</Text>

        {/* Water Tracking Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Su Takibi</Text>

          <View style={styles.card}>
            <View style={styles.goalContainer}>
              <Ionicons name="water" size={40} color={Colors.teal} />
              <View>
                <Text style={styles.goalLabel}>{t('dailyGoal')}</Text>
                <Text style={styles.goalValue}>2.5 L</Text>
              </View>
            </View>

            {weeklyWater.length > 0 && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Haftalık Su Tüketimi</Text>
                <LineChart
                  data={lineChartData}
                  width={screenWidth - 80}
                  height={200}
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
              </View>
            )}

            <View style={styles.avgContainer}>
              <Text style={styles.avgLabel}>Bu Hafta Ort:</Text>
              <Text style={styles.avgValue}>{avgWater.toFixed(1)} L / Gün</Text>
            </View>
          </View>
        </View>

        {/* Bar Chart Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Haftalık Detay</Text>

          <View style={styles.card}>
            {chartData.length > 0 && (
              <BarChart
                data={chartData}
                width={screenWidth - 80}
                height={250}
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
        </View>

        {/* Steps Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adım Sayısı</Text>

          <View style={styles.card}>
            <View style={styles.goalContainer}>
              <Ionicons name="footsteps" size={40} color={Colors.primary} />
              <View>
                <Text style={styles.goalLabel}>{t('dailyGoal')}</Text>
                <Text style={styles.goalValue}>{user?.step_goal?.toLocaleString() || '10,000'} {t('steps')}</Text>
              </View>
            </View>

            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '74%' }]} />
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="trophy" size={24} color={Colors.warning} />
                <Text style={styles.statLabel}>Bugün</Text>
                <Text style={styles.statValue}>{user?.step_goal ? Math.floor(user.step_goal * 0.74).toLocaleString() : '7,430'}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="trending-up" size={24} color={Colors.success} />
                <Text style={styles.statLabel}>Ortalama</Text>
                <Text style={styles.statValue}>{user?.step_goal ? Math.floor(user.step_goal * 0.82).toLocaleString() : '8,234'}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={24} color={Colors.error} />
                <Text style={styles.statLabel}>Kal. Yakılan</Text>
                <Text style={styles.statValue}>{user?.step_goal ? Math.floor((user.step_goal * 0.74) * 0.04) : '412'}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.darkText,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  goalLabel: {
    fontSize: 14,
    color: Colors.lightText,
  },
  goalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
  chartContainer: {
    marginVertical: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
    marginBottom: 12,
  },
  avgContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  avgLabel: {
    fontSize: 14,
    color: Colors.lightText,
  },
  avgValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.darkText,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginVertical: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.lightText,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.darkText,
  },
});
