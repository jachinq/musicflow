// components/Settings.tsx
import { ThemeToggle } from './theme-toggle';

function Settings() {
    return (
        <div className="p-4 bg-primary-foreground dark:bg-gray-700 rounded-lg">
            <ThemeToggle />
        </div>
    );
}

export default Settings;
