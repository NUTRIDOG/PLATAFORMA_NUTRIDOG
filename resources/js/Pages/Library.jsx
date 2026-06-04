import { Link, usePage } from '@inertiajs/react';
import AppHero from '../Components/AppHero';
import EbookCover from '../Components/EbookCover';
import AppNavbar from '../Components/AppNavbar';
import SeoHead from '../Components/SeoHead';

export default function Library({ ebooks = [], featured, pipeline = [], security = [], seo = {} }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const canManage = roles.includes('admin') || roles.includes('editor');
    const library = Array.isArray(ebooks) ? ebooks : [];
    const featuredBook = featured ?? library[0];
    const activeCount = library.filter((book) => book.status === 'Activo').length;
    const htmlCount = library.filter((book) => book.source_type === 'html').length;
    const pdfCount = library.filter((book) => book.source_type === 'pdf').length;

    return (
        <div className="experience-shell">
            <SeoHead seo={seo} />

            <AppNavbar
                title="Biblioteca NutriDog"
                subtitle={user ? `Rol activo: ${roles.join(' / ') || 'reader'}` : 'Catalogo privado de lectura'}
                menuItems={[
                    { href: '/dashboard', label: 'Dashboard' },
                    ...(canManage ? [{ href: '/admin', label: 'Gestionar publicaciones' }] : []),
                    { href: featured?.slug ? `/reader/${featured.slug}` : '/', label: 'Abrir destacado', tone: 'primary' },
                ]}
            />

            <AppHero
                eyebrow="Catalogo protegido"
                title="Una biblioteca que se siente como producto, no como carpeta de archivos."
                description="Cada item comunica su formato de origen, el modo de proteccion y el estado de lectura para que el usuario entienda rapido que esta frente a contenido premium."
                shellClassName="app-hero-panel-page"
                sideClassName="app-hero-side-summary"
                supporting={
                    <div className="hero-summary-card">
                        <div className="hero-summary-head">
                            <span className="featured-badge">Destacado ahora</span>
                            <strong>{featuredBook?.title ?? 'Guia NutriDog Premium'}</strong>
                            <p>
                                {featuredBook?.description ??
                                    'Contenido premium con progreso, proteccion y lectura inmersiva.'}
                            </p>
                        </div>

                        <div className="hero-summary-metrics">
                            <div>
                                <strong>{library.length}</strong>
                                <span>Ebooks</span>
                            </div>
                            <div>
                                <strong>{activeCount}</strong>
                                <span>Activos</span>
                            </div>
                            <div>
                                <strong>{htmlCount}</strong>
                                <span>HTML</span>
                            </div>
                            <div>
                                <strong>{pdfCount}</strong>
                                <span>PDF</span>
                            </div>
                        </div>

                        <div className="hero-summary-actions">
                            <Link className="primary-action" href={featuredBook?.slug ? `/reader/${featuredBook.slug}` : '/'}>
                                Abrir destacado
                            </Link>
                            <Link className="secondary-action" href="/dashboard">
                                Ir al dashboard
                            </Link>
                        </div>
                    </div>
                }
            />

            <section className="library-layout">
                <article className="glass-card content-card section-stack">
                    <div className="section-heading">
                        <span className="section-subtitle">Coleccion principal</span>
                        <h2>Lecturas disponibles</h2>
                    </div>

                    <div className="immersive-book-grid">
                        {library.length ? library.map((book) => (
                            <article className="immersive-book-card" key={book.id}>
                                <EbookCover
                                    className="immersive-cover"
                                    imageUrl={book.cover_image_url}
                                    label={book.cover}
                                    title={book.title}
                                    subtitle={book.format}
                                    style={{
                                        '--cover-primary': book.primary_color,
                                        '--cover-secondary': book.secondary_color,
                                    }}
                                />

                                <div className="immersive-book-content">
                                    <div className="book-topline">
                                        <span>{book.category}</span>
                                        <span className="rating-pill">{book.status}</span>
                                    </div>
                                    <h3>{book.title}</h3>
                                    <p>{book.description}</p>

                                    <div className="book-inline-meta">
                                        <span>{book.source_type.toUpperCase()}</span>
                                        <span>{book.total_pages} paginas</span>
                                        <span>{book.progress}% leido</span>
                                    </div>

                                    <div className="progress-bar" aria-hidden="true">
                                        <span style={{ width: `${book.progress}%` }} />
                                    </div>

                                    <div className="book-footer">
                                        <div>
                                            <strong>{book.author}</strong>
                                            <span>{book.protection}</span>
                                        </div>
                                        <Link className="book-action" href={`/reader/${book.slug}`}>
                                            Leer
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        )) : (
                            <article className="immersive-book-card immersive-book-card-empty">
                                <div className="immersive-book-content">
                                    <div className="book-topline">
                                        <span>Sin accesos todavia</span>
                                    </div>
                                    <h3>Tu biblioteca aparecera aqui cuando una compra sea aprobada.</h3>
                                    <p>Completa el checkout de un ebook y el sistema creara tu acceso automaticamente.</p>
                                    <div className="book-footer">
                                        <div>
                                            <strong>NutriDog</strong>
                                            <span>Embudo activo</span>
                                        </div>
                                        <Link className="book-action" href="/">
                                            Ver catalogo
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        )}
                    </div>
                </article>

                <aside className="library-sidebar">
                    <article className="glass-card content-card section-stack">
                        <div className="section-heading">
                            <span className="section-subtitle">Como fluye</span>
                            <h2>Del archivo al ebook</h2>
                        </div>

                        <div className="pipeline-preview">
                            {pipeline.map((step, index) => (
                                <article className="pipeline-card pipeline-card-compact" key={step.title}>
                                    <span>{String(index + 1).padStart(2, '0')}</span>
                                    <strong>{step.title}</strong>
                                    <p>{step.detail}</p>
                                </article>
                            ))}
                        </div>
                    </article>

                    <article className="glass-card content-card section-stack">
                        <div className="section-heading">
                            <span className="section-subtitle">Seguridad</span>
                            <h2>Señales visibles para el lector</h2>
                        </div>

                        <div className="security-list">
                            {security.map((item) => (
                                <div className="security-row" key={item.label}>
                                    <strong>{item.label}</strong>
                                    <span>{item.state}</span>
                                </div>
                            ))}
                        </div>
                    </article>
                </aside>
            </section>
        </div>
    );
}
