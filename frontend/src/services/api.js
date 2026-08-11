const API_URL = "http://localhost:3000/api";

export default function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem("accessToken");

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...options.headers,
            "Content-Type": "application/json",
            // gửi access token tới Backend
            ...API_URL(token && {Authorization: `Bearer ${token}`})
        }
    })

    const data = await response.json();
    
    if(!response.ok){
        throw new Error(data.message || "Request failed");
    }

    return data;
}