"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="de">
      <body>
        <main
          style={{
            maxWidth: "44rem",
            margin: "0 auto",
            padding: "5rem 1.25rem",
            fontFamily: "Georgia, serif",
            color: "#252018",
          }}
        >
          <h1>Die Website ist vorübergehend nicht erreichbar.</h1>
          <p>Bitte versuche die Seite gleich noch einmal.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1rem",
              border: 0,
              borderRadius: "0.2rem",
              padding: "0.8rem 1.1rem",
              background: "#b3262d",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Erneut versuchen
          </button>
        </main>
      </body>
    </html>
  );
}
