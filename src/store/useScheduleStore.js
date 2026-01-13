import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Generate 9 initial doctors
const initialDoctors = Array.from({ length: 9 }, (_, i) => ({
    id: `doctor-${i + 1}`,
    name: `의사 ${i + 1}`,
    // Each doctor has 2 configurable slots to drag from
    slots: [
        { id: `d${i + 1}-s1`, type: 'CBT', day: '', time: '', room: '', status: 'Assignable', startDate: '' },
        { id: `d${i + 1}-s2`, type: 'IPT', day: '', time: '', room: '', status: 'Assignable', startDate: '' },
    ],
}));

export const useScheduleStore = create(
    persist(
        (set) => ({
            doctors: initialDoctors,
            // Set of strings "day-room-time" that are marked as outpatient
            outpatientSlots: [],

            updateDoctorName: (doctorId, name) =>
                set((state) => ({
                    doctors: state.doctors.map((d) =>
                        d.id === doctorId ? { ...d, name } : d
                    ),
                })),

            updateDoctorSlotConfig: (doctorId, slotIndex, field, value) =>
                set((state) => ({
                    doctors: state.doctors.map((d) => {
                        if (d.id !== doctorId) return d;
                        const newSlots = [...d.slots];
                        newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
                        return { ...d, slots: newSlots };
                    }),
                })),

            updateDoctorSlotStatus: (doctorId, slotIndex, status) =>
                set((state) => ({
                    doctors: state.doctors.map((d) => {
                        if (d.id !== doctorId) return d;
                        const newSlots = [...d.slots];
                        newSlots[slotIndex] = { ...newSlots[slotIndex], status };
                        return { ...d, slots: newSlots };
                    }),
                })),

            updateDoctorSlotStartDate: (doctorId, slotIndex, startDate) =>
                set((state) => ({
                    doctors: state.doctors.map((d) => {
                        if (d.id !== doctorId) return d;
                        const newSlots = [...d.slots];
                        newSlots[slotIndex] = { ...newSlots[slotIndex], startDate };
                        return { ...d, slots: newSlots };
                    }),
                })),

            moveSlot: (doctorId, slotIndex, day, time, room) =>
                set((state) => ({
                    doctors: state.doctors.map((d) => {
                        if (d.id !== doctorId) return d;
                        const newSlots = [...d.slots];
                        newSlots[slotIndex] = {
                            ...newSlots[slotIndex],
                            day,
                            time,
                            room
                        };
                        return { ...d, slots: newSlots };
                    }),
                })),

            toggleOutpatientSlot: (day, room, time) =>
                set((state) => {
                    const key = `${day}-${room}-${time}`;
                    const exists = state.outpatientSlots.includes(key);
                    if (exists) {
                        return { outpatientSlots: state.outpatientSlots.filter(s => s !== key) };
                    } else {
                        return { outpatientSlots: [...state.outpatientSlots, key] };
                    }
                })
        }),
        {
            name: 'schedule-storage', // unique name
        }
    )
);
