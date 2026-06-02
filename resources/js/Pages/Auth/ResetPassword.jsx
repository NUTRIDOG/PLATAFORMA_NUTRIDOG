import { Head, Link, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token,
        email: email ?? '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post('/reset-password');
    };

    return (
        <div className="storefront-shell auth-shell">
            <Head title="Restablecer contraseña" />

            <section className="glass-card auth-card auth-card-refined">
                <div className="auth-copy auth-copy--balanced auth-copy-refined">
                    <div className="auth-copy-head">
                        <span className="eyebrow">Nueva contraseña</span>
                        <h1 className="app-title">NutriDog</h1>
                    </div>

                    <div className="auth-phrase-stage">
                        <div className="auth-phrase-badge">
                            <span className="promise-dot" />
                            <span>Último paso para volver a entrar</span>
                        </div>

                        <div className="auth-phrase-carousel">
                            <p className="auth-phrase-text">
                                Define una nueva contraseña para retomar tu acceso al catálogo y a la biblioteca.
                            </p>
                        </div>
                    </div>
                </div>

                <form className="auth-form auth-panel auth-panel--raised auth-form-refined" onSubmit={submit}>
                    <div className="auth-panel-head">
                        <div className="auth-panel-brand">
                            <img src="/images/logo.webp" alt="Logo de NutriDog" />
                            <div>
                                <span className="section-subtitle">Actualización segura</span>
                                <strong>Restablecer acceso</strong>
                            </div>
                        </div>
                        <h2>Crear nueva contraseña</h2>
                        <p>Usa una contraseña segura para proteger tu acceso a la plataforma.</p>
                    </div>

                    <div className="auth-fields-grid">
                        <label className="auth-field">
                            <span className="auth-label">Email</span>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(event) => setData('email', event.target.value)}
                                autoComplete="email"
                            />
                            {errors.email ? <small className="auth-error">{errors.email}</small> : null}
                        </label>

                        <label className="auth-field">
                            <span className="auth-label">Nueva contraseña</span>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(event) => setData('password', event.target.value)}
                                autoComplete="new-password"
                            />
                            <small className="auth-help">Usa al menos 8 caracteres.</small>
                            {errors.password ? <small className="auth-error">{errors.password}</small> : null}
                        </label>

                        <label className="auth-field">
                            <span className="auth-label">Confirmar contraseña</span>
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(event) => setData('password_confirmation', event.target.value)}
                                autoComplete="new-password"
                            />
                            {errors.password_confirmation ? (
                                <small className="auth-error">{errors.password_confirmation}</small>
                            ) : null}
                        </label>
                    </div>

                    <div className="auth-footer-actions">
                        <button className="primary-action auth-submit" type="submit" disabled={processing}>
                            {processing ? 'Guardando...' : 'Guardar contraseña'}
                        </button>

                        <Link className="secondary-action auth-secondary auth-back" href="/login">
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
                            Volver al login
                        </Link>
                    </div>
                </form>
            </section>
        </div>
    );
}
