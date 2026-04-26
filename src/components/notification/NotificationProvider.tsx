'use client'
import { DefaultAPIResponse } from "@/lib/util/api";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import NotificationComponent, { NotificationType} from "./NotificationComponent";

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  addNotification: ({ message, type }: { message: string, type: NotificationType }) => void;
  addNotificationStatus: (res: DefaultAPIResponse & any) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationCompnent');
  }
  return context;
}

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = ({ message, type }: { message: string, type: NotificationType }) => {
    setNotifications(prev => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString(36),
        message: message,
        type: type,
      },
    ]);
  };

  const addNotificationStatus = (res: DefaultAPIResponse & any) => {
    if (!res.message || res.message.trim() === '') return;

    addNotification({ message: res.message, type: res.status });
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ addNotification, addNotificationStatus }}>
      <div className="w-full h-full relative">
        {/* Notification location */}
        {notifications.length > 0 && (
          <div className="fixed top-0 left-0 right-0 z-50 flex flex-col gap-2 pt-3 items-center pointer-events-none">
            { notifications.map((notification) => <NotificationComponent key={notification.id} type={notification.type} message={notification.message} removeNotification={() => removeNotification(notification.id)} />) }
          </div>
        )}

        {/* Children */}
        {children}
      </div>
    </NotificationContext.Provider>
  );
}