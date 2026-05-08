// app/not-found.js
import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", height:"100dvh", gap:"16px",
      background:"var(--bg)", color:"var(--muted)", fontFamily:"var(--font)"
    }}>
      <span style={{fontSize:"48px", opacity:0.2}}>📚</span>
      <h1 style={{fontSize:"18px", fontWeight:700, color:"var(--text)"}}>Plan not found</h1>
      <p style={{fontSize:"13px"}}>That study plan doesn't exist yet.</p>
      <Link href="/" style={{
        padding:"8px 20px", background:"var(--accent)", color:"#0C0E1A",
        borderRadius:"8px", fontSize:"13px", fontWeight:700
      }}>
        Go Home
      </Link>
    </div>
  );
}
