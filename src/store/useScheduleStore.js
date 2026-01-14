import { create } from 'zustand';
import { supabase } from '../supabaseClient';

// Helper to initial doctors structure (same as before, but data will come from DB)
const getInitialDoctors = () => Array.from({ length: 9 }, (_, i) => ({
    id: `doctor-${i + 1}`,
    name: `의사 ${i + 1}`,
    slots: [
        { id: `d${i + 1}-s1`, type: 'CBT', day: '', time: '', room: '', status: 'Assignable', startDate: '' },
        { id: `d${i + 1}-s2`, type: 'IPT', day: '', time: '', room: '', status: 'Assignable', startDate: '' },
    ],
}));

export const useScheduleStore = create((set, get) => ({
    doctors: getInitialDoctors(),
    outpatientSlots: [],

    // Initialize Supabase: Fetch data & Subscribe
    initSupabase: async () => {
        // 1. Fetch Doctors
        const { data: doctorsData } = await supabase.from('doctors').select('*');
        if (doctorsData && doctorsData.length > 0) {
            set(state => {
                const newDoctors = [...state.doctors];
                doctorsData.forEach(remoteDoc => {
                    const idx = newDoctors.findIndex(d => d.id === remoteDoc.id);
                    if (idx !== -1) newDoctors[idx].name = remoteDoc.name;
                });
                return { doctors: newDoctors };
            });
        }

        // 2. Fetch Slots
        const { data: slotsData } = await supabase.from('slots').select('*');
        if (slotsData) {
            set(state => {
                const newDoctors = [...state.doctors];
                slotsData.forEach(remoteSlot => {
                    const docIdx = newDoctors.findIndex(d => d.id === remoteSlot.doctor_id);
                    if (docIdx !== -1) {
                        // Find slot index based on some logic or assume order? 
                        // To be safe, let's map by manually constructing ID if possible or just use slot_index
                        const slotIdx = remoteSlot.slot_index; // We need to store slot_index in DB
                        if (newDoctors[docIdx].slots[slotIdx]) {
                            newDoctors[docIdx].slots[slotIdx] = {
                                ...newDoctors[docIdx].slots[slotIdx],
                                day: remoteSlot.day,
                                time: remoteSlot.time,
                                room: remoteSlot.room,
                                status: remoteSlot.status,
                                type: remoteSlot.type,
                                startDate: remoteSlot.start_date
                            };
                        }
                    }
                });
                return { doctors: newDoctors };
            });
        }

        // 3. Fetch Outpatient Slots
        const { data: opData } = await supabase.from('outpatient_slots').select('id');
        if (opData) {
            set({ outpatientSlots: opData.map(d => d.id) });
        }

        // 4. Subscribe to Realtime Changes
        supabase.channel('public-db-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, (payload) => {
                const { new: newDoc } = payload;
                set(state => ({
                    doctors: state.doctors.map(d => d.id === newDoc.id ? { ...d, name: newDoc.name } : d)
                }));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, (payload) => {
                const { new: newSlot } = payload;
                if (!newSlot) return; // e.g. delete event
                set(state => ({
                    doctors: state.doctors.map(d => {
                        if (d.id !== newSlot.doctor_id) return d;
                        const newSlots = [...d.slots];
                        if (newSlots[newSlot.slot_index]) {
                            newSlots[newSlot.slot_index] = {
                                ...newSlots[newSlot.slot_index],
                                day: newSlot.day,
                                time: newSlot.time,
                                room: newSlot.room,
                                status: newSlot.status,
                                type: newSlot.type,
                                startDate: newSlot.start_date
                            };
                        }
                        return { ...d, slots: newSlots };
                    })
                }));
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'outpatient_slots' }, (payload) => {
                const { eventType, new: newItem, old: oldItem } = payload;
                set(state => {
                    if (eventType === 'INSERT') return { outpatientSlots: [...state.outpatientSlots, newItem.id] };
                    if (eventType === 'DELETE') return { outpatientSlots: state.outpatientSlots.filter(id => id !== oldItem.id) };
                    return state;
                });
            })
            .subscribe();
    },

    updateDoctorName: async (doctorId, name) => {
        // Optimistic update
        set((state) => ({
            doctors: state.doctors.map((d) => d.id === doctorId ? { ...d, name } : d),
        }));
        // DB update
        await supabase.from('doctors').upsert({ id: doctorId, name });
    },

    updateDoctorSlotConfig: async (doctorId, slotIndex, field, value) => {
        // Optimistic
        set((state) => ({
            doctors: state.doctors.map((d) => {
                if (d.id !== doctorId) return d;
                const newSlots = [...d.slots];
                newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
                return { ...d, slots: newSlots };
            }),
        }));

        // Prepare DB data
        const state = get();
        const doctor = state.doctors.find(d => d.id === doctorId);
        const slot = doctor.slots[slotIndex];

        // We need to upsert the whole slot state to ensure consistency
        await supabase.from('slots').upsert({
            id: `${doctorId}-s${slotIndex + 1}`, // unique ID construction
            doctor_id: doctorId,
            slot_index: slotIndex,
            type: slot.type,
            day: slot.day,
            time: slot.time,
            room: slot.room,
            status: slot.status,
            start_date: slot.startDate
        });
    },

    updateDoctorSlotStatus: async (doctorId, slotIndex, status) => {
        // Re-use logic or duplicate for granular control. Let's redirect to general config update
        get().updateDoctorSlotConfig(doctorId, slotIndex, 'status', status);
    },

    updateDoctorSlotStartDate: async (doctorId, slotIndex, startDate) => {
        get().updateDoctorSlotConfig(doctorId, slotIndex, 'startDate', startDate);
    },

    moveSlot: async (doctorId, slotIndex, day, time, room) => {
        const state = get();
        // Optimistic
        set((state) => ({
            doctors: state.doctors.map((d) => {
                if (d.id !== doctorId) return d;
                const newSlots = [...d.slots];
                newSlots[slotIndex] = { ...newSlots[slotIndex], day, time, room };
                return { ...d, slots: newSlots };
            }),
        }));

        const doctor = state.doctors.find(d => d.id === doctorId);
        const slot = doctor.slots[slotIndex];

        await supabase.from('slots').upsert({
            id: `${doctorId}-s${slotIndex + 1}`,
            doctor_id: doctorId,
            slot_index: slotIndex,
            type: slot.type,
            day: day,
            time: time,
            room: room,
            status: slot.status,
            start_date: slot.startDate
        });
    },

    toggleOutpatientSlot: async (day, room, time) => {
        const key = `${day}-${room}-${time}`;
        const exists = get().outpatientSlots.includes(key);

        if (exists) {
            // Optimistic
            set(state => ({ outpatientSlots: state.outpatientSlots.filter(s => s !== key) }));
            // DB Delete
            await supabase.from('outpatient_slots').delete().eq('id', key);
        } else {
            // Optimistic
            set(state => ({ outpatientSlots: [...get().outpatientSlots, key] }));
            // DB Insert
            await supabase.from('outpatient_slots').insert({ id: key });
        }
    }
}));

