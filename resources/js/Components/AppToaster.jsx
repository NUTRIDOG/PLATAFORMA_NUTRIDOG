import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { Toaster, toast } from 'react-hot-toast';

const flattenMessages = (input) => {
    if (!input) {
        return [];
    }

    if (Array.isArray(input)) {
        return input.flatMap((item) => flattenMessages(item));
    }

    if (typeof input === 'object') {
        return Object.values(input).flatMap((item) => flattenMessages(item));
    }

    return typeof input === 'string' && input.trim() !== '' ? [input] : [];
};

export default function AppToaster() {
    const { status, errors } = usePage().props;
    const lastStatus = useRef(null);
    const lastErrors = useRef('');

    useEffect(() => {
        if (!status || status === lastStatus.current) {
            return;
        }

        lastStatus.current = status;
        toast.success(status);
    }, [status]);

    useEffect(() => {
        const messages = [...new Set(flattenMessages(errors))];
        const signature = JSON.stringify(messages);

        if (!messages.length || signature === lastErrors.current) {
            return;
        }

        lastErrors.current = signature;

        messages.forEach((message) => {
            toast.error(message);
        });
    }, [errors]);

    return (
        <Toaster
            position="top-right"
            toastOptions={{
                duration: 3600,
                style: {
                    borderRadius: '18px',
                    border: '1px solid rgba(103, 112, 133, 0.16)',
                    background: 'rgba(255, 255, 255, 0.96)',
                    color: '#1d2438',
                    boxShadow: '0 24px 60px rgba(39, 49, 71, 0.18)',
                    padding: '14px 16px',
                    fontWeight: 700,
                },
                success: {
                    iconTheme: {
                        primary: '#1fa971',
                        secondary: '#ffffff',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#d44d5c',
                        secondary: '#ffffff',
                    },
                },
            }}
        />
    );
}
