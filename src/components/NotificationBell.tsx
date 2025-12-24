'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface NotificationData {
    id: string;
    type: string;
    title: string;
    message: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        fetchNotifications();
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (id: string) => {
        await fetch('/api/notifications', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId: id }),
        });
        fetchNotifications();
    };

    const markAllRead = async () => {
        await fetch('/api/notifications', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markAllRead: true }),
        });
        fetchNotifications();
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'ORDER': return '🛒';
            case 'DEPOSIT': return '💰';
            case 'PROMO': return '🎉';
            default: return '🔔';
        }
    };

    return (
        <div className="notification-bell">
            <button className="bell-btn" onClick={() => setShowDropdown(!showDropdown)}>
                🔔
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>

            {showDropdown && (
                <div className="dropdown">
                    <div className="dropdown-header">
                        <h4>Notifications</h4>
                        {unreadCount > 0 && (
                            <button className="mark-all" onClick={markAllRead}>Mark all read</button>
                        )}
                    </div>
                    <div className="notification-list">
                        {notifications.length > 0 ? (
                            notifications.slice(0, 10).map((n) => (
                                <div
                                    key={n.id}
                                    className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                                    onClick={() => {
                                        markAsRead(n.id);
                                        if (n.link) window.location.href = n.link;
                                    }}
                                >
                                    <span className="icon">{getIcon(n.type)}</span>
                                    <div className="content">
                                        <strong>{n.title}</strong>
                                        <p>{n.message}</p>
                                        <span className="time">{formatTime(n.createdAt)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty">No notifications</div>
                        )}
                    </div>
                </div>
            )}

            <style jsx>{`
        .notification-bell { position: relative; }
        .bell-btn { background: none; border: none; font-size: 20px; cursor: pointer; padding: 8px; position: relative; }
        .badge { position: absolute; top: 2px; right: 2px; background: #EF4444; color: white; font-size: 10px; padding: 2px 5px; border-radius: 10px; min-width: 16px; text-align: center; }
        .dropdown { position: absolute; right: 0; top: 100%; width: 320px; background: #1e1e32; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); z-index: 1000; }
        .dropdown-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .dropdown-header h4 { margin: 0; font-size: 14px; }
        .mark-all { background: none; border: none; color: #8B5CF6; font-size: 12px; cursor: pointer; }
        .notification-list { max-height: 400px; overflow-y: auto; }
        .notification-item { display: flex; gap: 12px; padding: 14px 16px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.2s; }
        .notification-item:hover { background: rgba(255,255,255,0.05); }
        .notification-item.unread { background: rgba(139,92,246,0.1); }
        .icon { font-size: 20px; }
        .content { flex: 1; }
        .content strong { display: block; font-size: 13px; margin-bottom: 4px; }
        .content p { margin: 0; font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.4; }
        .time { font-size: 10px; color: rgba(255,255,255,0.4); }
        .empty { padding: 40px; text-align: center; color: rgba(255,255,255,0.4); font-size: 14px; }
      `}</style>
        </div>
    );
}
