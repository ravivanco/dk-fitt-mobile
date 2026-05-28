import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, Path, Stop, LinearGradient, Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FormBackgroundDecor } from '@/components/forms/components/form-background-decor';
import { BackButton } from '@/components/navigation/back-button';
import { BottomNav } from '@/components/navigation/bottom-nav';
import { CalorieDashboard, WeightEntry, getLatestWeight, loadCalorieDashboard, loadWeightHistory } from '@/services/calorie.service';

function formatShortDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  });
}

function formatWeight(value: number) {
  return `${value.toFixed(1)} kg`;
}

function buildLinePath(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
}

function buildAreaPath(points: Array<{ x: number; y: number }>, bottomY: number) {
  if (points.length === 0) return '';
  const line = buildLinePath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  return `${line} L ${lastPoint.x} ${bottomY} L ${firstPoint.x} ${bottomY} Z`;
}

function niceNumber(range: number, shouldRound: boolean) {
  const exponent = Math.floor(Math.log10(range));
  const fraction = range / Math.pow(10, exponent);
  let niceFraction = 1;

  if (shouldRound) {
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3) niceFraction = 2;
    else if (fraction < 7) niceFraction = 5;
    else niceFraction = 10;
  } else {
    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
  }

  return niceFraction * Math.pow(10, exponent);
}

