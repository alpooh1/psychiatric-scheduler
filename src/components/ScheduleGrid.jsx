import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useScheduleStore } from '../store/useScheduleStore';
import { DAYS, ALL_SLOTS, COLORS, ROOMS } from '../constants';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const DroppableCell = ({ day, time, room, schedule, isOutpatient, onToggleOutpatient }) => {
    const key = `${day}-${room}-${time}`;
    const assigned = schedule[key];

    const { isOver, setNodeRef } = useDroppable({
        id: key,
        data: { day, time, room },
        disabled: isOutpatient // Disable drop if outpatient
    });

    const baseClasses = "h-full w-full border border-slate-100 rounded flex flex-col items-center justify-center text-xs transition-colors relative overflow-hidden cursor-pointer";

    // Dynamic styling based on state
    let bgClass = 'bg-slate-50 hover:bg-slate-100';
    if (isOver) bgClass = 'bg-blue-50 ring-2 ring-blue-400 z-10';
    if (isOutpatient) bgClass = 'bg-slate-200 hover:bg-slate-300'; // Gray for Outpatient

    const assignedClass = assigned ? COLORS[assigned.type] : '';

    // Standard border unless specially highlighted (removed specific border logic for assignment status as requested to use circles instead, but kept subtle border for structure)
    let borderClass = 'border-slate-100';

    const finalClass = twMerge(baseClasses, borderClass, assigned ? assignedClass : bgClass);

    const handleClick = () => {
        // Only toggle if empty
        if (!assigned) {
            onToggleOutpatient(day, room, time);
        }
    };

    return (
        <div ref={setNodeRef} className={finalClass} onClick={handleClick}>
            {/* Room Indicator (Top Left) - BOLD */}
            <span className="absolute top-1 left-1.5 text-[10px] font-extrabold text-slate-500 opacity-70">
                {room}
            </span>

            {/* Status Indicator (Top Right) */}
            {assigned && (
                <div className="absolute top-1 right-1.5">
                    {assigned.status === 'In Progress' ? (
                        // Filled Circle for In Progress
                        <div className="w-2 h-2 rounded-full bg-slate-500 ring-1 ring-white/50 shadow-sm" title="치료 진행"></div>
                    ) : (
                        // Hollow Circle for Assignable
                        <div className="w-2 h-2 rounded-full border-2 border-slate-400 bg-transparent" title="배정 가능"></div>
                    )}
                </div>
            )}

            {isOutpatient && (
                <span className="font-bold text-slate-500">외래</span>
            )}

            {assigned && (
                <div className="text-center w-full leading-tight p-1 pt-4">
                    <div className="font-bold truncate text-[11px]">{assigned.doctorName}</div>
                    <div className="opacity-90 text-[10px]">{assigned.type}</div>
                </div>
            )}
        </div>
    );
};



const TimeRow = ({ time, days, schedule, outpatientSlots, toggleOutpatientSlot }) => {
    return (
        <div className="contents">
            {/* Time Header */}
            <div className="bg-slate-100 text-slate-500 font-medium text-xs flex items-center justify-center border-b border-slate-200 sticky left-0 z-20">
                {time}
            </div>

            {/* Day Columns */}
            {days.map(day => (
                <div key={`${day.id}-${time}`} className="border-b border-r border-slate-200 p-1 bg-white relative">
                    <div className="grid grid-cols-2 grid-rows-2 gap-1 h-28">
                        {ROOMS.map(room => (
                            <DroppableCell
                                key={`${day.id}-${time}-${room}`}
                                day={day.id}
                                time={time}
                                room={room}
                                schedule={schedule}
                                isOutpatient={outpatientSlots.includes(`${day.id}-${room}-${time}`)}
                                onToggleOutpatient={toggleOutpatientSlot}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default function ScheduleGrid() {
    const { doctors, outpatientSlots, toggleOutpatientSlot } = useScheduleStore();

    // Derive schedule map from doctors
    const schedule = useMemo(() => {
        if (!Array.isArray(doctors)) return {};
        const map = {};
        doctors.forEach(doc => {
            if (!doc?.slots) return; // Safety check for slots
            doc.slots.forEach(slot => {
                if (slot.day && slot.time && slot.room) {
                    const key = `${slot.day}-${slot.room}-${slot.time}`;
                    map[key] = { ...slot, doctorName: doc.name };
                }
            });
        });
        return map;
    }, [doctors]);

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shadow-sm z-40">
                <h2 className="text-lg font-bold text-slate-800">주간 치료 일정표</h2>
                <div className="text-xs text-slate-500 flex gap-3">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full border-2 border-slate-400"></div> 배정 가능
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-500"></div> 치료 진행
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-slate-200 rounded-sm"></span> 외래 (설정: 빈칸 클릭)
                    </div>
                </div>
            </div>

            {/* Grid Container */}
            <div className="flex-1 overflow-auto relative">
                <div className="grid" style={{ gridTemplateColumns: '80px repeat(5, minmax(180px, 1fr))' }}>

                    {/* Header Row */}
                    <div className="sticky top-0 z-30 bg-slate-50 border-b border-slate-200 h-10 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">
                        시간
                    </div>
                    {DAYS.map(day => (
                        <div key={day.id} className="sticky top-0 z-30 bg-slate-50 border-b border-slate-200 border-r h-10 flex items-center justify-center text-sm font-bold text-slate-700 shadow-sm">
                            {day.label}
                        </div>
                    ))}

                    {/* Rows - Consolidated View (All Slots) */}
                    {ALL_SLOTS.map(time => (
                        <TimeRow
                            key={time}
                            time={time}
                            days={DAYS}
                            schedule={schedule}
                            outpatientSlots={outpatientSlots}
                            toggleOutpatientSlot={toggleOutpatientSlot}
                        />
                    ))}

                </div>
            </div>
        </div>
    );
}
