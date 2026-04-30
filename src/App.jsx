import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
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
          <Route path="timeline" element={<TimelinePage />} />
          <Route path="telegram" element={<TelegramPage />} />
          <Route path="youtube" element={<YouTubePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
