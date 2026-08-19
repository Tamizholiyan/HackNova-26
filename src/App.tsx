import React from 'react';
import { EmergencyProvider, useEmergency } from './context/EmergencyContext';
import { TopBar } from './components/navigation/TopBar';
import { PitchStoryWalkthrough } from './components/pitch/PitchStoryWalkthrough';
import { PitchGrid } from './components/portals/PitchGrid';
import { PublicPortal } from './components/portals/PublicPortal';
import { DispatchCenter } from './components/portals/DispatchCenter';
import { ResponderPortal } from './components/portals/ResponderPortal';
import { HospitalBoard } from './components/portals/HospitalBoard';

const AppContent: React.FC = () => {
  const { currentView } = useEmergency();

  return (
    <div className="flex flex-col h-screen w-screen bg-[#05070D] text-slate-100 overflow-hidden select-none font-sans">
      {/* Top Header Bar */}
      <TopBar />

      {/* Guided Hackathon Pitch Story Walkthrough Bar */}
      <PitchStoryWalkthrough />

      {/* Main View Area */}
      <main className="flex-1 overflow-hidden relative">
        {currentView === 'pitch_grid' && <PitchGrid />}
        {currentView === 'public' && <PublicPortal />}
        {currentView === 'dispatch' && <DispatchCenter />}
        {currentView === 'responder' && <ResponderPortal />}
        {currentView === 'hospital' && <HospitalBoard />}
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <EmergencyProvider>
      <AppContent />
    </EmergencyProvider>
  );
};

export default App;
