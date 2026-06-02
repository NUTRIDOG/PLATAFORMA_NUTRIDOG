import { Link, usePage } from '@inertiajs/react';
import { FiArrowRight, FiBookOpen, FiShare2, FiShield } from 'react-icons/fi';
import AppNavbar from '../Components/AppNavbar';
import EbookCover from '../Components/EbookCover';
import SeoHead from '../Components/SeoHead';

export default function EbookShare({ book, relatedBooks = [], seo = {} }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    return (
        <>
            <SeoHead seo={seo} />

            <div className="experience-shell landing-shell-pro ebook-share-shell">
                <AppNavbar
                    title="NutriDog Books"
                    subtitle="Vista pública para compartir este ebook"
                    allowGuestLogin={false}
                    menuItems={[
                        { href: '/', label: 'Inicio' },
                        { href: user ? `/reader/${book.slug}` : '/login', label: user ? 'Abrir ebook' : 'Acceder', tone: 'primary' },
                    ]}
                />

                <section className="ebook-share-hero glass-card">
                    <div className="ebook-share-cover-wrap">
                        <EbookCover
                            className="ebook-share-cover"
                            imageUrl={book.cover_image_url}
                            label={book.cover}
                            title={book.title}
                            subtitle={book.format}
                            style={{
                                '--cover-primary': book.primary_color,
                                '--cover-secondary': book.secondary_color,
                            }}
                        />
                    </div>

                    <div className="ebook-share-copy">
                        <span className="eyebrow">Ebook para compartir</span>
                        <h1>{book.title}</h1>
                        <p>{book.description}</p>

                        <div className="ebook-share-meta">
                            <span>{book.category}</span>
                            <span>{book.access || 'Acceso de por vida'}</span>
                            <span>{book.protection}</span>
                        </div>

                        <div className="landing-pro-actions ebook-share-actions">
                            <Link className="primary-action" href={user ? `/reader/${book.slug}` : '/login'}>
                                <FiBookOpen aria-hidden="true" />
                                <span>{user ? 'Abrir en la biblioteca' : 'Iniciar sesión para acceder'}</span>
                            </Link>
                            <a className="secondary-action" href={book.share_url}>
                                <FiShare2 aria-hidden="true" />
                                <span>Compartir este enlace</span>
                            </a>
                        </div>

                        <div className="landing-cta-highlights ebook-share-highlights">
                            <article className="landing-cta-highlight">
                                <span className="landing-cta-highlight-icon">
                                    <FiShield aria-hidden="true" />
                                </span>
                                <div>
                                    <strong>Presentación profesional</strong>
                                    <p>Una ficha pública lista para redes, mensajes y campañas.</p>
                                </div>
                            </article>
                            <article className="landing-cta-highlight">
                                <span className="landing-cta-highlight-icon">
                                    <FiArrowRight aria-hidden="true" />
                                </span>
                                <div>
                                    <strong>Acceso claro</strong>
                                    <p>Comparte el ebook y lleva al lector a una experiencia cuidada.</p>
                                </div>
                            </article>
                        </div>
                    </div>
                </section>

                {relatedBooks.length ? (
                    <section className="glass-card content-card section-stack landing-showcase-panel">
                        <div className="section-heading landing-showcase-head">
                            <div>
                                <span className="section-subtitle">También te puede interesar</span>
                                <h2>Más infoproductos de mascotas para compartir y presentar mejor</h2>
                            </div>
                        </div>

                        <div className="landing-showcase-grid">
                            {relatedBooks.map((item) => (
                                <article className="landing-showcase-card" key={item.id}>
                                    <EbookCover
                                        className="landing-showcase-cover"
                                        imageUrl={item.cover_image_url}
                                        label={item.cover}
                                        title={item.title}
                                        subtitle={item.format}
                                        style={{
                                            '--cover-primary': item.primary_color,
                                            '--cover-secondary': item.secondary_color,
                                        }}
                                    />

                                    <div className="landing-showcase-content">
                                        <div className="book-topline">
                                            <span>{item.category}</span>
                                            <span className="rating-pill">{item.protection}</span>
                                        </div>
                                        <h3>{item.title}</h3>
                                        <p>{item.description}</p>
                                        <div className="book-inline-meta">
                                            <span>{item.access || 'Acceso de por vida'}</span>
                                        </div>
                                        <div className="book-footer">
                                            <div>
                                                <strong>{item.author}</strong>
                                                <span>NutriDog</span>
                                            </div>
                                            <Link className="book-action" href={item.share_url}>
                                                Ver ficha pública
                                            </Link>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                ) : null}
            </div>
        </>
    );
}
