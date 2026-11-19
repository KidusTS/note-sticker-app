import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#d6402b",
        }}
      >
        <div
          style={{
            width: 104,
            height: 108,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 14,
            padding: "0 18px",
            background: "#ffe680",
            borderRadius: "2px 2px 22px 2px",
            transform: "rotate(-6deg)",
          }}
        >
          <div style={{ height: 9, width: "100%", background: "#2b2118", opacity: 0.55, borderRadius: 5 }} />
          <div style={{ height: 9, width: "68%", background: "#2b2118", opacity: 0.55, borderRadius: 5 }} />
        </div>
      </div>
    ),
    size,
  );
}
