import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Path, Line, G, Polygon } from 'react-native-svg';

interface IMCGaugeProps {
  height?: number; // en metros
  weight?: number; // en kg
  gender?: string;
  age?: number;
}

// ── Rangos reales del IMC ──────────────────────────────────────
// El gauge cubre de 10 a 45 (35 puntos de IMC total = 360°)
const IMC_MIN = 10;
const IMC_MAX = 45;
const IMC_SPAN = IMC_MAX - IMC_MIN; // 35

const IMC_RANGES = [
  { label: 'Bajo peso severo', min: 10,   max: 16,   color: '#1e3a8a' }, // azul muy oscuro
  { label: 'Bajo peso grave',  min: 16,   max: 17,   color: '#3b82f6' }, // azul
  { label: 'Bajo peso',        min: 17,   max: 18.5, color: '#60a5fa' }, // azul claro
  { label: 'Normal',           min: 18.5, max: 25,   color: '#10b981' }, // verde
  { label: 'Sobrepeso',        min: 25,   max: 30,   color: '#fbbf24' }, // amarillo
  { label: 'Obesidad Clase I', min: 30,   max: 35,   color: '#f97316' }, // naranja
  { label: 'Obesidad Clase II',min: 35,   max: 45,   color: '#dc2626' }, // rojo
] as const;

const LEGEND_RANGES: { label: string; color: string; range: string }[] = [
  { label: 'Bajo peso severo',  color: '#1e3a8a', range: '< 16' },
  { label: 'Bajo peso grave',   color: '#3b82f6', range: '16.0 - 16.9' },
  { label: 'Bajo peso',         color: '#60a5fa', range: '17.0 - 18.4' },
  { label: 'Normal',            color: '#10b981', range: '18.5 - 24.9' },
  { label: 'Sobrepeso',         color: '#fbbf24', range: '25.0 - 29.9' },
  { label: 'Obesidad Clase I',  color: '#f97316', range: '30.0 - 34.9' },
  { label: 'Obesidad Clase II', color: '#dc2626', range: '35.0 - 39.9' },
];

/** Convierte un valor IMC al ángulo en grados dentro del gauge.
 *  El arco comienza en -180° (izquierda) y termina en 180° (derecha),
 *  pasando por arriba (0° = parte superior = 12 en el clock).
 *  En SVG usamos la convención: -90° es arriba.
 *  Total: 360° para el span completo (10 → 45).
 */
const imcToAngleDeg = (imcValue: number): number => {
  const clamped = Math.min(Math.max(imcValue, IMC_MIN), IMC_MAX);
  // Mapeo lineal: 10 → -90°  (arriba)  45 → 270° (arriba, vuelta completa)
  return ((clamped - IMC_MIN) / IMC_SPAN) * 360 - 90;
};

/** Dado un IMC retorna el color de su categoría */
const getIMCColor = (imcValue: number): string => {
  for (const r of IMC_RANGES) {
    if (imcValue < r.max || r === IMC_RANGES[IMC_RANGES.length - 1]) {
      if (imcValue >= r.min) return r.color;
    }
  }
  return '#9ca3af';
};

/** Dado un IMC retorna la etiqueta de su categoría */
const getIMCLabel = (imcValue: number): string => {
  for (const r of IMC_RANGES) {
    if (imcValue >= r.min && imcValue < r.max) return r.label;
  }
  if (imcValue >= 35) return IMC_RANGES[IMC_RANGES.length - 1].label;
  return '–';
};

