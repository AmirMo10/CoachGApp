import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { ReportData } from './types';

const C = {
  primary: '#0F172A',
  accent: '#16A34A',
  muted: '#64748B',
  light: '#F1F5F9',
  border: '#E2E8F0',
};

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: C.primary, fontFamily: 'Helvetica' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: `2px solid ${C.accent}`,
    paddingBottom: 10,
    marginBottom: 16,
  },
  logo: { width: 48, height: 48, objectFit: 'contain' },
  brandName: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: C.primary },
  coachName: { fontSize: 9, color: C.muted },
  cover: { marginTop: 120, alignItems: 'center' },
  coverTitle: { fontSize: 30, fontFamily: 'Helvetica-Bold' },
  coverSub: { fontSize: 14, color: C.muted, marginTop: 8 },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: C.accent,
    marginTop: 18,
    marginBottom: 8,
  },
  para: { lineHeight: 1.5, marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  cell: { flex: 1 },
  kvLabel: { color: C.muted },
  card: { backgroundColor: C.light, padding: 10, borderRadius: 4, marginBottom: 6 },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.primary,
    color: '#fff',
    padding: 4,
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: { flexDirection: 'row', padding: 4, borderBottom: `1px solid ${C.border}` },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: C.muted,
    borderTop: `1px solid ${C.border}`,
    paddingTop: 6,
  },
  disclaimer: { fontSize: 8, color: C.muted, fontStyle: 'italic', marginTop: 8 },
});

const Header: React.FC<{ data: ReportData }> = ({ data }) => (
  <View style={s.header} fixed>
    <View>
      <Text style={s.brandName}>{data.brand.businessName}</Text>
      <Text style={s.coachName}>Coach: {data.brand.coachName}</Text>
    </View>
    {data.brand.logoDataUrl ? <Image src={data.brand.logoDataUrl} style={s.logo} /> : null}
  </View>
);

const Footer: React.FC = () => (
  <Text
    style={s.footer}
    fixed
    render={({ pageNumber, totalPages }) =>
      `Coach"G" — Confidential client report · Page ${pageNumber}/${totalPages}`
    }
  />
);

const KV: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={s.row}>
    <Text style={[s.cell, s.kvLabel]}>{label}</Text>
    <Text style={s.cell}>{value}</Text>
  </View>
);

