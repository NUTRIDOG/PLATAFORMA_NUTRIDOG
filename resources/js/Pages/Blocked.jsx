import { Head, Link } from '@inertiajs/react';
import AppHero from '../Components/AppHero';
import AppNavbar from '../Components/AppNavbar';

export default function Blocked() {
    return (
        <div className="experience-shell">
            <Head title="Acceso bloqueado" />

            <AppNavbar
                title="Seguridad NutriDog"
                subtitle="Acceso restringido por politicas de la plataforma"
                menuItems={[
                    { href: '/', label: 'Inicio' },
                    { href: '/login', label: 'Iniciar sesion', tone: 'primary' },
                ]}
            />

            <AppHero
                eyebrow="Seguridad"
                title="Acceso bloqueado"
                titleClassName="page-title"
                description="La solicitud fue detenida por una regla de proteccion de la plataforma."
                shellClassName="app-hero-panel-page"
                sideClassName="app-hero-side-actions"
                supporting={
                    <>
                        <Link className="primary-action" href="/">
                            Volver al inicio
                        </Link>
                        <Link className="secondary-action" href="/login">
                            Ir al login
                        </Link>
                    </>
                }
            />
        </div>
    );
}
