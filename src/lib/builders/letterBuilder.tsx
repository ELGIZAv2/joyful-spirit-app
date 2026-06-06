import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { generateBuilderSchema, uploadArtifact } from "./aiSchema";
import { pdfToBlob, palette } from "./pdfBase";
import type { BuilderResult, LetterSchema } from "./types";

const styles = StyleSheet.create({
  page: { padding: 64, fontFamily: "Helvetica", color: palette.body, fontSize: 11, lineHeight: 1.65 },
  sender: { fontSize: 11, color: palette.ink, fontWeight: 700 },
  senderLine: { fontSize: 10, color: palette.muted, marginTop: 2 },
  date: { marginTop: 24, fontSize: 10, color: palette.muted },
  recipient: { marginTop: 24, fontSize: 11, color: palette.ink, fontWeight: 700 },
  recipientLine: { fontSize: 10, color: palette.muted, marginTop: 2 },
  subject: { marginTop: 24, fontSize: 13, fontWeight: 700, color: palette.ink },
  body: { marginTop: 18, fontSize: 11, color: palette.body, textAlign: "justify" },
  closing: { marginTop: 28, fontSize: 11, color: palette.body },
});

export async function buildLetter(topic: string, brief?: unknown): Promise<BuilderResult> {
  const schema = await generateBuilderSchema<LetterSchema>("letter", topic, { brief });
  if (!schema) return { title: topic, summary: "Letter generation failed. Please try again." };

  const paragraphs = (schema.body || "").split(/\n{2,}/);
  const closingLines = (schema.closing || "").split(/\n/);

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {schema.sender?.name ? <Text style={styles.sender}>{schema.sender.name}</Text> : null}
        {schema.sender?.address ? <Text style={styles.senderLine}>{schema.sender.address}</Text> : null}
        {schema.sender?.email ? <Text style={styles.senderLine}>{schema.sender.email}</Text> : null}
        {schema.date ? <Text style={styles.date}>{schema.date}</Text> : null}
        {schema.recipient?.name ? <Text style={styles.recipient}>{schema.recipient.name}</Text> : null}
        {schema.recipient?.address ? <Text style={styles.recipientLine}>{schema.recipient.address}</Text> : null}
        {schema.subject ? <Text style={styles.subject}>Subject: {schema.subject}</Text> : null}
        {paragraphs.map((p, i) => <Text key={i} style={styles.body}>{p}</Text>)}
        {closingLines.length ? (
          <View style={styles.closing}>
            {closingLines.map((l, i) => <Text key={i}>{l}</Text>)}
          </View>
        ) : null}
      </Page>
    </Document>
  );

  const blob = await pdfToBlob(doc);
  const safe = (schema.subject || "letter").replace(/[^a-z0-9-_ ]/gi, "_").slice(0, 50);
  const url = await uploadArtifact(blob, `${safe}.pdf`);
  const pdfPreviewUrl = URL.createObjectURL(blob);

  return {
    title: schema.subject || "Letter",
    summary: `Your letter${schema.recipient?.name ? ` to ${schema.recipient.name}` : ""} is ready.`,
    downloadUrl: url ?? undefined,
    pdfPreviewUrl,
    mimeType: "application/pdf",
  };
}
