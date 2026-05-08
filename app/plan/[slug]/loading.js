// app/plan/[slug]/loading.js
// Skeleton for the 3-column layout: sidebar | content | detail panel

export default function PlanLoading() {
  return (
    <div style={{ display:"flex", flex:1, overflow:"hidden", minHeight:0 }}>

      {/* Sidebar skeleton — 280px */}
      <div style={{
        width: "280px", flexShrink:0,
        background: "var(--surf)", borderRight: "1px solid var(--border2)",
        padding: "10px 12px", display:"flex", flexDirection:"column", gap:7,
      }}>
        <div style={skel("60%", 14, 4)} />
        <div style={{ height: 1, background:"var(--border)", margin:"4px 0" }} />
        {/* Phase group header */}
        <div style={skel("75%", 12, 4)} />
        {[88,70,82,68,78,85,65,80,72,76].map((w, i) => (
          <div key={i} style={skel(`${w}%`, 13, 4)} />
        ))}
        <div style={{ height:1, background:"var(--border)", margin:"4px 0" }} />
        <div style={skel("65%", 12, 4)} />
        {[80,72,68,75].map((w, i) => (
          <div key={i} style={skel(`${w}%`, 13, 4)} />
        ))}
      </div>

      {/* Main content skeleton */}
      <div style={{ flex:1, padding:"24px 28px", display:"flex", flexDirection:"column", gap:14, overflow:"hidden" }}>
        <div style={skel(200, 14, 6)} />
        <div style={skel(360, 30, 6)} />
        <div style={skel(90, 22, 16)} />
        <div style={{ height:16 }} />
        <div style={skel("55%", 11, 3)} />
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {[95,88,92,85,90].map((w, i) => (
            <div key={i} style={skel(`${w}%`, 15, 6)} />
          ))}
        </div>
        <div style={{ height:8 }} />
        <div style={skel("55%", 11, 3)} />
        <div style={skel("100%", 72, 6, "var(--surf2)")} />
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {[70,78,64].map((w, i) => (
            <div key={i} style={skel(`${w}%`, 15, 6)} />
          ))}
        </div>
      </div>

      {/* Detail panel skeleton — 340px */}
      <div style={{
        width: "340px", flexShrink:0,
        background: "var(--surf)", borderLeft: "1px solid var(--border2)",
        padding: "20px 18px", display:"flex", flexDirection:"column", gap:14,
      }}>
        <div style={skel(32, 32, 8)} />
        <div style={skel("85%", 18, 4)} />
        <div style={skel("50%", 12, 3)} />
        <div style={{ display:"flex", gap:8 }}>
          <div style={skel("48%", 52, 8)} />
          <div style={skel("48%", 52, 8)} />
        </div>
        <div style={{ height:1, background:"var(--border)" }} />
        <div style={skel("45%", 11, 3)} />
        <div style={skel("70%", 28, 20)} />
        <div style={skel("45%", 11, 3)} />
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[60,80,55,70,65].map((w, i) => (
            <div key={i} style={skel(w, 22, 20)} />
          ))}
        </div>
        <div style={skel("45%", 11, 3)} />
        {[1,2,3].map(i => (
          <div key={i} style={skel("100%", 36, 6, "var(--surf2)")} />
        ))}
      </div>

    </div>
  );
}

function skel(w, h, radius = 4, bg = "var(--surf3)") {
  return {
    width:        typeof w === "number" ? `${w}px` : w,
    height:       `${h}px`,
    borderRadius: `${radius}px`,
    background:   bg,
    flexShrink:   0,
    animation:    "pulse 1.6s ease-in-out infinite",
  };
}