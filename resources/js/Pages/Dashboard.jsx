import { Link, usePage } from '@inertiajs/react';
import { FiArrowRight, FiBookOpen, FiCopy, FiDownloadCloud, FiEyeOff, FiFeather, FiImage, FiLayers, FiLock, FiShield, FiUploadCloud, FiUsers } from 'react-icons/fi';
import AppNavbar from '../Components/AppNavbar';
import EbookCover from '../Components/EbookCover';
import SeoHead from '../Components/SeoHead';

const benefits = [
    {
        icon: FiUploadCloud,
        title: 'Publica mas rapido',
        copy: 'Convierte tus archivos en una experiencia lista para vender, con portada, estructura y presentacion profesional.',
    },
    {
        icon: FiShield,
        title: 'Protege tu contenido',
        copy: 'Controla accesos, conserva trazabilidad y entrega tus ebooks sin exponer el archivo original al usuario final.',
    },
    {
        icon: FiImage,
        title: 'Eleva el valor percibido',
        copy: 'Landing, biblioteca y lector trabajan juntos para que tu catalogo se vea premium, ordenado y confiable.',
    },
];

const operationBlocks = [
    { label: 'Gestion centralizada', detail: 'Administra ebooks, usuarios, accesos y paquetes desde un mismo lugar.' },
    { label: 'Lectura premium', detail: 'Entrega una experiencia comoda, clara y lista para retomar en cualquier momento.' },
    { label: 'Mas conversion', detail: 'Presenta tu catalogo con una imagen mas solida para vender mejor tu contenido.' },
];

const trustCaptions = {
    'Descarga directa': 'El archivo original no queda expuesto para descarga publica.',
    'Copiar o seleccionar': 'La lectura mantiene barreras visibles frente a usos no autorizados.',
    'Visibilidad fuera de foco': 'La interfaz reacciona para cuidar el contenido fuera de la sesion activa.',
    'Marca de agua': 'Cada acceso puede reforzar trazabilidad y control de distribucion.',
};

const trustIcons = {
    'Descarga directa': FiDownloadCloud,
    'Copiar o seleccionar': FiCopy,
    'Visibilidad fuera de foco': FiEyeOff,
    'Marca de agua': FiShield,
};

const ctaHighlights = [
    { icon: FiLayers, title: 'Catalogo mejor presentado', copy: 'Mas orden visual para impulsar el valor percibido.' },
    { icon: FiLock, title: 'Entrega mas segura', copy: 'Control de acceso y lectura protegida en una sola experiencia.' },
    { icon: FiUsers, title: 'Operacion lista para crecer', copy: 'Panel, biblioteca y reader conectados para tu flujo comercial.' },
];

const pipelineIcons = [FiUploadCloud, FiLock, FiBookOpen];

