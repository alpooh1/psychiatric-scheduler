import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import DoctorList from './components/DoctorList';
import ScheduleGrid from './components/ScheduleGrid';
import LoginOverlay from './components/LoginOverlay';
import { useScheduleStore } from './store/useScheduleStore';
import { COLORS } from './constants';

function App() {
  const { moveSlot } = useScheduleStore();
  const [activeItem, setActiveItem] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem('pt_scheduler_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    sessionStorage.setItem('pt_scheduler_auth', 'true');
    setIsAuthenticated(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event) => {
    setActiveItem(event.active.data.current);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveItem(null);

    if (over) {
      const { doctorId, slotIndex } = active.data.current;
      const { day, time, room } = over.data.current;

      // Update the slot configuration to match the drop target
      moveSlot(doctorId, slotIndex, day, time, room);
    }
  };

  if (!isAuthenticated) {
    return <LoginOverlay onLogin={handleLogin} />;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-6 gap-6 overflow-hidden font-sans">
        {/* Left Panel */}
        <div className="w-1/3 flex flex-col min-w-[350px]">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">정신치료 일정 배정</h1>
            <p className="text-slate-500 text-sm mt-1">의사별 치료 일정을 설정하고 배정하세요.</p>
          </header>
          <div className="flex-1 overflow-hidden">
            <DoctorList />
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-2/3 shadow-xl rounded-2xl ring-1 ring-slate-900/5">
          <ScheduleGrid />
        </div>
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className={`p-3 rounded-lg border-2 ${COLORS[activeItem.type]} shadow-lg w-48 opacity-90`}>
            <div className="font-bold text-sm mb-1">
              {activeItem.doctorName} - 치료 {activeItem.slotIndex + 1}
            </div>
            <div className="text-xs">{activeItem.type}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default App;
