// app/plan/[slug]/loading.js
// Only covers the content area below TopNav (TopNav is in layout, persists).
// Shows a lightweight skeleton while the server fetches plan data.

export default function PlanLoading() {
  return (
    <div style={{
      display: "flex",
      flex: 1,
      overflow: "hidden",
      minHeight: 0,
    }}>
      {/* Sidebar skeleton */}
      <div style={{
        width: "215px",
        flexShrink: 0,
        background: "var(--surf)",
        borderRight: "1px solid var(--border2)",
        padding: "10px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}>
        <div style={skel("80%", 14, 4)} />
        {[90,75,85,70,80,65,88,72,80].map((w, i) => (
          <div key={i} style={skel(`${w}%`, 12, 4)} />
        ))}
      </div>

      {/* Main content skeleton */}
      <div style={{ flex:1, padding:"24px 28px", display:"flex", flexDirection:"column", gap:16, overflow:"hidden" }}>
        <div style={skel(180, 14, 20)} />
        <div style={skel(320, 28, 6)} />
        <div style={skel(90, 22, 20)} />
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8 }}>
          {[95,85,90,80,88].map((w, i) => (
            <div key={i} style={skel(`${w}%`, 14, 6)} />
          ))}
        </div>
        <div style={skel("100%", 80, 6, "var(--surf2)")} />
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[70,80,65].map((w, i) => (
            <div key={i} style={skel(`${w}%`, 14, 6)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function skel(w, h, radius=4, bg="var(--surf3)") {
  return {
    width:        typeof w === "number" ? `${w}px` : w,
    height:       `${h}px`,
    borderRadius: `${radius}px`,
    background:   bg,
    flexShrink:   0,
    animation:    "pulse 1.5s ease-in-out infinite",
  };
}
