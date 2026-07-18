import { ImageResponse } from "next/og";

export const alt =
  "StudyAI - AI study notes, summaries, quizzes, and flashcards";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(135deg, #eef2ff 0%, #ffffff 44%, #dbeafe 100%)",
          color: "#0f172a",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
            maxWidth: 650,
          }}
        >
          <div
            style={{
              alignItems: "center",
              display: "flex",
              fontSize: 34,
              fontWeight: 900,
              gap: 18,
            }}
          >
            <div
              style={{
                alignItems: "center",
                background: "linear-gradient(135deg, #6366f1, #2563eb)",
                borderRadius: 26,
                color: "white",
                display: "flex",
                height: 76,
                justifyContent: "center",
                width: 76,
              }}
            >
              AI
            </div>
            StudyAI
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 78,
              fontWeight: 950,
              letterSpacing: 0,
              lineHeight: 0.98,
            }}
          >
            <span>Turn Any Topic Into</span>
            <span style={{ color: "#635bff" }}>Smart Study Material.</span>
          </div>
          <div
            style={{
              color: "#475569",
              fontSize: 30,
              lineHeight: 1.35,
              maxWidth: 600,
            }}
          >
            AI notes, summaries, quizzes, flashcards, and solved questions for
            focused learners.
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.82)",
            border: "1px solid #dbeafe",
            borderRadius: 38,
            boxShadow: "0 28px 80px rgba(99,91,255,0.20)",
            display: "flex",
            flexDirection: "column",
            gap: 20,
            padding: 30,
            width: 350,
          }}
        >
          {["Smart Notes", "Quick Summary", "Quiz Ready", "Flashcards"].map(
            (label, index) => (
              <div
                key={label}
                style={{
                  alignItems: "center",
                  background: index === 0 ? "#eef2ff" : "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 20,
                  color: index === 0 ? "#4f46e5" : "#334155",
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 800,
                  justifyContent: "space-between",
                  padding: "18px 20px",
                }}
              >
                <span>{label}</span>
                <span style={{ color: "#22c55e" }}>Ready</span>
              </div>
            ),
          )}
        </div>
      </div>
    ),
    size,
  );
}
