import axios from 'axios';

// CHANGE THIS TO YOUR COMPUTER'S CURRENT IP
export const BASE_URL = 'https://192.168.0.50:5000'; 

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});
export default api;