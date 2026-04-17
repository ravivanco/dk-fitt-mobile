import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Path, Line, G } from 'react-native-svg';

interface IMCGaugeProps {
  height?: number; // en metros
  weight?: number; // en kg
  gender?: string; // 'Male', 'Female', etc.
  age?: number;
}

export const IMCGauge: React.FC<IMCGaugeProps> = ({ 
  height = 1.75, 
  weight = 75,
  gender = 'Male',
  age = 31
}) => {
  const size = 320;
  const outerRadius = 95;
  const innerRadius = 70;
  const cx = size / 2;
  const cy = size / 2;

  // Calcular IMC
  const imc = useMemo(() => {
    if (!height || !weight || height <= 0) return 0;
    return weight / (height * height);
  }, [height, weight]);

  // Convertir altura a cm y peso a kg para mostrar
  const heightCm = Math.round(height * 100);
  const heightFt = Math.floor(height * 3.28084);
  const heightIn = Math.round((height * 3.28084 - heightFt) * 12);
  const weightLbs = Math.round(weight * 2.20462);

  // Crear path para anillo (donut) con mejor definición
  const createArcPath = (startAngle: number, endAngle: number, outer: number, inner: number) => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;

    const x1 = cx + outer * Math.cos(start);
    const y1 = cy + outer * Math.sin(start);
    const x2 = cx + outer * Math.cos(end);
    const y2 = cy + outer * Math.sin(end);
    const x3 = cx + inner * Math.cos(end);
    const y3 = cy + inner * Math.sin(end);
    const x4 = cx + inner * Math.cos(start);
    const y4 = cy + inner * Math.sin(start);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${outer} ${outer} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  // Calcular ángulo de la aguja basado en IMC (comienza en -90 para que 0 sea arriba)
  const minIMC = 10;
  const maxIMC = 45;
  const normalizedIMC = Math.min(Math.max(imc, minIMC), maxIMC);
  const needleAngle = ((normalizedIMC - minIMC) / (maxIMC - minIMC)) * 360 - 90;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleLength = 82;
  const needleX = cx + needleLength * Math.cos(needleRad);
  const needleY = cy + needleLength * Math.sin(needleRad);

  // Distribuir 6 colores en los 360 grados (comenzando desde arriba a -90)
  const arcPaths = [
    { path: createArcPath(-90, -30, outerRadius, innerRadius), color: '#1e3a8a' },     // Azul oscuro
    { path: createArcPath(-30, 30, outerRadius, innerRadius), color: '#3b82f6' },      // Azul claro
    { path: createArcPath(30, 90, outerRadius, innerRadius), color: '#10b981' },       // Verde
    { path: createArcPath(90, 150, outerRadius, innerRadius), color: '#fbbf24' },      // Amarillo
    { path: createArcPath(150, 210, outerRadius, innerRadius), color: '#f97316' },     // Naranja
    { path: createArcPath(210, 270, outerRadius, innerRadius), color: '#dc2626' },     // Rojo
  ];

  const legendItems = [
    { label: 'Bajo peso severo', color: '#1e3a8a', range: '< 16' },
    { label: 'Bajo peso grave', color: '#3b82f6', range: '16.0 - 16.9' },
    { label: 'Bajo peso', color: '#60a5fa', range: '17.0 - 18.4' },
    { label: 'Normal', color: '#10b981', range: '18.5 - 24.9' },
    { label: 'Sobrepeso', color: '#fbbf24', range: '25.0 - 29.9' },
    { label: 'Obesidad Clase I', color: '#f97316', range: '30.0 - 34.9' },
    { label: 'Obesidad Clase II', color: '#dc2626', range: '35.0 - 39.9' },
  ];

  return (
    <View style={styles.container}>
      {/* IMC Title */}
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
          {/* Fondo suave de toda la rueda */}
          <Circle
            cx={cx}
            cy={cy}
            r={outerRadius}
            fill="#f8fafc"
            opacity="0.5"
          />

          {/* Arcos de colores con separación */}
          {arcPaths.map((arc, idx) => (
            <Path
              key={`arc-${idx}`}
              d={arc.path}
              fill={arc.color}
              stroke="white"
              strokeWidth="2"
            />
          ))}

          {/* Aguja con punta */}
          <Line
            x1={cx}
            y1={cy}
            x2={needleX}
            y2={needleY}
            stroke="#1f2937"
            strokeWidth="5"
            strokeLinecap="round"
          />
          
          {/* Punta de la aguja - círculo pequeño */}
          <Circle
            cx={needleX}
            cy={needleY}
            r="5"
            fill="#1f2937"
            stroke="white"
            strokeWidth="1"
          />

          {/* Centro con gradiente visual */}
          <Circle cx={cx} cy={cy} r="22" fill="white" stroke="#e5e7eb" strokeWidth="2" />
          <Circle cx={cx} cy={cy} r="18" fill="white" stroke="#d1d5db" strokeWidth="1" />
        </Svg>

        {/* IMC Value below Gauge */}
        <View style={styles.imcValueContainer}>
          <Text style={styles.imcNumber}>{imc.toFixed(1)}</Text>
        </View>
      </View>

      {/* Info Row */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>{height?.toFixed(2)}m</Text>
        <Text style={styles.infoText}>{weight} kg</Text>
        <Text style={styles.infoText}>{gender === 'Male' ? 'Hombre' : 'Mujer'}</Text>
        <Text style={styles.infoText}>{age} años</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {legendItems.map((item, idx) => (
          <View key={idx} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}</Text>
            <Text style={styles.legendRange}>{item.range}</Text>
          </View>
        ))}
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
    marginVertical: 0,
  },
  svgGauge: {
    width: '100%',
    height: 320,
    backgroundColor: 'transparent',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
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
    minWidth: 50,
    textAlign: 'right',
  },
  imcValueContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -50,
    zIndex: 1,
  },
  imcNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
  },
});
