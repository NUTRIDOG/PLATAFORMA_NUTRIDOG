import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { HiArrowRight, HiBars3, HiOutlineArrowLeftOnRectangle, HiOutlineUserCircle, HiXMark } from 'react-icons/hi2';

const toneClass = {
    primary:
        'border-transparent bg-gradient-to-r from-indigo-600 via-violet-500 to-lime-400 text-white shadow-[0_18px_40px_rgba(79,70,229,0.28)] hover:from-indigo-500 hover:to-lime-300',
    muted:
        'border-slate-200/70 bg-white/60 text-slate-700 hover:border-slate-300 hover:bg-white',
    default:
        'border-slate-200/70 bg-white/70 text-slate-800 hover:border-slate-300 hover:bg-white',
};

export default function TopbarMenu({ items = [], showProfile = true }) {
    const { auth, url } = usePage().props;
    const user = auth?.user;
    const [isOpen, setIsOpen] = useState(false);

    const resolvedItems = useMemo(() => {
        const base = [...items];

        if (showProfile && user) {
            base.push({ href: '/profile', label: 'Perfil', tone: 'muted', icon: HiOutlineUserCircle });
        }

        return base;
    }, [items, showProfile, user]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        document.body.classList.toggle('overflow-hidden', isOpen);

        return () => {
            document.body.classList.remove('overflow-hidden');
        };
    }, [isOpen]);

    useEffect(() => {
        setIsOpen(false);
    }, [url]);

    const handleLogout = () => {
        setIsOpen(false);
        router.post('/logout');
    };

    return (
        <div className="topbar-menu-root relative">
            <button
                className={[
                    'topbar-menu-trigger',
                    'group inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200/80',
                    'bg-white/80 text-slate-800 shadow-[0_14px_35px_rgba(39,49,71,0.10)] backdrop-blur-xl transition-all duration-200',
                    'hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_18px_40px_rgba(39,49,71,0.14)]',
                    isOpen ? 'ring-2 ring-indigo-200' : '',
                ].join(' ')}
                type="button"
                aria-label="Abrir menu"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((current) => !current)}
            >
                <HiBars3 className="text-[1.35rem] transition-transform duration-200 group-hover:scale-110" />
            </button>

            <div
                className={[
                    'topbar-menu-backdrop',
                    isOpen ? 'is-visible' : '',
                ].join(' ')}
                onClick={() => setIsOpen(false)}
            />

            <aside
                className={[
                    'topbar-menu-panel',
                    isOpen ? 'is-open' : '',
                ].join(' ')}
                aria-hidden={!isOpen}
            >
                <div className="topbar-menu-panel-inner">
                    <div className="topbar-menu-head">
                        <div className="topbar-menu-profile flex min-w-0 items-center gap-3">
                            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-lime-400 font-['Space_Grotesk'] text-lg font-extrabold text-white shadow-[0_14px_30px_rgba(79,70,229,0.28)]">
                                {user?.name?.slice(0, 2)?.toUpperCase() ?? 'ND'}
                            </span>
                            <div className="min-w-0">
                                <strong className="block truncate font-['Space_Grotesk'] text-xl font-bold text-white">
                                    {user?.name ?? 'NutriDog'}
                                </strong>
                                <p className="truncate text-sm text-slate-400">{user?.email ?? 'Accesos y navegacion'}</p>
                            </div>
                        </div>

                        <button
                            className="topbar-menu-close inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-100 transition hover:bg-white/10"
                            type="button"
                            aria-label="Cerrar menu"
                            onClick={() => setIsOpen(false)}
                        >
                            <HiXMark className="text-[1.2rem]" />
                        </button>
                    </div>

                    <nav className="topbar-menu-nav">
                        {resolvedItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = url === item.href;

                            return (
                                <Link
                                    key={`${item.href}-${item.label}`}
                                    className={[
                                        'topbar-menu-link',
                                        'flex items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-sm font-extrabold transition-all duration-200',
                                        toneClass[item.tone] ?? toneClass.default,
                                        isActive ? 'ring-2 ring-white/20' : '',
                                    ].join(' ')}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="flex min-w-0 items-center gap-3">
                                        {Icon ? <Icon className="shrink-0 text-lg" /> : null}
                                        <span className="truncate">{item.label}</span>
                                    </span>
                                    <HiArrowRight className="shrink-0 text-lg opacity-80" />
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="topbar-menu-footer">
                        {user ? (
                            <button
                                className="topbar-menu-logout flex w-full items-center justify-between gap-3 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-4 text-sm font-extrabold text-rose-100 transition hover:bg-rose-400/15"
                                type="button"
                                onClick={handleLogout}
                            >
                                <span className="flex items-center gap-3">
                                    <HiOutlineArrowLeftOnRectangle className="text-lg" />
                                    <span>Cerrar sesion</span>
                                </span>
                            </button>
                        ) : (
                            <Link
                                className="topbar-menu-logout flex w-full items-center justify-between gap-3 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-4 text-sm font-extrabold text-rose-100 transition hover:bg-rose-400/15"
                                href="/login"
                                onClick={() => setIsOpen(false)}
                            >
                                <span className="flex items-center gap-3">
                                    <HiOutlineArrowLeftOnRectangle className="text-lg" />
                                    <span>Iniciar sesion</span>
                                </span>
                            </Link>
                        )}
                    </div>
                </div>
            </aside>
        </div>
    );
}
