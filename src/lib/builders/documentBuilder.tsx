import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { generateBuilderSchema, uploadArtifact } from "./aiSchema";
import { pdfToBlob, palette } from "./pdfBase";
import type { BuilderResult, DocumentSchema } from "./types";

const styles = StyleSheet.create({
  cover: { backgroundColor: palette.ink, color: "#fff", padding: 64, height: "100%", justifyContent: "center" },
  coverTitle: { fontSize: 38, fontWeight: 700, color: "#fff", marginBottom: 14 },
  coverSub: { fontSize: 14, color: "#cbd5e1" },
  page: { padding: 56, fontFamily: "Helvetica", color: palette.body, fontSize: 11, lineHeight: 1.55 },
  h2: { fontSize: 18, fontWeight: 700, color: palette.ink, marginTop: 14, marginBottom: 8 },
  body: { fontSize: 11.5, color: palette.body, marginBottom: 6, textAlign: "justify" },
  divider: { borderBottomWidth: 1, borderBottomColor: palette.line, marginVertical: 12 },
  footer: { position: "absolute", bottom: 24, left: 56, right: 56, fontSize: 9, color: palette.muted, textAlign: "center" },
});

export async function buildDocument(topic: string, brief?: unknown): Promise<BuilderResult> {
  const schema = await generateBuilderSchema<DocumentSchema>("document", topic, { brief });
  if (!schema) return { title: topic, summary: "Document generation failed. Please try again." };

  const doc = (
    <Document>
      <Page size="A4" style={styles.cover}>
        <Text style={styles.coverTitle}>{schema.title || "Untitled"}</Text>
        {schema.subtitle ? <Text style={styles.coverSub}>{schema.subtitle}</Text> : null}
      </Page>
      <Page size="A4" style={styles.page}>
        {(schema.sections || []).map((s, i) => (
          <View key={i} wrap={false}>
            <Text style={styles.h2}>{s.heading}</Text>
            <Text style={styles.body}>{s.body}</Text>
            <View style={styles.divider} />
          </View>
        ))}
        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );

  const blob = await pdfToBlob(doc);
  const safe = (schema.title || "document").replace(/[^a-z0-9-_ ]/gi, "_").slice(0, 50);
  const url = await uploadArtifact(blob, `${safe}.pdf`);
  const pdfPreviewUrl = URL.createObjectURL(blob);

  return {
    title: schema.title,
    summary: `Your document "${schema.title}" is ready with ${schema.sections?.length ?? 0} sections.`,
    downloadUrl: url ?? undefined,
    pdfPreviewUrl,
    mimeType: "application/pdf",
  };
}
