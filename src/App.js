import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import UploadData from "./components/UploadData";
import LoadingSpinner from "./components/LoadingSpinner";
import WrappedSummary from "./components/WrappedSummary";
import ErrorPage from "./components/ErrorPage";
import FloatingGhosts from "./components/FloatingGhosts";
import FloatingConfetti from "./components/FloatingConfetti";
import SlideShow from "./components/SlideShow";

function App() {
  return (
    <>
      <FloatingConfetti />
      <FloatingGhosts />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/upload" element={<UploadData />} />
          <Route path="/slideshow" element={<SlideShow />} />
          <Route path="/loading" element={<LoadingSpinner />} />
          <Route path="/wrapped" element={<WrappedSummary />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