function WeightChart({ data }: { data: WeightEntry[] }) {
  const chartData = useMemo(() => data.slice(-14), [data]);

  const chart = useMemo(() => {
    if (chartData.length === 0) {
      return null;
    }

    const width = 320;
    const height = 220;
    const padding = { top: 18, right: 20, bottom: 34, left: 36 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const values = chartData.map((entry) => entry.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const averageValue = values.reduce((sum, value) => sum + value, 0) / values.length;

    const tickCount = 4;
    const rawRange = Math.max(1, maxValue - minValue);
    const niceRange = niceNumber(rawRange, false);
    const step = niceNumber(niceRange / tickCount, true);
    const scaleMin = Math.floor(minValue / step) * step;
    const scaleMax = Math.ceil(maxValue / step) * step;
    const scaleRange = Math.max(1, scaleMax - scaleMin);

    const points = chartData.map((entry, index) => {
      const x =
        chartData.length === 1
          ? padding.left + plotWidth / 2
          : padding.left + (index / (chartData.length - 1)) * plotWidth;
      const normalized = (entry.value - scaleMin) / scaleRange;
      const y = padding.top + plotHeight - normalized * plotHeight;
      return { x, y };
    });

    const averageY = padding.top + plotHeight - ((averageValue - scaleMin) / scaleRange) * plotHeight;
    const areaPath = buildAreaPath(points, padding.top + plotHeight);

    return {
      width,
      height,
      padding,
      plotWidth,
      plotHeight,
      minValue,
      maxValue,
      averageValue,
      averageY,
      tickCount,
      tickStep: step,
      scaleMin,
      scaleMax,
      points,
      areaPath,
      linePath: buildLinePath(points),
      latestPoint: points[points.length - 1],
      latestEntry: chartData[chartData.length - 1],
      minPoint: points[values.indexOf(minValue)],
      maxPoint: points[values.indexOf(maxValue)],
    };
  }, [chartData]);

  if (!chart) {
    return (
      <View style={styles.chartEmptyState}>
        <MaterialCommunityIcons name="scale-bathroom" size={36} color="#f5a623" />
        <Text style={styles.chartEmptyTitle}>Aun no hay registros</Text>
        <Text style={styles.chartEmptyText}>
          Registra tu peso cada dia para ver la evolucion de la grafica aqui.
        </Text>
      </View>
    );
  }

  const {
    width,
    height,
    padding,
    plotHeight,
    points,
    areaPath,
    linePath,
    latestPoint,
    latestEntry,
    averageY,
    minPoint,
    maxPoint,
    minValue,
    maxValue,
    averageValue,
    tickCount,
    tickStep,
    scaleMin,
    scaleMax,
  } = chart;

  const labels = Array.from({ length: tickCount + 1 }, (_, index) => {
    const value = scaleMax - index * tickStep;
    const normalized = (value - scaleMin) / Math.max(1, scaleMax - scaleMin);
    const y = padding.top + plotHeight - normalized * plotHeight;
    return { value, y };
  });

  const bubbleTargets: Array<{ point: { x: number; y: number }; value: number; key: string }> = [];

  if (maxPoint) {
    bubbleTargets.push({ point: maxPoint, value: maxValue, key: 'max' });
  }

  if (latestPoint) {
    const isSameAsMax =
      maxPoint && Math.abs(maxPoint.x - latestPoint.x) < 0.5 && Math.abs(maxPoint.y - latestPoint.y) < 0.5;
    if (!isSameAsMax) {
      bubbleTargets.push({ point: latestPoint, value: latestEntry.value, key: 'latest' });
    }
  }

  return (
    <View style={styles.chartWrap}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#4f6ef7" stopOpacity="0.24" />
            <Stop offset="100%" stopColor="#4f6ef7" stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        {labels.map((label) => (
          <React.Fragment key={`grid-${label.y}`}>
            <Line
              x1={padding.left}
              y1={label.y}
              x2={width - padding.right}
              y2={label.y}
              stroke={label.y === padding.top + plotHeight ? '#1a1f2a' : '#e9edf5'}
              strokeWidth={label.y === padding.top + plotHeight ? 1.3 : 1}
            />
            <SvgText
              x={padding.left - 8}
              y={label.y + 4}
              fontSize={10}
              fill="#8e8579"
              fontWeight="700"
              textAnchor="end"
            >
              {label.value.toFixed(1)}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Vertical reference line (highlight peak) */}
        {maxPoint ? (
          <Line
            x1={maxPoint.x}
            y1={padding.top}
            x2={maxPoint.x}
            y2={padding.top + plotHeight}
            stroke="#cfd6e6"
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        ) : null}

        <Line
          x1={padding.left}
          y1={averageY}
          x2={width - padding.right}
          y2={averageY}
          stroke="#4f6ef7"
          strokeDasharray="4 4"
          strokeWidth={1.2}
          opacity={0.7}
        />
        {/* Arrow + label on average line */}
        <Path
          d={`M ${width - padding.right - 6} ${averageY - 6} L ${width - padding.right + 8} ${averageY} L ${width - padding.right - 6} ${averageY + 6} Z`}
          fill="#4f6ef7"
          opacity={0.75}
        />
        <SvgText
          x={width - padding.right + 14}
          y={averageY + 4}
          fontSize={10}
          fill="#0f1115"
          fontWeight="800"
          textAnchor="start"
        >
          {averageValue.toFixed(2)}
        </SvgText>

        <Path d={areaPath} fill="url(#weightArea)" />
        <Path d={linePath} fill="none" stroke="#4f6ef7" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />

        {points.map((point, index) => (
          <React.Fragment key={`point-${index}`}>
            <Circle cx={point.x} cy={point.y} r={3.8} fill="#ffffff" stroke="#4f6ef7" strokeWidth={2} />
          </React.Fragment>
        ))}

        {/* Bubble labels (peak + latest) */}
        {bubbleTargets.map((target) => {
          const bubbleY = Math.max(padding.top + 12, target.point.y - 34);
          return (
            <React.Fragment key={`bubble-${target.key}`}>
              <Line
                x1={target.point.x}
                y1={target.point.y - 4}
                x2={target.point.x}
                y2={bubbleY}
                stroke="#4f6ef7"
                strokeDasharray="2 3"
                strokeWidth={1}
                opacity={0.55}
              />
              <Circle cx={target.point.x} cy={bubbleY - 12} r={14} fill="#4f6ef7" opacity={0.96} />
              <SvgText
                x={target.point.x}
                y={bubbleY - 12 + 4}
                fontSize={10}
                fill="#ffffff"
                fontWeight="900"
                textAnchor="middle"
              >
                {Math.round(target.value)}
              </SvgText>
              <Circle cx={target.point.x} cy={target.point.y} r={5.6} fill="#ffffff" stroke="#4f6ef7" strokeWidth={2.4} />
            </React.Fragment>
          );
        })}
      </Svg>

      {/* Fechas: solo inicio / fin para evitar ruido visual */}
      <View style={styles.chartAxisRow}>
        <Text style={[styles.axisLabel, { textAlign: 'left' }]} numberOfLines={1}>
          {formatShortDate(chartData[0].date)}
        </Text>
        <Text style={[styles.axisLabel, { textAlign: 'right' }]} numberOfLines={1}>
          {formatShortDate(chartData[chartData.length - 1].date)}
        </Text>
      </View>

      <View style={styles.chartAnnotations}>
        <View style={styles.annotationChip}>
          <Text style={styles.annotationLabel}>Actual</Text>
          <Text style={styles.annotationValue}>{formatWeight(latestEntry.value)}</Text>
        </View>
        <View style={styles.annotationChip}>
          <Text style={styles.annotationLabel}>Promedio</Text>
          <Text style={styles.annotationValue}>{formatWeight(averageValue)}</Text>
        </View>
        <View style={styles.annotationChip}>
          <Text style={styles.annotationLabel}>Min / Max</Text>
          <Text style={styles.annotationValue}>{formatWeight(minValue)} / {formatWeight(maxValue)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function ProgresoScreen() {
  const [dashboard, setDashboard] = useState<CalorieDashboard | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [nextDashboard, nextHistory] = await Promise.all([
        loadCalorieDashboard(),
        loadWeightHistory(30),
      ]);

      const history = nextHistory.length > 0 ? nextHistory : nextDashboard.weightEntries;
      setDashboard(nextDashboard);
      setWeightHistory(history);
    } catch {
      setError('No pudimos cargar tu historial de peso. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  useFocusEffect(
    React.useCallback(() => {
      void loadProgress();
    }, [loadProgress]),
  );

  const latestWeight = useMemo(() => {
    if (weightHistory.length > 0) {
      return weightHistory[weightHistory.length - 1];
    }
    return dashboard ? getLatestWeight(dashboard) : null;
  }, [dashboard, weightHistory]);

  const initialWeight = weightHistory[0] ?? null;
  const changeSinceStart = latestWeight && initialWeight ? Number((latestWeight.value - initialWeight.value).toFixed(1)) : null;
  const changeLabel =
    changeSinceStart === null
      ? '—'
      : changeSinceStart === 0
        ? '0.0 kg'
        : changeSinceStart > 0
          ? `+${changeSinceStart} kg`
          : `${changeSinceStart} kg`;
  const changeMeta =
    changeSinceStart === null
      ? 'Sin cambios aún'
      : changeSinceStart === 0
        ? 'Sin cambio desde el inicio'
        : 'Desde el inicio';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.wrapper}>
        <FormBackgroundDecor />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <BackButton />
            <Text style={styles.title}>Progreso</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroIconWrap}>
              <Text style={styles.heroEmoji}>📊</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.heroPillRow}>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>📈 Evolución de peso</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>Tu progreso, claro y diario.</Text>
              <Text style={styles.heroText}>
                Sigue la tendencia de tu peso a lo largo del tiempo con los datos guardados en la base de datos.
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statTopRow}>
                <View style={[styles.statIcon, { backgroundColor: '#eff4ff', borderColor: '#d8e2ff' }]}>
                  <MaterialCommunityIcons name="scale-bathroom" size={16} color="#4f6ef7" />
                </View>
                <Text style={styles.statLabel}>Último peso</Text>
              </View>
              <Text style={styles.statValue}>{latestWeight ? formatWeight(latestWeight.value) : '—'}</Text>
              <Text style={styles.statMeta}>{latestWeight ? formatShortDate(latestWeight.date) : 'Sin registros aún'}</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statTopRow}>
                <View style={[styles.statIcon, { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' }]}>
                  <MaterialCommunityIcons name="clipboard-check-outline" size={16} color="#16a34a" />
                </View>
                <Text style={styles.statLabel}>Registros</Text>
              </View>
              <Text style={styles.statValue}>{weightHistory.length}</Text>
              <Text style={styles.statMeta}>Entradas guardadas</Text>
            </View>

            <View style={[styles.statCard, styles.statCardWide]}>
              <View style={styles.statTopRow}>
                <View style={[styles.statIcon, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
                  <MaterialCommunityIcons
                    name={changeSinceStart !== null && changeSinceStart < 0 ? 'trending-down' : 'trending-up'}
                    size={16}
                    color="#f97316"
                  />
                </View>
                <Text style={styles.statLabel}>Cambio</Text>
              </View>
              <Text style={styles.statValue}>{changeLabel}</Text>
              <Text style={styles.statMeta}>{changeMeta}</Text>
            </View>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Grafica de peso</Text>
                <Text style={styles.sectionNote}>Los puntos representan los registros diarios del paciente.</Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color="#4f6ef7" />
                <Text style={styles.loadingText}>Cargando historial...</Text>
              </View>
            ) : error ? (
              <View style={styles.chartEmptyState}>
                <MaterialCommunityIcons name="alert-circle-outline" size={36} color="#ef4444" />
                <Text style={styles.chartEmptyTitle}>No pudimos cargar el progreso</Text>
                <Text style={styles.chartEmptyText}>{error}</Text>
              </View>
            ) : (
              <WeightChart data={weightHistory} />
            )}
          </View>

          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Resumen rápido</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🏁 Primer registro</Text>
              <Text style={styles.detailValue}>{initialWeight ? formatWeight(initialWeight.value) : '--'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🎯 Último registro</Text>
              <Text style={styles.detailValue}>{latestWeight ? formatWeight(latestWeight.value) : '--'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>📌 Tendencia</Text>
              <Text style={styles.detailValue}>{changeSinceStart === null ? '--' : `${changeLabel} desde el inicio`}</Text>
            </View>
          </View>
        </ScrollView>

        <BottomNav />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f6f1',
  },
  wrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f8f6f1',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 112,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f1115',
    flex: 1,
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#efebe4',
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  heroIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#eff4ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#d8e2ff',
  },
  heroEmoji: {
    fontSize: 26,
  },
  heroPillRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#eff4ff',
    borderWidth: 1,
    borderColor: '#d8e2ff',
  },
  heroPillText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1f3bbd',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f1115',
    lineHeight: 24,
    marginBottom: 6,
  },
  heroText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#8e8579',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#efebe4',
    padding: 14,
  },
  statCardWide: {
    width: '100%',
  },
  statTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statEmoji: {
    fontSize: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#8e8579',
    fontWeight: '700',
  },
  statValue: {
    fontSize: 16,
    color: '#101318',
    fontWeight: '800',
  },
  statMeta: {
    marginTop: 6,
    fontSize: 12,
    color: '#8e8579',
    fontWeight: '700',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#efebe4',
    padding: 18,
    shadowColor: '#120f08',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f1115',
    marginBottom: 4,
  },
  sectionNote: {
    fontSize: 13,
    color: '#8e8579',
    lineHeight: 20,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#eff4ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d8e2ff',
  },
  chartWrap: {
    gap: 14,
  },
  chartAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  axisLabel: {
    fontSize: 11,
    color: '#8e8579',
    fontWeight: '700',
  },
  chartAnnotations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  annotationChip: {
    flexGrow: 1,
    minWidth: '30%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e6ebf5',
  },
  annotationLabel: {
    fontSize: 11,
    color: '#8e8579',
    fontWeight: '700',
    marginBottom: 4,
  },
  annotationValue: {
    fontSize: 13,
    color: '#0f1115',
    fontWeight: '800',
  },
  loadingWrap: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#8e8579',
    fontWeight: '600',
  },
  chartEmptyState: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  chartEmptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f1115',
    textAlign: 'center',
  },
  chartEmptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#8e8579',
    textAlign: 'center',
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#efebe4',
    padding: 18,
    gap: 12,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f1115',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: '#8e8579',
    fontWeight: '700',
  },
  detailValue: {
    fontSize: 13,
    color: '#0f1115',
    fontWeight: '800',
  },
});
