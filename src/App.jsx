import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import TimelinePage from "./pages/TimelinePage";
import TelegramPage from "./pages/TelegramPage";
import YouTubePage from "./pages/YouTubePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="timeline" element={<ErrorBoundary><TimelinePage /></ErrorBoundary>} />
          <Route path="telegram" element={<ErrorBoundary><TelegramPage /></ErrorBoundary>} />
          <Route path="youtube" element={<ErrorBoundary><YouTubePage /></ErrorBoundary>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
