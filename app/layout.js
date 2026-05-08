import "./globals.css";
import AuthProvider from "./AuthProvider";

export const metadata = {
  title: "DayDeck — Study Planner",
  description: "Your personal structured study planner",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
