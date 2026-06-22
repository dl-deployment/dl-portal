import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { isLoggedIn } from "./lib/auth";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import BookmarksPage from "./pages/BookmarksPage";
import ColorPage from "./pages/ColorPage";
import Home from "./pages/Home";
import SpriteSheetSlicerPage from "./pages/SpriteSheetSlicerPage";
import TelegramPage from "./pages/TelegramPage";
import TextToolsPage from "./pages/TextToolsPage";
import PersonalTimelinePage from "./pages/PersonalTimelinePage";
import TimelinePage from "./pages/TimelinePage";
import FreeGamesPage from "./pages/FreeGamesPage";

import YouTubePage from "./pages/YouTubePage";
import SpritesheetViewerPage from "./pages/SpritesheetViewerPage";
import StaticPagesPage from "./pages/StaticPagesPage";
import TexturePackerPage from "./pages/TexturePackerPage";
import Poe2Page from "./pages/Poe2Page";

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
          <Route path="spritesheetviewer" element={<ErrorBoundary><SpritesheetViewerPage /></ErrorBoundary>} />
          <Route path="color" element={<ErrorBoundary><ColorPage /></ErrorBoundary>} />
          <Route path="freegames" element={<ErrorBoundary><FreeGamesPage /></ErrorBoundary>} />
          <Route path="timeline" element={<ErrorBoundary><TimelinePage /></ErrorBoundary>} />
          <Route path="staticpages" element={<ErrorBoundary><StaticPagesPage /></ErrorBoundary>} />
          <Route path="texturepacker" element={<ErrorBoundary><TexturePackerPage /></ErrorBoundary>} />
          <Route path="poe2" element={<ErrorBoundary><Poe2Page /></ErrorBoundary>} />
          {/* Auth required */}
          <Route path="bookmarks" element={<ProtectedRoute><ErrorBoundary><BookmarksPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="ptimeline" element={<ProtectedRoute><ErrorBoundary><PersonalTimelinePage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="telegram" element={<ProtectedRoute><ErrorBoundary><TelegramPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="youtube" element={<ProtectedRoute><ErrorBoundary><YouTubePage /></ErrorBoundary></ProtectedRoute>} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}
