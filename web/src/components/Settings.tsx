// components/Settings.tsx
import React, { useEffect, useState } from 'react';

function Settings() {
    const [theme, setTheme] = useState<string>('light');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    function toggleTheme() {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }

    return (
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button onClick={toggleTheme} className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
                切换主题 ({theme === 'light' ? '亮色' : '暗色'})
            </button>
            {/* 其他设置选项 */}
        </div>
    );
}

export default Settings;
