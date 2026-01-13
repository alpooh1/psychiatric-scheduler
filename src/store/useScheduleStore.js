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
            try {
                const data = snapshot.val();
                console.log('Firebase Sync Data (Raw):', data);

                // Deep Merge Logic
                const mergedDoctors = initialDoctors.map((initDoc, docIdx) => {
                    // Safety: Ensure data.doctors is accessible
                    const remoteDoc = data?.doctors?.[docIdx];
                    if (!remoteDoc) return initDoc;

                    return {
                        ...initDoc,
                        name: remoteDoc.name || initDoc.name,
                        // Fix 1: Handle 'slots' possibly being undefined in remoteDoc
                        slots: initDoc.slots.map((initSlot, slotIdx) => {
                            const remoteSlots = remoteDoc.slots;
                            // Fix 2: Handle 'remoteSlots' being an object or array, or undefined
                            const remoteSlot = remoteSlots ? remoteSlots[slotIdx] : undefined;

                            if (!remoteSlot) return initSlot;

                            return {
                                ...initSlot,
                                ...remoteSlot,
                                // Enforce ID/Type preservation
                                id: initSlot.id,
                                type: initSlot.type
                            };
                        })
                    };
                });

                // Safety: Verify result is valid before setting store
                if (Array.isArray(mergedDoctors)) {
                    set({
                        doctors: mergedDoctors,
                        outpatientSlots: Array.isArray(data?.outpatientSlots) ? data.outpatientSlots : (Object.values(data?.outpatientSlots || {}) || []),
                        initialized: true
                    });
                } else {
                    console.error('Merged doctors is not an array!', mergedDoctors);
                }

            } catch (error) {
                console.error('CRITICAL: Error processing Firebase data', error);
                // On error, do not break the app, just keep existing state or use defaults
                if (!get().initialized) {
                    set({ doctors: initialDoctors, initialized: true });
                }
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
