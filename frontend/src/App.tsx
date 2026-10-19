import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { MainLayout } from "@/layouts/MainLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { HomePage } from "@/pages/HomePage";
import { MoviesPage } from "@/pages/MoviesPage";
import { MovieDetailPage } from "@/pages/MovieDetailPage";
import { TrendingPage } from "@/pages/TrendingPage";
import { GenresPage } from "@/pages/GenresPage";
import { RecommendationsPage } from "@/pages/RecommendationsPage";
import { AssistantPage } from "@/pages/AssistantPage";
import { BollywoodPage } from "@/pages/BollywoodPage";
import { HollywoodPage } from "@/pages/HollywoodPage";
import { MoodsPage } from "@/pages/MoodsPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { WatchlistPage } from "@/pages/WatchlistPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { SearchResultsPage } from "@/pages/SearchResultsPage";
import { PersonDetailPage } from "@/pages/PersonDetailPage";
import { RegionalCinemaPage } from "@/pages/RegionalCinemaPage";
import { TopRatedPage } from "@/pages/TopRatedPage";
import { UpcomingPage } from "@/pages/UpcomingPage";
import { CustomListsPage } from "@/pages/CustomListsPage";
import { CustomListDetailPage } from "@/pages/CustomListDetailPage";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/movies" element={<MoviesPage />} />
            <Route path="/movies/:id" element={<MovieDetailPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/people/:name" element={<PersonDetailPage />} />
            <Route path="/regional" element={<RegionalCinemaPage />} />
            <Route path="/top-rated" element={<TopRatedPage />} />
            <Route path="/upcoming" element={<UpcomingPage />} />
            <Route path="/lists" element={<CustomListsPage />} />
            <Route path="/lists/:id" element={<CustomListDetailPage />} />
            <Route path="/bollywood" element={<BollywoodPage />} />
            <Route path="/hollywood" element={<HollywoodPage />} />
            <Route path="/moods" element={<MoodsPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/genres" element={<GenresPage />} />
            <Route path="/recommendations" element={<RecommendationsPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/watchlist"
              element={
                <ProtectedRoute>
                  <WatchlistPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
