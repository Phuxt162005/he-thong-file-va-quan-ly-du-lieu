import { useEffect, useState } from "react";

import { getProfile } from "../../services/userService";

import "./Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const data = await getProfile();
    setUser(data);
  }

  if (!user) {
    return <p>Đang tải...</p>;
  }

  return (
    <div className="profile-page">
      <h1>Thông tin cá nhân</h1>

      <p>Username: {user.username}</p>
      <p>Email: {user.email}</p>
      <p>Dung lượng đã sử dụng: {user.storageUsed}</p>
      <p>Tổng dung lượng: {user.storageLimit}</p>
    </div>
  );
}
