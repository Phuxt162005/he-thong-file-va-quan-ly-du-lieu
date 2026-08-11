import {apiRequest} from "./api";

export default function login(username, password) {
    const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({username, password})
    })

    // lưu access token
    localStorage.setItem("accessToken", result.accessToken);

    return result;
}