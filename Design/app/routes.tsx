import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { WatchRoom } from "./pages/WatchRoom";
import { Movies } from "./pages/Movies";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
  {
    path: "/room/:roomId",
    Component: WatchRoom,
  },
  {
    path: "/movies",
    Component: Movies,
  },
]);
