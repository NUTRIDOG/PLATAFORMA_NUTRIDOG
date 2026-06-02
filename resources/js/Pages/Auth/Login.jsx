import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const loginMoments = [
    'Leer también es una forma de cuidar mejor a tu perro.',
    'Cada guía puede convertirse en una rutina más sana para tu mascota.',
    'Conocimiento práctico para quienes aman, cuidan y educan con conciencia.',
    'Tus ebooks pueden acompañar mejores hábitos para perros felices y saludables.',
];

export default function Login() {
    const { auth, status } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        email: 'admin@nutridog.test',
        password: 'password',
        remember: true,
    });
    const [phraseIndex, setPhraseIndex] = useState(0);

    const user = auth?.user;

    if (user) {
        router.visit('/dashboard');
        return null;
    }

    useEffect(() => {
        const timer = window.setInterval(() => {
            setPhraseIndex((current) => (current + 1) % loginMoments.length);
        }, 2800);

        return () => window.clearInterval(timer);
    }, []);

    const submit = (event) => {
        event.preventDefault();
        post('/login');
    };

    return (
        <div className="storefront-shell auth-shell">
            <Head title="Iniciar sesión" />

            <section className="glass-card auth-card auth-card-refined">
                <div className="auth-copy auth-copy--balanced auth-copy-refined">
                    <div className="auth-copy-head">
                        <span className="eyebrow">Acceso privado</span>
                        <h1 className="app-title">NutriDog</h1>
                    </div>

                    <div className="auth-phrase-stage" aria-live="polite">
                        <div className="auth-phrase-badge">
                            <span className="promise-dot" />
                            <span>Lectores y amantes de los perros</span>
                        </div>

                        <div className="auth-phrase-carousel">
                            <p className="auth-phrase-text" key={phraseIndex}>
                                {loginMoments[phraseIndex]}
                            </p>
                        </div>

                        <div className="auth-phrase-dots" aria-hidden="true">
                            {loginMoments.map((phrase, index) => (
                                <span className={index === phraseIndex ? 'is-active' : ''} key={phrase} />
                            ))}
                        </div>
                    </div>
                </div>

                <form className="auth-form auth-panel auth-panel--raised auth-form-refined" onSubmit={submit}>
                    <div className="auth-panel-head">
                        <div className="auth-panel-brand">
                            <img src="/images/logo.webp" alt="Logo de NutriDog" />
                            <div>
                                <span className="section-subtitle">Inicio de sesión</span>
                                <strong>Acceso NutriDog</strong>
                            </div>
                        </div>
                        <h2>Entrar a NutriDog</h2>
                        <p>Accede al catálogo y al panel con una distribución más clara y mejor repartida.</p>
                    </div>

                    {status ? <div className="auth-status">{status}</div> : null}

                    <div className="auth-fields-grid">
                        <label className="auth-field">
                            <span className="auth-label">Email</span>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                autoComplete="email"
                            />
                            <small className="auth-help">Usa el correo asignado a tu cuenta de acceso.</small>
                            {errors.email ? <small className="auth-error">{errors.email}</small> : null}
                        </label>

                        <label className="auth-field">
                            <span className="auth-label">Contraseña</span>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                autoComplete="current-password"
                            />
                            <small className="auth-help">La contraseña distingue mayúsculas y minúsculas.</small>
                            {errors.password ? <small className="auth-error">{errors.password}</small> : null}
                        </label>
                    </div>

                    <div className="auth-footer-actions">
                        <div className="auth-actions-row">
                            <label className="auth-remember">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(event) => setData('remember', event.target.checked)}
                                />
                                <span>Recordarme</span>
                            </label>

                            <Link className="auth-forgot" href="/forgot-password">
                                Olvidé mi contraseña
                            </Link>
                        </div>

                        <button className="primary-action auth-submit" type="submit" disabled={processing}>
                            {processing ? 'Entrando...' : 'Entrar'}
                        </button>

                        <Link className="secondary-action auth-secondary auth-back" href="/">
                            <svg className="back-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                                <path
                                    d="M11.5 4.5L6 10l5.5 5.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            Volver a la landing
                        </Link>

                        <p className="auth-footer-note">
                            Si eres admin, después del login verás el panel y las acciones de gestión.
                        </p>
                    </div>
                </form>
            </section>
        </div>
    );
}
