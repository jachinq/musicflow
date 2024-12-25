import { useEffect, useRef } from 'react';

const useClickOutside = (handler: () => void) => {
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as HTMLElement)) {
              event.stopPropagation();
              event.preventDefault();
                handler();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handler]);

    return ref;
};

export default useClickOutside;
