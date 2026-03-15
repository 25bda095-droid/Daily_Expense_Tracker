import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const getExpenses   = ()     => axios.get(`${BASE}/expenses`);
export const addExpense    = (data) => axios.post(`${BASE}/expenses`, data);
export const deleteExpense = (id)   => axios.delete(`${BASE}/expenses/${id}`);
export const getInsights   = ()     => axios.get(`${BASE}/ai/insights`);