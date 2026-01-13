import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useScheduleStore } from '../store/useScheduleStore';
import { THERAPY_TYPES, DAYS, ROOMS, ALL_SLOTS, COLORS } from '../constants';
import { GripVertical } from 'lucide-react';

const DraggableSlot = ({ doctor, slot, index }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: slot.id,
        data: { ...slot, doctorName: doctor.name, doctorId: doctor.id, slotIndex: index },
    });

    const { updateDoctorSlotConfig, updateDoctorSlotStatus, updateDoctorSlotStartDate, outpatientSlots } = useScheduleStore();

    const handleConfigChange = (field, value) => {
        updateDoctorSlotConfig(doctor.id, index, field, value);
    };

    const handleStatusChange = (e) => {
        updateDoctorSlotStatus(doctor.id, index, e.target.value);
    }

    const handleStartDateChange = (e) => {
        updateDoctorSlotStartDate(doctor.id, index, e.target.value);
    }

    const style = isDragging ? {
        opacity: 0.5,
        zIndex: 999
    } : undefined;

    const colorClass = COLORS[slot.type] || 'bg-gray-100 border-gray-300';

    const isBlocked = (d, r, t) => {
        if (!d || !r || !t) return false;
        return outpatientSlots.includes(`${d}-${r}-${t}`);
    };

    // Calculate session count
    const getSessionCount = () => {
        if (slot.status !== 'In Progress' || !slot.startDate) return '';
        const start = new Date(slot.startDate);
        const now = new Date();
        // Calculate difference in weeks
        const diffTime = Math.abs(now - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // If start date is future, return -
        if (start > now) return '예정';

        const weeks = Math.floor(diffDays / 7) + 1;
        return `${weeks}회차`;
    };

    const sessionDisplay = getSessionCount();

    return (
        <div ref={setNodeRef} style={style} className={`p-2 rounded-lg border-2 ${colorClass} shadow-sm space-y-1`}>
            <div className="flex items-start gap-2">
                {/* Grip Icon - Left Side */}
                <div className="pt-1">
                    <GripVertical {...attributes} {...listeners} className="w-4 h-4 cursor-grab active:cursor-grabbing text-gray-500" />
                </div>

                <div className="flex-1 flex flex-col gap-1">
                    {/* Row 1: Room, Day, Time */}
                    <div className="flex gap-1 text-xs">
                        {/* Room Dropdown */}
                        <select
                            className="flex-1 p-1 rounded border border-gray-200"
                            value={slot.room || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                handleConfigChange('room', val === '' ? '' : Number(val));
                            }}
                        >
                            <option value="">진료실</option>
                            {ROOMS.map(r => {
                                const blocked = isBlocked(slot.day, r, slot.time);
                                return <option key={r} value={r} disabled={blocked}>{r}진료실{blocked ? ' (외래)' : ''}</option>
                            })}
                        </select>

                        {/* Day Dropdown */}
                        <select
                            className="w-14 p-1 rounded border border-gray-200"
                            value={slot.day || ''}
                            onChange={(e) => handleConfigChange('day', e.target.value)}
                        >
                            <option value="">요일</option>
                            {DAYS.map(d => {
                                const blocked = isBlocked(d.id, slot.room, slot.time);
                                return <option key={d.id} value={d.id} disabled={blocked}>{d.label}{blocked ? ' (외래)' : ''}</option>
                            })}
                        </select>

                        {/* Time Dropdown */}
                        <select
                            className="w-16 p-1 rounded border border-gray-200"
                            value={slot.time || ''}
                            onChange={(e) => handleConfigChange('time', e.target.value)}
                        >
                            <option value="">시간</option>
                            {ALL_SLOTS.map(t => {
                                const blocked = isBlocked(slot.day, slot.room, t);
                                return <option key={t} value={t} disabled={blocked}>{t}{blocked ? ' (외래)' : ''}</option>
                            })}
                        </select>
                    </div>

                    {/* Row 2: Status, Type */}
                    <div className="flex gap-1 text-xs">
                        {/* Status Dropdown */}
                        <select
                            className="flex-1 p-1 rounded border-black/10 bg-white/50"
                            value={slot.status || 'Assignable'}
                            onChange={handleStatusChange}
                        >
                            <option value="Assignable">배정 가능</option>
                            <option value="In Progress">치료 진행</option>
                        </select>

                        {/* Type Dropdown */}
                        <select
                            className="w-20 p-1 rounded border-black/10 bg-white/50"
                            value={slot.type}
                            onChange={(e) => handleConfigChange('type', e.target.value)}
                        >
                            {THERAPY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    {/* Row 3: Start Date, Session Count */}
                    <div className="flex gap-1 items-center h-6">
                        {slot.status === 'In Progress' && (
                            <>
                                <input
                                    type="date"
                                    className="text-[10px] px-1 rounded border border-gray-300 flex-1 h-full bg-white"
                                    value={slot.startDate || ''}
                                    onChange={handleStartDateChange}
                                />
                                <div className="text-[10px] font-medium text-slate-600 min-w-[50px] text-center h-full flex items-center justify-center bg-slate-50 border border-slate-200 rounded">
                                    {sessionDisplay}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const DoctorRow = ({ doctor }) => {
    const { updateDoctorName } = useScheduleStore();

    return (
        <div className="flex flex-col gap-2 p-3 bg-white rounded-xl shadow-sm border border-slate-100">
            <input
                className="font-bold text-base text-slate-700 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors px-1"
                value={doctor.name}
                onChange={(e) => updateDoctorName(doctor.id, e.target.value)}
                placeholder="의사 이름"
            />
            <div className="grid grid-cols-2 gap-2">
                {doctor.slots.map((slot, idx) => (
                    <DraggableSlot key={slot.id} doctor={doctor} slot={slot} index={idx} />
                ))}
            </div>
        </div>
    );
};

export default function DoctorList() {
    const { doctors } = useScheduleStore();

    return (
        <div className="h-full overflow-y-auto pr-2 space-y-3">
            {doctors.map(doctor => (
                <DoctorRow key={doctor.id} doctor={doctor} />
            ))}
        </div>
    );
}
