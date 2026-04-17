import { useState } from "react";
import { useSelector } from "react-redux";
import Layout from "./components/Layout";
import LogInteractionScreen from "./components/LogInteractionScreen";
import HCPsPage from "./components/HCPsPage";
import DashboardPage from "./components/DashboardPage";
import LoginPage from "./components/Auth/LoginPage";
import SignupPage from "./components/Auth/SignupPage";

function renderPage(page) {
  if (page === "hcps") return <HCPsPage />;
  if (page === "dashboard") return <DashboardPage />;
  return <LogInteractionScreen />;
}

export default function App() {
  const { user } = useSelector((s) => s.auth);
  const [showSignup, setShowSignup] = useState(false);

  if (!user) {
    return showSignup
      ? <SignupPage onSwitch={() => setShowSignup(false)} />
      : <LoginPage onSwitch={() => setShowSignup(true)} />;
  }

  return (
    <Layout>
      {(activePage) => renderPage(activePage)}
    </Layout>
  );
}
