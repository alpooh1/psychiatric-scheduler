import { create } from 'zustand';
import { db } from '../firebase';
import { ref, onValue, set, update } from "firebase/database";

// Generate 9 initial doctors
const initialDoctors = Array.from({ length: 9 }, (_, i) => ({
    id: `doctor-${i + 1}`,
    name: `의사 ${i + 1}`,
    slots: [
        { id: `d${i + 1}-s1`, type: 'CBT', day: '', time: '', room: '', status: 'Assignable', startDate: '' },
        { id: `d${i + 1}-s2`, type: 'IPT', day: '', time: '', room: '', status: 'Assignable', startDate: '' },
    ],
}));

export const useScheduleStore = create((set, get) => ({
    doctors: initialDoctors,
    outpatientSlots: [],
    initialized: false, // Track if we've loaded data

    // Listener to sync from Firebase
    initFirebase: () => {
        if (get().initialized) return;

        const scheduleRef = ref(db, 'schedule');
        onValue(scheduleRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Merge with defaults to ensure structure
                set({
                    doctors: data.doctors || initialDoctors,
                    outpatientSlots: data.outpatientSlots || [],
                    initialized: true
                });
            } else {
                // If empty DB, initialize it
                set({ initialized: true });
                // Optional: Write initial data? No, let's keep it empty/default local until first write.
            }
        });
    },

    updateDoctorName: (doctorId, name) => {
        // Optimistic update
        const state = get();
        const docIndex = state.doctors.findIndex(d => d.id === doctorId);
        if (docIndex === -1) return;

        // Path: schedule/doctors/{index}/name
        const doctorRef = ref(db, `schedule/doctors/${docIndex}/name`);
        set(doctorRef, name);
    },

    updateDoctorSlotConfig: (doctorId, slotIndex, field, value) => {
        const state = get();
        const docIndex = state.doctors.findIndex(d => d.id === doctorId);
        if (docIndex === -1) return;

        // Path: schedule/doctors/{docIdx}/slots/{slotIdx}/{field}
        const fieldRef = ref(db, `schedule/doctors/${docIndex}/slots/${slotIndex}/${field}`);
        set(fieldRef, value);
    },

    updateDoctorSlotStatus: (doctorId, slotIndex, status) => {
        const state = get();
        const docIndex = state.doctors.findIndex(d => d.id === doctorId);
        if (docIndex === -1) return;

        const statusRef = ref(db, `schedule/doctors/${docIndex}/slots/${slotIndex}/status`);
        set(statusRef, status);
    },

    updateDoctorSlotStartDate: (doctorId, slotIndex, startDate) => {
        const state = get();
        const docIndex = state.doctors.findIndex(d => d.id === doctorId);
        if (docIndex === -1) return;

        const dateRef = ref(db, `schedule/doctors/${docIndex}/slots/${slotIndex}/startDate`);
        set(dateRef, startDate);
    },

    moveSlot: (doctorId, slotIndex, day, time, room) => {
        const state = get();
        const docIndex = state.doctors.findIndex(d => d.id === doctorId);
        if (docIndex === -1) return;

        // Update multiple fields: day, time, room
        const slotRef = ref(db, `schedule/doctors/${docIndex}/slots/${slotIndex}`);
        update(slotRef, { day, time, room });
    },

    toggleOutpatientSlot: (day, room, time) => {
        const state = get();
        const key = `${day}-${room}-${time}`;
        const exists = state.outpatientSlots.includes(key);

        let newSlots;
        if (exists) {
            newSlots = state.outpatientSlots.filter(s => s !== key);
        } else {
            newSlots = [...state.outpatientSlots, key];
        }

        // Update entire array (simple)
        const refOutpatient = ref(db, 'schedule/outpatientSlots');
        set(refOutpatient, newSlots);
    }
}));
