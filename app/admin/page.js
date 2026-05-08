// app/admin/page.js
import LoginForm from "@/components/admin/LoginForm";

export const metadata = { title: "Admin — DayDeck" };

export default function AdminLoginPage() {
  return (
    <div style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
    }}>
      <LoginForm />
    </div>
  );
}
