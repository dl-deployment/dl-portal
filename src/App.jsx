import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { isLoggedIn } from "./lib/auth";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import BookmarksPage from "./pages/BookmarksPage";
import ColorPage from "./pages/ColorPage";
import FacebookPage from "./pages/FacebookPage";
import Home from "./pages/Home";
import SpriteSheetSlicerPage from "./pages/SpriteSheetSlicerPage";
import TasksPage from "./pages/TasksPage";
import TelegramPage from "./pages/TelegramPage";
import TextToolsPage from "./pages/TextToolsPage";
import TimelinePage from "./pages/TimelinePage";
import YouTubePage from "./pages/YouTubePage";

function ProtectedRoute({ children }) {
  if (!isLoggedIn()) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          {/* Public */}
          <Route path="texttools" element={<ErrorBoundary><TextToolsPage /></ErrorBoundary>} />
          <Route path="spritesheetslicer" element={<ErrorBoundary><SpriteSheetSlicerPage /></ErrorBoundary>} />
          <Route path="color" element={<ErrorBoundary><ColorPage /></ErrorBoundary>} />
          {/* Auth required */}
          <Route path="bookmarks" element={<ProtectedRoute><ErrorBoundary><BookmarksPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="tasks" element={<ProtectedRoute><ErrorBoundary><TasksPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="timeline" element={<ErrorBoundary><TimelinePage /></ErrorBoundary>} />
          <Route path="telegram" element={<ProtectedRoute><ErrorBoundary><TelegramPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="youtube" element={<ProtectedRoute><ErrorBoundary><YouTubePage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="facebook" element={<ProtectedRoute><ErrorBoundary><FacebookPage /></ErrorBoundary></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