export const IMCGauge: React.FC<IMCGaugeProps> = ({
  height = 1.75,
  weight = 75,
  gender = 'Male',
  age = 0,
}) => {
  const size = 320;
  const outerRadius = 95;
  const innerRadius = 68;
  const cx = size / 2;
  const cy = size / 2;

  // ── Calcular IMC ─────────────────────────────────────────────
  const imc = useMemo(() => {
    if (!height || !weight || height <= 0) return 0;
    return weight / (height * height);
  }, [height, weight]);

  const imcColor = useMemo(() => getIMCColor(imc), [imc]);
  const imcLabel = useMemo(() => getIMCLabel(imc), [imc]);

  // ── Helper: arco de donut ────────────────────────────────────
  const createArcPath = (startDeg: number, endDeg: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const s = toRad(startDeg);
    const e = toRad(endDeg);

    const x1 = cx + outerRadius * Math.cos(s);
    const y1 = cy + outerRadius * Math.sin(s);
    const x2 = cx + outerRadius * Math.cos(e);
    const y2 = cy + outerRadius * Math.sin(e);
    const x3 = cx + innerRadius * Math.cos(e);
    const y3 = cy + innerRadius * Math.sin(e);
    const x4 = cx + innerRadius * Math.cos(s);
    const y4 = cy + innerRadius * Math.sin(s);

    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  // ── Construir arcos proporcionales a los rangos reales ───────
  const arcPaths = useMemo(() => {
    return IMC_RANGES.map((range) => {
      const startDeg = imcToAngleDeg(range.min);
      const endDeg   = imcToAngleDeg(range.max);
      return {
        path:  createArcPath(startDeg, endDeg),
        color: range.color,
      };
    });
  }, []);

  // ── Aguja ────────────────────────────────────────────────────
  const needleAngleDeg = useMemo(() => imcToAngleDeg(imc), [imc]);
  const needleRad = (needleAngleDeg * Math.PI) / 180;

  // Longitud hasta el borde externo del donut
  const needleLength = outerRadius - 4;
  const needleTipX = cx + needleLength * Math.cos(needleRad);
  const needleTipY = cy + needleLength * Math.sin(needleRad);

  // Base de la aguja (hacia adentro del donut)
  const baseLength = 20;
  const needleBaseX = cx - baseLength * Math.cos(needleRad);
  const needleBaseY = cy - baseLength * Math.sin(needleRad);

  return (
    <View style={styles.container}>
      {/* Título */}
      <Text style={styles.imcTitleTop}>IMC</Text>

      {/* Gauge */}
      <View style={styles.gaugeWrapper}>
        <Svg
          width="100%"
          height={320}
          viewBox={`0 0 ${size} ${size}`}
          style={styles.svgGauge}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Arcos proporcionales a rangos reales */}
          {arcPaths.map((arc, idx) => (
            <Path
              key={`arc-${idx}`}
              d={arc.path}
              fill={arc.color}
              stroke="white"
              strokeWidth="2.5"
            />
          ))}

          {/* Pivote central (detrás de la aguja) */}
          <Circle cx={cx} cy={cy} r={24} fill="white" stroke="#e5e7eb" strokeWidth={2} />
          <Circle cx={cx} cy={cy} r={18} fill="white" stroke="#d1d5db" strokeWidth={1} />

          {/* Aguja — usa el color del IMC */}
          <Line
            x1={needleBaseX}
            y1={needleBaseY}
            x2={needleTipX}
            y2={needleTipY}
            stroke={imcColor}
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Punto del IMC sobre la aguja */}
          <Circle
            cx={needleTipX}
            cy={needleTipY}
            r={7}
            fill={imcColor}
            stroke="white"
            strokeWidth={2}
          />

          {/* Pivote central visible (encima de todo) */}
          <Circle cx={cx} cy={cy} r={9} fill={imcColor} stroke="white" strokeWidth={2} />
        </Svg>

        {/* Valor IMC */}
        <View style={styles.imcValueContainer}>
          <Text style={[styles.imcNumber, { color: imcColor }]}>
            {imc.toFixed(1)}
          </Text>
          <Text style={[styles.imcCategory, { color: imcColor }]}>
            {imcLabel}
          </Text>
        </View>
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>{height?.toFixed(2)}m</Text>
        <Text style={styles.infoText}>{weight} kg</Text>
        <Text style={styles.infoText}>{gender === 'Male' ? 'Hombre' : 'Mujer'}</Text>
        {age > 0 && <Text style={styles.infoText}>{age} años</Text>}
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        {LEGEND_RANGES.map((item, idx) => {
          const isActive = item.label === imcLabel;
          return (
            <View
              key={idx}
              style={[styles.legendRow, isActive && { backgroundColor: `${item.color}18` }]}
            >
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, isActive && { fontWeight: '700', color: item.color }]}>
                {item.label}
              </Text>
              <Text style={[styles.legendRange, isActive && { color: item.color, fontWeight: '600' }]}>
                {item.range}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    gap: 0,
  },
  imcTitleTop: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    letterSpacing: 2.5,
    textAlign: 'center',
    marginBottom: -50,
    zIndex: 1,
  },
  gaugeWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 320,
  },
  svgGauge: {
    width: '100%',
    height: 320,
    backgroundColor: 'transparent',
  },
  imcValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -50,
    zIndex: 1,
    gap: 2,
  },
  imcNumber: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
  },
  imcCategory: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    opacity: 0.85,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    marginVertical: 16,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    flex: 1,
  },
  legend: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  legendRange: {
    fontSize: 11,
    color: '#9ca3af',
    marginLeft: 8,
    minWidth: 70,
    textAlign: 'right',
  },
});
