import axios from 'axios';
axios.defaults.withCredentials = true;
axios.defaults.withXSRFToken = true;

const api = axios.create({
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
    },
});

export default api;
