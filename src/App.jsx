import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./Layout";
import Timeline from "./pages/Timeline";
import ProjectDetail from "./pages/ProjectDetail";
import ActivityDetail from "./pages/ActivityDetail";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";

export default function App() {
  console.log("🎯 App.jsx está cargando");
  
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Timeline />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/project" element={<ProjectDetail />} />
        <Route path="/activity" element={<ActivityDetail />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  );
}