import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/common/Header";
import Sidebar from "./components/common/Sidebar";
import LogInteractionScreen from "./components/LogInteractionScreen";

function Placeholder({ title }) {
  return (
    <div style={{ padding: 40, fontFamily: "Inter, sans-serif" }}>
      <h2 style={{ color: "#0f172a", fontSize: 22, fontWeight: 700 }}>{title}</h2>
      <p style={{ color: "#64748b" }}>This section is coming soon.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={styles.root}>
        <Header />
        <div style={styles.body}>
          <Sidebar />
          <main style={styles.main}>
            <Routes>
              <Route path="/" element={<Navigate to="/log" replace />} />
              <Route path="/log" element={<LogInteractionScreen />} />
              <Route path="/activities" element={<Placeholder title="Activity Log" />} />
              <Route path="/hcps" element={<Placeholder title="My HCPs" />} />
              <Route path="/insights" element={<Placeholder title="Insights" />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#f8fafc",
    fontFamily: "Inter, sans-serif",
  },
  body: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  main: {
    flex: 1,
    overflowY: "auto",
    background: "#f8fafc",
  },
};
