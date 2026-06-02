import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function ForgotPassword() {
    const { status } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (event) => {
        event.preventDefault();
        post('/forgot-password');
    };

    return (
        <div className="storefront-shell auth-shell">
            <Head title="Recuperar contraseña" />

            <section className="glass-card auth-card auth-card-refined">
                <div className="auth-copy auth-copy--balanced auth-copy-refined">
                    <div className="auth-copy-head">
                        <span className="eyebrow">Recuperación segura</span>
                        <h1 className="app-title">NutriDog</h1>
                    </div>

                    <div className="auth-phrase-stage">
                        <div className="auth-phrase-badge">
                            <span className="promise-dot" />
                            <span>Acceso protegido para tu biblioteca</span>
                        </div>

                        <div className="auth-phrase-carousel">
                            <p className="auth-phrase-text">
                                Te enviaremos un enlace para restablecer tu contraseña y volver a tu contenido.
                            </p>
                        </div>
                    </div>
                </div>

                <form className="auth-form auth-panel auth-panel--raised auth-form-refined" onSubmit={submit}>
                    <div className="auth-panel-head">
                        <div className="auth-panel-brand">
                            <img src="/images/logo.webp" alt="Logo de NutriDog" />
                            <div>
                                <span className="section-subtitle">Recuperar acceso</span>
                                <strong>Enlace de restablecimiento</strong>
                            </div>
                        </div>
                        <h2>Recuperar contraseña</h2>
                        <p>Ingresa tu correo y te enviaremos un enlace para crear una nueva contraseña.</p>
                    </div>

                    {status ? <div className="auth-status">{status}</div> : null}

                    <label className="auth-field">
                        <span className="auth-label">Email</span>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(event) => setData('email', event.target.value)}
                            autoComplete="email"
                        />
                        <small className="auth-help">Usa el mismo correo con el que entras a la plataforma.</small>
                        {errors.email ? <small className="auth-error">{errors.email}</small> : null}
                    </label>

                    <div className="auth-footer-actions">
                        <button className="primary-action auth-submit" type="submit" disabled={processing}>
                            {processing ? 'Enviando...' : 'Enviar enlace'}
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
