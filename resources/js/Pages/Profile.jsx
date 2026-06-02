import { Head, Link, usePage } from '@inertiajs/react';
import AppHero from '../Components/AppHero';
import AppNavbar from '../Components/AppNavbar';

export default function Profile() {
    const { auth } = usePage().props;
    const user = auth?.user;
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const permissions = Array.isArray(user?.permissions) ? user.permissions : [];

    return (
        <div className="experience-shell">
            <Head title="Perfil" />

            <AppNavbar
                title="Perfil de usuario"
                subtitle={user ? `${user.name} / ${user.email}` : 'Cuenta de la plataforma'}
                menuItems={[
                    { href: '/dashboard', label: 'Dashboard' },
                    { href: '/library', label: 'Biblioteca', tone: 'primary' },
                ]}
            />

            <section className="glass-card profile-shell">
                <AppHero
                    eyebrow="Perfil"
                    title="Tu cuenta en NutriDog"
                    description="Consulta tu informacion, roles activos y los permisos con los que navegas dentro de la plataforma."
                    shellClassName="app-hero-panel-profile"
                    contentClassName="app-hero-main-profile"
                    sideClassName="app-hero-side-profile"
                    supporting={
                        <>
                            <div className="profile-hero-card">
                                <span className="brand-mark">ND</span>
                                <div>
                                    <strong>{user?.name ?? 'Usuario NutriDog'}</strong>
                                    <p>{user?.email ?? 'Sin email registrado'}</p>
                                </div>
                            </div>

                            <div className="profile-hero-stats">
                                <div>
                                    <strong>{roles[0] ?? 'reader'}</strong>
                                    <span>Rol principal</span>
                                </div>
                                <div>
                                    <strong>{permissions.length}</strong>
                                    <span>Permisos activos</span>
                                </div>
                            </div>
                        </>
                    }
                    actions={
                        <>
                            <Link className="secondary-action" href="/dashboard">
                                Volver al dashboard
                            </Link>
                            <Link className="primary-action" href="/library">
                                Ir a biblioteca
                            </Link>
                        </>
                    }
                />

                <div className="profile-grid">
                    <article className="glass-card content-card section-stack">
                        <div className="section-heading">
                            <span className="section-subtitle">Cuenta</span>
                            <h2>Informacion principal</h2>
                        </div>

                        <div className="profile-list">
                            <div className="profile-row">
                                <strong>Nombre</strong>
                                <span>{user?.name ?? 'Sin nombre'}</span>
                            </div>
                            <div className="profile-row">
                                <strong>Email</strong>
                                <span>{user?.email ?? 'Sin email'}</span>
                            </div>
                            <div className="profile-row">
                                <strong>Rol principal</strong>
                                <span>{roles[0] ?? 'reader'}</span>
                            </div>
                        </div>
                    </article>

                    <article className="glass-card content-card section-stack">
                        <div className="section-heading">
                            <span className="section-subtitle">Accesos</span>
                            <h2>Roles y permisos</h2>
                        </div>

                        <div className="chip-row">
                            {roles.map((role) => (
                                <span className="chip" key={role}>
                                    {role}
                                </span>
                            ))}
                            {!roles.length ? <span className="chip">reader</span> : null}
                        </div>

                        <div className="profile-permissions">
                            {permissions.map((permission) => (
                                <div className="profile-permission" key={permission}>
                                    {permission}
                                </div>
                            ))}
                        </div>
                    </article>
                </div>

            </section>
        </div>
    );
}
