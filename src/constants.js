export const THERAPY_TYPES = ['CBT', 'IPT', 'ACT', 'MET', 'PDT'];

export const DAYS = [
    { id: 'mon', label: '월' },
    { id: 'tue', label: '화' },
    { id: 'wed', label: '수' },
    { id: 'thu', label: '목' },
    { id: 'fri', label: '금' },
];

export const ROOMS = [10, 11, 12, 13];

export const MORNING_SLOTS = ['08:30', '09:30', '10:30', '11:30'];
export const AFTERNOON_SLOTS = ['13:30', '14:30', '15:30'];
export const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

export const COLORS = {
    CBT: 'bg-blue-100 border-blue-300 text-blue-800',
    IPT: 'bg-green-100 border-green-300 text-green-800',
    ACT: 'bg-purple-100 border-purple-300 text-purple-800',
    MET: 'bg-orange-100 border-orange-300 text-orange-800',
    PDT: 'bg-red-100 border-red-300 text-red-800',
};
