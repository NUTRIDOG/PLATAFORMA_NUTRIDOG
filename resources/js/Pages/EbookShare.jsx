import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { FiArrowRight, FiBookOpen, FiCheckCircle, FiCreditCard, FiRefreshCw, FiShare2, FiShield } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AppNavbar from '../Components/AppNavbar';
import EbookCover from '../Components/EbookCover';
import SeoHead from '../Components/SeoHead';

const FINAL_STATUSES = ['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'];

export default function EbookShare({ book, relatedBooks = [], purchase = null, wompi = {}, seo = {} }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [form, setForm] = useState({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
    });
    const [errors, setErrors] = useState({});
    const [purchaseState, setPurchaseState] = useState(purchase);
    const [scriptReady, setScriptReady] = useState(Boolean(window.WidgetCheckout));
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        setPurchaseState(purchase);
    }, [purchase]);

    useEffect(() => {
        if (window.WidgetCheckout) {
            setScriptReady(true);
            return undefined;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.wompi.co/widget.js';
        script.async = true;
        script.onload = () => setScriptReady(true);
        script.onerror = () => toast.error('No pudimos cargar el widget de Wompi.');
        document.head.appendChild(script);

        return () => {
            script.onload = null;
            script.onerror = null;
        };
    }, []);

    const hasAccess = Boolean(book?.has_access);
    const isApproved = purchaseState?.status === 'APPROVED';
    const canBuy = wompi?.enabled && !hasAccess;

    const updateField = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: null }));
    };

    const syncPurchaseStatus = async (reference, transactionId) => {
        setIsRefreshing(true);

        try {
            const response = await window.axios.post(`/ebooks/${book.slug}/checkout/${reference}/sync`, {
                transaction_id: transactionId,
            });

            setPurchaseState(response.data.purchase);
            return response.data.purchase;
        } catch (error) {
            toast.error(error?.response?.data?.message ?? 'No pudimos consultar el estado de la compra.');
            return null;
        } finally {
            setIsRefreshing(false);
        }
    };

    const openCheckout = async () => {
        setIsSubmitting(true);
        setErrors({});

        try {
            const response = await window.axios.post(`/ebooks/${book.slug}/checkout`, form);
            const { checkout, purchase: createdPurchase } = response.data;

            setPurchaseState(createdPurchase);

            if (!window.WidgetCheckout) {
                throw new Error('widget_not_ready');
            }

            const checkoutInstance = new window.WidgetCheckout({
                ...checkout,
                defaultLanguage: 'es',
            });

            checkoutInstance.open(async (result) => {
                const transactionId = result?.transaction?.id;

                if (!transactionId) {
                    return;
                }

                const updated = await syncPurchaseStatus(createdPurchase.reference, transactionId);

                if (updated?.status === 'APPROVED') {
                    toast.success('Pago aprobado. Revisa tu correo para entrar a la biblioteca.');
                } else if (updated?.status && FINAL_STATUSES.includes(updated.status)) {
                    toast.error(`La compra terminó en estado ${updated.status}.`);
                }
            });
        } catch (error) {
            if (error?.response?.status === 422) {
                setErrors(error.response.data.errors ?? {});
                toast.error(error.response.data.message ?? 'Revisa la informacion del formulario.');
            } else {
                toast.error('No pudimos iniciar el checkout con Wompi.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <SeoHead seo={seo} />

            <div className="experience-shell landing-shell-pro ebook-share-shell">
                <AppNavbar
                    title="NutriDog Books"
                    subtitle="Ficha publica con embudo de venta integrado"
                    allowGuestLogin={false}
                    menuItems={[
                        { href: '/', label: 'Inicio' },
                        { href: hasAccess ? `/reader/${book.slug}` : '#checkout', label: hasAccess ? 'Abrir ebook' : 'Comprar ahora', tone: 'primary' },
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
                        <span className="eyebrow">Ebook premium</span>
                        <h1>{book.title}</h1>
                        <p>{book.description}</p>

                        <div className="ebook-share-meta">
                            <span>{book.category}</span>
                            <span>{book.access || 'Acceso de por vida'}</span>
                            <span>{book.protection}</span>
                        </div>

                        <div className="funnel-price-row">
                            <div>
                                <strong>{book.price_display}</strong>
                                <span>Pago unico en COP</span>
                            </div>
                            <div className="funnel-price-chip">
                                <FiShield aria-hidden="true" />
                                <span>Acceso protegido</span>
                            </div>
                        </div>

                        <div className="landing-pro-actions ebook-share-actions">
                            <Link className="primary-action" href={hasAccess ? `/reader/${book.slug}` : '#checkout'}>
                                <FiBookOpen aria-hidden="true" />
                                <span>{hasAccess ? 'Abrir en la biblioteca' : 'Ir al checkout'}</span>
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
                                    <strong>Acceso privado</strong>
                                    <p>Si la compra es aprobada, se crea tu usuario y el ebook queda habilitado en tu biblioteca.</p>
                                </div>
                            </article>
                            <article className="landing-cta-highlight">
                                <span className="landing-cta-highlight-icon">
                                    <FiArrowRight aria-hidden="true" />
                                </span>
                                <div>
                                    <strong>Entrega automatica</strong>
                                    <p>Recibes por correo tu usuario y password para entrar a leer de inmediato.</p>
                                </div>
                            </article>
                        </div>
                    </div>
                </section>

                <section className="funnel-layout" id="checkout">
                    <article className="glass-card content-card section-stack funnel-sales-card">
                        <div className="section-heading">
                            <span className="section-subtitle">Lo que te llevas</span>
                            <h2>Un acceso inmediato al ebook dentro de la plataforma</h2>
                        </div>

                        <div className="funnel-benefits">
                            <div className="funnel-benefit">
                                <strong>1. Compra guiada</strong>
                                <p>Capturamos tus datos antes del pago para asociar la compra al acceso correcto.</p>
                            </div>
                            <div className="funnel-benefit">
                                <strong>2. Checkout con Wompi</strong>
                                <p>Abres el widget sin salir del sitio y Wompi procesa el medio de pago disponible.</p>
                            </div>
                            <div className="funnel-benefit">
                                <strong>3. Usuario creado automaticamente</strong>
                                <p>Cuando Wompi confirma el pago, se crea el usuario con rol <code>reader</code> y se asigna el ebook.</p>
                            </div>
                        </div>
                    </article>

                    <aside className="glass-card content-card section-stack funnel-checkout-card">
                        <div className="section-heading">
                            <span className="section-subtitle">Checkout</span>
                            <h2>{hasAccess ? 'Ya tienes acceso' : 'Completa tus datos para pagar'}</h2>
                        </div>

                        {purchaseState ? (
                            <div className={`checkout-status-card status-${String(purchaseState.status || '').toLowerCase()}`}>
                                <div className="checkout-status-head">
                                    <strong>Estado: {purchaseState.status}</strong>
                                    {purchaseState.transaction_id ? <span>Tx {purchaseState.transaction_id}</span> : null}
                                </div>
                                <p>{purchaseState.status_message || 'Estamos sincronizando la respuesta de Wompi con tu acceso.'}</p>

                                {purchaseState.status === 'APPROVED' ? (
                                    <div className="checkout-status-actions">
                                        <Link className="primary-action" href={user ? '/library' : '/login'}>
                                            <FiCheckCircle aria-hidden="true" />
                                            <span>{user ? 'Ir a mi biblioteca' : 'Iniciar sesion'}</span>
                                        </Link>
                                    </div>
                                ) : null}

                                {!FINAL_STATUSES.includes(purchaseState.status) && purchaseState.reference ? (
                                    <div className="checkout-status-actions">
                                        <button
                                            className="secondary-action"
                                            type="button"
                                            onClick={() => syncPurchaseStatus(purchaseState.reference, purchaseState.transaction_id)}
                                            disabled={isRefreshing}
                                        >
                                            <FiRefreshCw aria-hidden="true" />
                                            <span>{isRefreshing ? 'Actualizando...' : 'Actualizar estado'}</span>
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        {hasAccess ? (
                            <div className="checkout-success-box">
                                <p>Este ebook ya esta asociado a tu cuenta.</p>
                                <Link className="primary-action" href={`/reader/${book.slug}`}>
                                    <FiBookOpen aria-hidden="true" />
                                    <span>Leer ahora</span>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="checkout-form-grid">
                                    <label className="checkout-field">
                                        <span>Nombre</span>
                                        <input value={form.name} onChange={(event) => updateField('name', event.target.value)} />
                                        {errors.name ? <small className="auth-error">{errors.name}</small> : null}
                                    </label>

                                    <label className="checkout-field">
                                        <span>Correo</span>
                                        <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
                                        {errors.email ? <small className="auth-error">{errors.email}</small> : null}
                                    </label>

                                    <label className="checkout-field">
                                        <span>Celular</span>
                                        <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
                                        {errors.phone ? <small className="auth-error">{errors.phone}</small> : null}
                                    </label>
                                </div>

                                <div className="checkout-summary-box">
                                    <div>
                                        <strong>{book.title}</strong>
                                        <span>{book.price_display}</span>
                                    </div>
                                    <div>
                                        <span>Rol asignado</span>
                                        <strong>reader</strong>
                                    </div>
                                </div>

                                <button
                                    className="primary-action checkout-submit"
                                    type="button"
                                    disabled={!canBuy || !scriptReady || isSubmitting}
                                    onClick={openCheckout}
                                >
                                    <FiCreditCard aria-hidden="true" />
                                    <span>
                                        {isSubmitting
                                            ? 'Preparando checkout...'
                                            : !wompi?.enabled
                                              ? 'Configura Wompi para vender'
                                              : 'Pagar con Wompi'}
                                    </span>
                                </button>

                                <p className="checkout-help">
                                    Al aprobarse el pago, se crea tu usuario, se asigna el ebook y recibes credenciales por correo.
                                </p>
                            </>
                        )}
                    </aside>
                </section>

                {relatedBooks.length ? (
                    <section className="glass-card content-card section-stack landing-showcase-panel">
                        <div className="section-heading landing-showcase-head">
                            <div>
                                <span className="section-subtitle">Tambien te puede interesar</span>
                                <h2>Mas infoproductos de mascotas para seguir vendiendo mejor</h2>
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
                                            <span>{item.price_display}</span>
                                        </div>
                                        <div className="book-footer">
                                            <div>
                                                <strong>{item.author}</strong>
                                                <span>NutriDog</span>
                                            </div>
                                            <Link className="book-action" href={item.share_url}>
                                                Ver ficha publica
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
