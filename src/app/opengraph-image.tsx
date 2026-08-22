import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "SwiftPay - Gateway de Pagamentos PIX";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #000000 0%, #0c0d0f 50%, #14161b 100%)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #494fdf, #00a87e, #494fdf)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          {/* Logo + Title row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* Emerald shield icon */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                background: "#00a87e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 30px rgba(0, 168, 126, 0.3)",
              }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: "#ffffff" }}
              >
                <path
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: "white",
                letterSpacing: "-0.02em",
              }}
            >
              SwiftPay
            </span>
          </div>

          {/* Subtitle */}
          <span
            style={{
              fontSize: 28,
              color: "rgba(255, 255, 255, 0.6)",
              textAlign: "center",
              maxWidth: 700,
            }}
          >
            Gateway de Pagamentos PIX
          </span>

          {/* Feature pills */}
          <div
            style={{
              display: "flex",
              gap: 12,
              marginTop: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "rgba(0, 168, 126, 0.15)",
                borderRadius: 10,
                border: "1px solid rgba(0, 168, 126, 0.3)",
              }}
            >
              <span style={{ color: "#00a87e", fontSize: 16, fontWeight: 500 }}>
                API Simples
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "rgba(0, 168, 126, 0.15)",
                borderRadius: 10,
                border: "1px solid rgba(0, 168, 126, 0.3)",
              }}
            >
              <span style={{ color: "#00a87e", fontSize: 16, fontWeight: 500 }}>
                100% Seguro
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "rgba(0, 168, 126, 0.15)",
                borderRadius: 10,
                border: "1px solid rgba(0, 168, 126, 0.3)",
              }}
            >
              <span style={{ color: "#00a87e", fontSize: 16, fontWeight: 500 }}>
                PIX Only
              </span>
            </div>
          </div>
        </div>

        {/* Bottom domain bar */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "rgba(255, 255, 255, 0.4)",
            fontSize: 14,
          }}
        >
          <span>swiftpayment.info</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
