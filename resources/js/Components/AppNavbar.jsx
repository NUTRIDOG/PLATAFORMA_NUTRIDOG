import { Link, usePage } from '@inertiajs/react';
import TopbarMenu from './TopbarMenu';

export default function AppNavbar({
    title = 'NutriDog',
    subtitle = '',
    shellClass = 'experience-topbar',
    menuItems = [],
    brandMark = 'ND',
    allowGuestLogin = true,
}) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const computedSubtitle = subtitle || (user ? `Sesion activa: ${user.name}` : 'Plataforma editorial protegida');

    return (
        <header className={`${shellClass} app-navbar-shell glass-card`}>
            <div className="brand-rail">
                <span className="brand-mark brand-mark-image-shell">
                    <img
                        className="brand-mark-image"
                        src="/images/logo.webp"
                        alt={`${title} logo`}
                        onError={(event) => {
                            event.currentTarget.style.display = 'none';
                            const fallback = event.currentTarget.nextElementSibling;
                            if (fallback) {
                                fallback.hidden = false;
                            }
                        }}
                    />
                    <span className="brand-mark-fallback" hidden>
                        {brandMark}
                    </span>
                </span>
                <div>
                    <strong>{title}</strong>
                    <p>{computedSubtitle}</p>
                </div>
            </div>

            <div className="topbar-actions">
                {user ? (
                    <TopbarMenu items={menuItems} showProfile />
                ) : allowGuestLogin ? (
                    <div className="topbar-guest-actions">
                        <Link className="secondary-action" href="/">
                            Inicio
                        </Link>
                        <Link className="primary-action" href="/login">
                            Iniciar sesion
                        </Link>
                    </div>
                ) : (
                    <TopbarMenu items={menuItems} showProfile={false} />
                )}
            </div>
        </header>
    );
}
