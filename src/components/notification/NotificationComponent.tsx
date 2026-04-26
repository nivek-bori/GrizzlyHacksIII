import { bg_blue, bg_green, bg_red } from "@/types/styles"
import { X } from "lucide-react";

export type NotificationType = 'success' | 'error' | 'info';

export default function NotificationComponent({ type, message, removeNotification }: { type: NotificationType, message: string, removeNotification: () => void }) {
  const bg_color = type === 'success' ? bg_green : type === 'error' ? bg_red : bg_blue;
  
  return (
    <div
      className={`${bg_color} pointer-events-auto w-[70%] rounded-lg flex flex-row items-center justify-between`}
    >
      <div className="text-white text-[1.1rem] my-4 ml-4">{message}</div>
      <button onClick={removeNotification} className='p-4'><X strokeWidth={3} className="w-4 h-4" /></button>
    </div>
  )
}