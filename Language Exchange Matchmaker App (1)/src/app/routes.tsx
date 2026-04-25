import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { Discover } from "./components/Discover";
import { MyPartners } from "./components/MyPartners";
import { Games } from "./components/Games";
import { Chat } from "./components/Chat";
import { Schedule } from "./components/Schedule";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "discover", Component: Discover },
      { path: "partners", Component: MyPartners },
      { path: "games", Component: Games },
      { path: "schedule", Component: Schedule },
      { path: "chat/:partnerId", Component: Chat },
    ],
  },
]);