export default function Dashboard({ featured, ebooks = [], metrics = [], pipeline = [], security = [], seo = {} }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const canManage = roles.includes('admin') || roles.includes('editor');
    const library = Array.isArray(ebooks) ? ebooks : [];
    const featuredBook = featured ?? library[0];
    const showcaseBooks = library.slice(0, 3);
    const primaryCta = user ? '/library' : '/login';
    const primaryLabel = user ? 'Entrar a la biblioteca' : 'Iniciar sesion';
    const secondaryCta = featuredBook?.slug ? `/reader/${featuredBook.slug}` : '/login';

    return (
        <>
            <SeoHead seo={seo} />

            <div className="experience-shell landing-shell-pro">
                <AppNavbar
                    title="NutriDog Books"
                    subtitle={user ? `Sesion activa: ${user.name}` : 'Plataforma profesional para ebooks protegidos'}
                    menuItems={[
                        { href: user ? '/library' : '/login', label: user ? 'Biblioteca' : 'Acceder' },
                        ...(canManage ? [{ href: '/admin', label: 'Panel admin' }] : []),
                    ]}
                />

                <section className="landing-pro-hero glass-card">
                    <div className="landing-pro-copy">
                        <span className="eyebrow">Plataforma para infoproductos de mascotas</span>
                        <h1>Vende infoproductos para mascotas con una imagen que inspira confianza.</h1>
                        <p>
                            NutriDog te ayuda a presentar y entregar infoproductos sobre nutricion, bienestar, entrenamiento
                            y salud animal en una experiencia profesional: una landing que convierte, una biblioteca privada y
                            un lector protegido para tus contenidos premium.
                        </p>

                        <div className="landing-pro-actions">
                            <Link className="primary-action" href={primaryCta}>
                                {primaryLabel}
                            </Link>
                            <Link className="secondary-action" href={secondaryCta}>
                                Ver experiencia de lectura
                            </Link>
                        </div>

                        <div className="landing-proof-bar">
                            {metrics.slice(0, 4).map((metric) => (
                                <article className="landing-proof-pill" key={metric.label}>
                                    <strong>{metric.value}</strong>
                                    <span>{metric.label}</span>
                                </article>
                            ))}
                        </div>
                    </div>

                    <div className="landing-pro-visual">
                        <div className="landing-pro-visual-main">
                            <img src="/images/ebooks.webp" alt="Biblioteca de ebooks NutriDog" />
                        </div>

                        <div className="landing-pro-floating-card landing-pro-brand-card">
                            <img src="/images/logo.webp" alt="Logo NutriDog" />
                            <div>
                                <span className="featured-badge">Hecho para vender mejor</span>
                                <strong>Una plataforma que ordena, protege y realza tu contenido digital</strong>
                            </div>
                        </div>

                        <div className="landing-pro-floating-card landing-pro-featured-card">
                            <div className="landing-pro-featured-head">
                                <span className="section-subtitle">Ebook destacado</span>
                                <span className="rating-pill">{featuredBook?.protection ?? 'Protegido'}</span>
                            </div>
                            <strong>{featuredBook?.title ?? 'Guia NutriDog Premium'}</strong>
                            <p>{featuredBook?.description ?? 'Contenido premium con presentacion y acceso cuidado.'}</p>
                            <div className="book-inline-meta">
                                <span>{featuredBook?.access ?? 'De por vida'}</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="landing-pro-strip">
                    {operationBlocks.map((item) => (
                        <article className="landing-pro-strip-card" key={item.label}>
                            <span>{item.label}</span>
                            <p>{item.detail}</p>
                        </article>
                    ))}
                </section>

                <section className="landing-pro-grid">
                    <article className="glass-card content-card section-stack">
                        <div className="section-heading">
                            <span className="section-subtitle">Mas valor percibido</span>
                            <h2>La experiencia eleva tu marca incluso antes de que el lector abra el primer capitulo.</h2>
                        </div>

                        <div className="landing-benefit-grid">
                            {benefits.map((benefit) => {
                                const Icon = benefit.icon;

                                return (
                                <article className="landing-benefit-card" key={benefit.title}>
                                    <span className="landing-benefit-icon">
                                        <Icon aria-hidden="true" />
                                    </span>
                                    <div className="landing-benefit-copy">
                                        <strong>{benefit.title}</strong>
                                        <p>{benefit.copy}</p>
                                    </div>
                                </article>
                                );
                            })}
                        </div>
                    </article>

                    <article className="glass-card content-card section-stack">
                        <div className="section-heading">
                            <span className="section-subtitle">Operacion simple</span>
                            <h2>Publica, protege y entrega en un flujo claro, rapido y facil de operar.</h2>
                        </div>

                        <div className="pipeline-preview">
                            {pipeline.map((step, index) => {
                                const Icon = pipelineIcons[index] ?? FiFeather;

                                return (
                                    <article className="pipeline-card landing-step-card" key={step.title}>
                                        <div className="landing-step-head">
                                            <span>{String(index + 1).padStart(2, '0')}</span>
                                            <div className="landing-step-icon">
                                                <Icon aria-hidden="true" />
                                            </div>
                                        </div>
                                        <strong>{step.title}</strong>
                                        <p>{step.detail}</p>
                                    </article>
                                );
                            })}
                        </div>
                    </article>
                </section>

                <section className="glass-card content-card section-stack landing-showcase-panel">
                    <div className="section-heading landing-showcase-head">
                        <div>
                            <span className="section-subtitle">Catalogo con apariencia premium</span>
                            <h2>Presenta tus ebooks como productos digitales bien construidos, no como archivos sueltos</h2>
                        </div>
                        <Link className="secondary-action" href={user ? '/library' : '/login'}>
                            {user ? 'Ver biblioteca completa' : 'Entrar para ver catalogo'}
                        </Link>
                    </div>

                    <div className="landing-showcase-grid">
                        {showcaseBooks.map((book) => (
                            <article className="landing-showcase-card" key={book.id}>
                                <EbookCover
                                    className="landing-showcase-cover"
                                    imageUrl={book.cover_image_url}
                                    label={book.cover}
                                    title={book.title}
                                    subtitle={book.format}
                                    style={{
                                        '--cover-primary': book.primary_color,
                                        '--cover-secondary': book.secondary_color,
                                    }}
                                />

                                <div className="landing-showcase-content">
                                    <div className="book-topline">
                                        <span>{book.category}</span>
                                        <span className="rating-pill">{book.protection}</span>
                                    </div>
                                    <h3>{book.title}</h3>
                                    <p>{book.description}</p>
                                    <div className="book-inline-meta">
                                        <span>{book.source_type.toUpperCase()}</span>
                                        <span>{book.total_pages} paginas</span>
                                        <span>{book.progress}% leido</span>
                                    </div>
                                    <div className="book-footer">
                                        <div>
                                            <strong>{book.author}</strong>
                                            <span>{book.access}</span>
                                        </div>
                                        <Link className="book-action" href={user ? `/reader/${book.slug}` : '/login'}>
                                            {user ? 'Abrir' : 'Acceder'}
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="landing-pro-grid">
                    <article className="glass-card content-card section-stack">
                        <div className="section-heading">
                            <span className="section-subtitle">Confianza para el usuario</span>
                            <h2>La plataforma deja claro que tu contenido esta cuidado, protegido y bien gestionado.</h2>
                        </div>

                        <div className="security-list">
                            {security.map((item) => (
                                <article className="landing-trust-row" key={item.label}>
                                    <div className="landing-trust-icon">
                                        {(() => {
                                            const Icon = trustIcons[item.label] ?? FiShield;

                                            return <Icon aria-hidden="true" />;
                                        })()}
                                    </div>
                                    <div className="landing-trust-copy">
                                        <strong>{item.label}</strong>
                                        <p>{trustCaptions[item.label] ?? 'La plataforma aplica una regla visible para reforzar control y confianza.'}</p>
                                    </div>
                                    <span className="landing-trust-state">{item.state}</span>
                                </article>
                            ))}
                        </div>
                    </article>

                    <article className="landing-pro-cta glass-card">
                        <span className="eyebrow">Haz que tu catalogo se vea mejor</span>
                        <h2>Da el siguiente paso y presenta tus ebooks como una experiencia profesional de verdad.</h2>
                        <p>
                            Entra a la biblioteca para ver la experiencia del lector o usa el panel para publicar, organizar
                            y escalar un catalogo con mejor imagen comercial.
                        </p>

                        <div className="landing-cta-highlights">
                            {ctaHighlights.map(({ icon: Icon, title, copy }) => (
                                <article className="landing-cta-highlight" key={title}>
                                    <span className="landing-cta-highlight-icon">
                                        <Icon aria-hidden="true" />
                                    </span>
                                    <div>
                                        <strong>{title}</strong>
                                        <p>{copy}</p>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="landing-pro-actions">
                            <Link className="primary-action" href={primaryCta}>
                                <FiBookOpen aria-hidden="true" />
                                <span>{primaryLabel}</span>
                            </Link>
                            {canManage ? (
                                <Link className="secondary-action" href="/admin">
                                    <span>Ir al panel admin</span>
                                    <FiArrowRight aria-hidden="true" />
                                </Link>
                            ) : (
                                <Link className="secondary-action" href={secondaryCta}>
                                    <span>Abrir demo del lector</span>
                                    <FiArrowRight aria-hidden="true" />
                                </Link>
                            )}
                        </div>
                    </article>
                </section>
            </div>
        </>
    );
}