/** The premium, client-ready report document (Module 12). */
export const ReportDocument: React.FC<{ data: ReportData }> = ({ data }) => (
  <Document title={`Coaching Report — ${data.client.fullName}`}>
    {/* Cover */}
    <Page size="A4" style={s.page}>
      <Header data={data} />
      <View style={s.cover}>
        <Text style={s.coverTitle}>Performance & Coaching Report</Text>
        <Text style={s.coverSub}>{data.client.fullName}</Text>
        {data.client.goal ? <Text style={s.coverSub}>Goal: {data.client.goal}</Text> : null}
        <Text style={[s.coverSub, { fontSize: 10 }]}>Generated {data.generatedAt}</Text>
      </View>
      <Footer />
    </Page>

    {/* Body */}
    <Page size="A4" style={s.page}>
      <Header data={data} />

      <Text style={s.sectionTitle}>1. Client Profile</Text>
      <View style={s.card}>
        <KV label="Name" value={data.client.fullName} />
        {data.client.age ? <KV label="Age" value={String(data.client.age)} /> : null}
        {data.client.sport ? <KV label="Sport" value={data.client.sport} /> : null}
        {data.client.goal ? <KV label="Goal" value={data.client.goal} /> : null}
      </View>

      <Text style={s.sectionTitle}>2. Assessment</Text>
      <View style={s.card}>
        {data.assessmentSummary.map((a, i) => (
          <KV key={i} label={a.label} value={a.value} />
        ))}
      </View>

      <Text style={s.sectionTitle}>3. Goal Analysis</Text>
      <Text style={s.para}>{data.goalAnalysis}</Text>

      {data.performanceAnalysis ? (
        <>
          <Text style={s.sectionTitle}>4. Performance Analysis</Text>
          <Text style={s.para}>{data.performanceAnalysis}</Text>
        </>
      ) : null}
      <Footer />
    </Page>

    {/* Training program */}
    {data.program ? (
      <Page size="A4" style={s.page}>
        <Header data={data} />
        <Text style={s.sectionTitle}>5. Training Program</Text>
        {data.programRationale ? <Text style={s.para}>{data.programRationale}</Text> : null}
        {data.program.weeks.slice(0, 2).map((week) => (
          <View key={week.weekIndex} wrap={false}>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginTop: 8 }}>
              Week {week.weekIndex} — {week.phase}
              {week.isDeload ? ' (Deload)' : ''}
            </Text>
            {week.days.map((day) => (
              <View key={day.dayIndex} style={{ marginTop: 4 }}>
                <Text style={{ color: C.muted }}>
                  Day {day.dayIndex}: {day.focus}
                </Text>
                <View style={s.tableHead}>
                  <Text style={{ flex: 3 }}>Exercise</Text>
                  <Text style={{ flex: 1 }}>Sets</Text>
                  <Text style={{ flex: 1 }}>Reps</Text>
                  <Text style={{ flex: 1 }}>Rest</Text>
                </View>
                {day.exercises.map((ex) => (
                  <View key={ex.order} style={s.tableRow}>
                    <Text style={{ flex: 3 }}>{ex.exerciseName}</Text>
                    <Text style={{ flex: 1 }}>{ex.sets}</Text>
                    <Text style={{ flex: 1 }}>{ex.reps}</Text>
                    <Text style={{ flex: 1 }}>{ex.restSeconds}s</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}
        <Text style={s.disclaimer}>
          Full week-by-week program continues in the athlete portal.
        </Text>
        <Footer />
      </Page>
    ) : null}

    {/* Nutrition, supplements, recovery */}
    <Page size="A4" style={s.page}>
      <Header data={data} />
      {data.nutrition ? (
        <>
          <Text style={s.sectionTitle}>6. Nutrition Plan</Text>
          <View style={s.card}>
            <KV label="Strategy" value={data.nutrition.strategy} />
            <KV label="Daily Calories" value={`${data.nutrition.goalCalories} kcal`} />
            <KV label="Protein" value={`${data.nutrition.macros.proteinG} g`} />
            <KV label="Carbs" value={`${data.nutrition.macros.carbsG} g`} />
            <KV label="Fat" value={`${data.nutrition.macros.fatG} g`} />
          </View>
        </>
      ) : null}

      {data.supplements?.length ? (
        <>
          <Text style={s.sectionTitle}>7. Supplement Plan</Text>
          {data.supplements.map((sup, i) => (
            <Text key={i} style={s.para}>
              • {sup.name} — {sup.dose}, {sup.timing}. {sup.rationale}
            </Text>
          ))}
        </>
      ) : null}

      {data.recovery ? (
        <>
          <Text style={s.sectionTitle}>8. Recovery Plan</Text>
          <View style={s.card}>
            <KV label="Sleep Target" value={`${data.recovery.sleepTargetHours} h`} />
            <KV label="Hydration" value={`${data.recovery.hydrationLiters} L`} />
            <KV label="Recovery Score" value={`${data.recovery.recoveryScore}/100`} />
          </View>
          {data.recovery.recommendations.map((r, i) => (
            <Text key={i} style={s.para}>• {r}</Text>
          ))}
        </>
      ) : null}
      <Footer />
    </Page>

    {/* Progress, bloodwork, notes */}
    <Page size="A4" style={s.page}>
      <Header data={data} />
      {data.progress?.length ? (
        <>
          <Text style={s.sectionTitle}>9. Progress Tracking</Text>
          <View style={s.tableHead}>
            <Text style={{ flex: 2 }}>Metric</Text>
            <Text style={{ flex: 1 }}>Start</Text>
            <Text style={{ flex: 1 }}>Current</Text>
            <Text style={{ flex: 1 }}>Change</Text>
          </View>
          {data.progress.map((p, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={{ flex: 2 }}>{p.metric}</Text>
              <Text style={{ flex: 1 }}>{p.start}</Text>
              <Text style={{ flex: 1 }}>{p.current}</Text>
              <Text style={{ flex: 1 }}>{p.change}</Text>
            </View>
          ))}
        </>
      ) : null}

      {data.bloodwork?.length ? (
        <>
          <Text style={s.sectionTitle}>Bloodwork (Educational)</Text>
          {data.bloodwork.map((b, i) => (
            <Text key={i} style={s.para}>
              • {b.marker}: {b.value} [{b.flag}] — {b.insight}
            </Text>
          ))}
          <Text style={s.disclaimer}>
            Educational information only. Not medical advice, diagnosis, or treatment. Consult a
            qualified healthcare professional.
          </Text>
        </>
      ) : null}

      {data.coachNotes ? (
        <>
          <Text style={s.sectionTitle}>10. Coach Notes</Text>
          <Text style={s.para}>{data.coachNotes}</Text>
        </>
      ) : null}
      <Footer />
    </Page>
  </Document>
);
