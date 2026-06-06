import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { generateBuilderSchema, uploadArtifact } from "./aiSchema";
import { pdfToBlob, palette, hasArabic } from "./pdfBase";
import type { BuilderResult, ResumeSchema } from "./types";

const makeStyles = (font: string, rtl: boolean) => StyleSheet.create({
  page: { fontFamily: font, fontSize: 10.5, color: palette.body, lineHeight: 1.6, direction: rtl ? "rtl" : "ltr", textAlign: rtl ? "right" : "left" },
  header: { backgroundColor: palette.ink, color: "#fff", padding: "32 48", marginBottom: 0 },
  name: { fontSize: 26, fontWeight: 700, color: "#fff" },
  headline: { fontSize: 12, color: "#cbd5e1", marginTop: 6 },
  contact: { fontSize: 9, color: "#94a3b8", marginTop: 8 },
  body: { padding: "24 48" },
  section: { fontSize: 12, fontWeight: 700, color: palette.ink, textTransform: "uppercase", letterSpacing: 1.5, marginTop: 14, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: palette.line, paddingBottom: 4 },
  expRow: { marginBottom: 10 },
  expRole: { fontSize: 11, fontWeight: 700, color: palette.ink },
  expCompany: { fontSize: 10, color: palette.muted, marginBottom: 2 },
  bullet: { fontSize: 10, color: palette.body, marginLeft: 10, marginTop: 2 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  pill: { fontSize: 9, color: palette.ink, backgroundColor: palette.bgSoft, padding: "3 8", borderRadius: 8, marginRight: 5, marginBottom: 4 },
});

export async function buildResume(topic: string, brief?: unknown): Promise<BuilderResult> {
  const schema = await generateBuilderSchema<ResumeSchema>("resume", topic, { brief });
  if (!schema) return { title: topic, summary: "Resume generation failed. Please try again." };

  const contact = [schema.contact?.email, schema.contact?.phone, schema.contact?.location, schema.contact?.website].filter(Boolean).join("  ·  ");

  const sample = [schema.name, schema.headline, schema.summary, ...(schema.experience || []).map(e => `${e.role} ${e.company} ${(e.bullets||[]).join(" ")}`), ...(schema.skills || [])].filter(Boolean).join(" ");
  const rtl = hasArabic(sample);
  const styles = makeStyles(rtl ? "NotoArabic" : "Helvetica", rtl);

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{schema.name || "Your Name"}</Text>
          {schema.headline ? <Text style={styles.headline}>{schema.headline}</Text> : null}
          {contact ? <Text style={styles.contact}>{contact}</Text> : null}
        </View>
        <View style={styles.body}>
          {schema.summary ? (<><Text style={styles.section}>Summary</Text><Text>{schema.summary}</Text></>) : null}
          {schema.experience?.length ? (
            <>
              <Text style={styles.section}>Experience</Text>
              {schema.experience.map((e, i) => (
                <View key={i} style={styles.expRow} wrap={false}>
                  <Text style={styles.expRole}>{e.role} — {e.company}</Text>
                  {e.period ? <Text style={styles.expCompany}>{e.period}</Text> : null}
                  {(e.bullets || []).map((b, j) => <Text key={j} style={styles.bullet}>•  {b}</Text>)}
                </View>
              ))}
            </>
          ) : null}
          {schema.education?.length ? (
            <>
              <Text style={styles.section}>Education</Text>
              {schema.education.map((ed, i) => (
                <View key={i} style={styles.expRow}>
                  <Text style={styles.expRole}>{ed.degree} — {ed.school}</Text>
                  {ed.period ? <Text style={styles.expCompany}>{ed.period}</Text> : null}
                </View>
              ))}
            </>
          ) : null}
          {schema.skills?.length ? (
            <>
              <Text style={styles.section}>Skills</Text>
              <View style={styles.pillRow}>
                {schema.skills.map((s, i) => <Text key={i} style={styles.pill}>{s}</Text>)}
              </View>
            </>
          ) : null}
          {schema.languages?.length ? (
            <>
              <Text style={styles.section}>Languages</Text>
              <View style={styles.pillRow}>
                {schema.languages.map((s, i) => <Text key={i} style={styles.pill}>{s}</Text>)}
              </View>
            </>
          ) : null}
        </View>
      </Page>
    </Document>
  );

  const blob = await pdfToBlob(doc);
  const safe = (schema.name || "resume").replace(/[^a-z0-9-_ ]/gi, "_").slice(0, 50);
  const url = await uploadArtifact(blob, `${safe}-resume.pdf`);
  const pdfPreviewUrl = URL.createObjectURL(blob);

  return {
    title: `${schema.name || "Resume"} — Resume`,
    summary: `Resume for ${schema.name || "you"} is ready (${schema.experience?.length ?? 0} roles, ${schema.skills?.length ?? 0} skills).`,
    downloadUrl: url ?? undefined,
    pdfPreviewUrl,
    mimeType: "application/pdf",
  };
}
