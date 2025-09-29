import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Sessions from "./pages/Sessions";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Requests from "./pages/Requests";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/history" element={<History />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/requests" element={<Requests />} />
        {/* Placeholder routes */}
        <Route
          path="/sessions/create"
          element={<Navigate to="/sessions" replace />}
        />
      </Routes>
    </Router>
  );
};

export default App;
