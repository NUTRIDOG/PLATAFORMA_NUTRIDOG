import './bootstrap';

const storageKey = 'nutridog-theme';

const applyTheme = (theme) => {
    document.body.classList.toggle('theme-dark', theme === 'dark');
};

const nextTheme = () => {
    const isDark = document.body.classList.contains('theme-dark');
    return isDark ? 'light' : 'dark';
};

document.addEventListener('DOMContentLoaded', () => {
    applyTheme(localStorage.getItem(storageKey) || 'light');

    document.querySelector('[data-theme-toggle]')?.addEventListener('click', () => {
        const theme = nextTheme();
        localStorage.setItem(storageKey, theme);
        applyTheme(theme);
    });
});
