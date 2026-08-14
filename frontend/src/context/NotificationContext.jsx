import { createContext, useCallback, useContext, useState } from "react";

import NotificationContainer from "../components/NotificationContainer/NotificationContainer";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  }, []);

  const notify = useCallback((message, type = "info", duration = 4000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const success = useCallback(
    (message, duration = 4000) => notify(message, "success", duration),
    [notify],
  );

  const error = useCallback(
    (message, duration = 5000) => notify(message, "error", duration),
    [notify],
  );

  const warning = useCallback(
    (message, duration = 5000) => notify(message, "warning", duration),
    [notify],
  );

  const info = useCallback(
    (message, duration = 4000) => notify(message, "info", duration),
    [notify],
  );

  return (
    <NotificationContext.Provider
      value={{ notify, success, error, warning, info, removeNotification }}
    >
      {children}

      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotification phải được sử dụng bên trong NotificationProvider.",
    );
  }

  return context;
}
