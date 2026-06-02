import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import AppToaster from './Components/AppToaster';

const appName = import.meta.env.VITE_APP_NAME || 'NutriDog';
const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });

createInertiaApp({
    title: (title) => `${title} | ${appName}`,
    resolve: (name) => {
        const page = pages[`./Pages/${name}.jsx`];

        if (!page) {
            throw new Error(`Page not found: ${name}`);
        }

        const PageComponent = page.default;

        return function InertiaPageWithToaster(pageProps) {
            return (
                <>
                    <AppToaster />
                    <PageComponent {...pageProps} />
                </>
            );
        };
    },
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: {
        color: '#4316FF',
    },
});
