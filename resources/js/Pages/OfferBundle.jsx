import { Link, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { FiBookOpen, FiCheckCircle, FiCreditCard, FiGift, FiRefreshCw, FiShield, FiStar, FiTarget, FiZap } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AppNavbar from '../Components/AppNavbar';
import EbookCover from '../Components/EbookCover';
import SeoHead from '../Components/SeoHead';

const FINAL_STATUSES = ['APPROVED', 'DECLINED', 'VOIDED', 'ERROR'];

export default function OfferBundle({ offer, purchase = null, wompi = {}, seo = {} }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const primaryBook = offer?.primaryBook;
    const giftBooks = Array.isArray(offer?.giftBooks) ? offer.giftBooks : [];
    const allBooks = Array.isArray(offer?.allBooks) ? offer.allBooks : [];
    const inventoryReady = Boolean(offer?.inventoryReady && primaryBook?.id);
    const checkoutUrl = offer?.ctaCheckoutUrl ?? (primaryBook?.slug ? `/ebooks/${primaryBook.slug}/checkout` : null);
    const syncCheckoutUrlTemplate = offer?.syncCheckoutUrlTemplate ?? (primaryBook?.slug ? `/ebooks/${primaryBook.slug}/checkout/__REFERENCE__/sync` : null);
    const trilogyBooks = useMemo(() => [primaryBook, ...giftBooks].filter(Boolean).slice(0, 3), [primaryBook, giftBooks]);
    const [form, setForm] = useState({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
    });
    const [purchaseState, setPurchaseState] = useState(purchase);
    const [errors, setErrors] = useState({});
    const [formMessage, setFormMessage] = useState(null);
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

    const hasAccess = allBooks.length > 0 && allBooks.every((book) => book.has_access);
    const bonusCount = Math.max(allBooks.length - 1, 0);

    const updateField = (key, value) => {
        setForm((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: null }));
        setFormMessage(null);
    };

    const validateForm = () => {
        const nextErrors = {};
        const normalizedEmail = String(form.email || '').trim();
        const normalizedPhone = String(form.phone || '').replace(/\D+/g, '');

        if (!String(form.name || '').trim()) {
            nextErrors.name = 'Escribe tu nombre.';
        }

        if (!normalizedEmail) {
            nextErrors.email = 'Escribe tu correo.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            nextErrors.email = 'Escribe un correo valido. Ejemplo: nombre@correo.com';
        }

        if (!normalizedPhone) {
            nextErrors.phone = 'Escribe tu celular.';
        } else if (normalizedPhone.length < 10) {
            nextErrors.phone = 'Escribe un celular valido de al menos 10 digitos.';
        }

        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            setFormMessage('Revisa los datos del formulario antes de continuar.');
            return false;
        }

        return true;
    };

    const syncPurchaseStatus = async (reference, transactionId) => {
        if (!syncCheckoutUrlTemplate) {
            toast.error('No encontramos la ruta para sincronizar la compra.');
            return null;
        }

        setIsRefreshing(true);

        try {
            const response = await window.axios.post(syncCheckoutUrlTemplate.replace('__REFERENCE__', reference), {
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
        if (!inventoryReady) {
            toast.error('Esta oferta aun no tiene un ebook real publicado en la base de datos.');
            return;
        }

        if (!checkoutUrl) {
            toast.error('No encontramos la ruta de checkout para esta oferta.');
            return;
        }

        if (!validateForm()) {
            toast.error('Revisa la informacion del formulario.');
            return;
        }

        setIsSubmitting(true);
        setErrors({});
        setFormMessage(null);

        try {
            const response = await window.axios.post(checkoutUrl, {
                ...form,
                grant_all_ebooks: true,
                offer_code: offer.offerCode,
            });

            const { checkout, purchase: createdPurchase } = response.data;
            setPurchaseState(createdPurchase);

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
                    toast.success('Pago aprobado. Ya tienes acceso a toda la biblioteca.');
                }
            });
        } catch (error) {
            if (error?.response?.status === 422) {
                setErrors(error.response.data.errors ?? {});
                setFormMessage(error.response.data.message ?? 'Revisa la informacion del formulario.');
                toast.error(error.response.data.message ?? 'Revisa la informacion del formulario.');
            } else {
                setFormMessage('No pudimos iniciar la oferta con Wompi en este momento.');
                toast.error('No pudimos iniciar la oferta con Wompi.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <SeoHead seo={seo} />

            <div className="experience-shell landing-shell-pro offer-bundle-shell offer-trilogy-shell offer-inline-shell">
                <AppNavbar
                    title="NutriDog Oferta"
                    subtitle="Landing inline de trilogía e infoproducto"
                    allowGuestLogin={false}
                    menuItems={[
                        { href: '/', label: 'Inicio' },
                        { href: hasAccess ? '/library' : '#bundle-checkout', label: hasAccess ? 'Ir a mi biblioteca' : 'Obtener oferta', tone: 'primary' },
                    ]}
                />

                <main className="offer-inline-flow">
                    <section className="offer-inline-hero">
                        <div className="offer-inline-lead">
                            <div className="offer-sales-badge">
                                <FiZap aria-hidden="true" />
                                <span>Oferta principal NutriDog</span>
                            </div>

                            <h1>Compra el libro principal y activa una trilogía con acceso de por vida.</h1>
                            <p>
                                El producto central es <strong>{primaryBook?.title}</strong>. Los otros libros entran como bonos para elevar el valor de la
                                oferta y hacer que la decisión de compra se sienta más redonda, más clara y más irresistible.
                            </p>

                            <div className="offer-inline-points">
                                <div><FiTarget aria-hidden="true" /> Un libro principal con foco comercial claro.</div>
                                <div><FiGift aria-hidden="true" /> {bonusCount} bonos incluidos para elevar el valor.</div>
                                <div><FiShield aria-hidden="true" /> Acceso de por vida a toda la biblioteca al finalizar la compra.</div>
                            </div>

                            <div className="offer-inline-hero-cta">
                                <div className="offer-inline-price">
                                    <small>Hoy pagas</small>
                                    <strong>{primaryBook?.price_display}</strong>
                                    <span>Libro principal + bonos + acceso vitalicio</span>
                                </div>

                                <a className="primary-action offer-main-cta" href="#bundle-checkout">
                                    <FiCreditCard aria-hidden="true" />
                                    <span>Obtener oferta</span>
                                </a>
                            </div>
                        </div>

                        <div className="offer-inline-visual">
                            <div className="offer-inline-product-frame">
                                <img src="/images/ebooks.webp" alt="Colección principal de ebooks NutriDog" />
                            </div>
                        </div>
                    </section>

                    <section className="offer-inline-marquee">
                        <span>Libro principal: {primaryBook?.title}</span>
                        <span>Bonos incluidos: {bonusCount}</span>
                        <span>Acceso final: Biblioteca de por vida</span>
                    </section>

                    <section className="glass-card content-card section-stack offer-inline-trilogy-shell">
                        <div className="offer-inline-section-head">
                            <span className="offer-sales-label">La colección</span>
                            <h2>Una oferta cerrada alrededor de 3 libros, con un producto principal y dos bonos que completan la propuesta.</h2>
                            <p>En vez de dejar piezas aisladas, la página ahora agrupa la trilogía como un solo bloque de valor para que la lectura sea más clara.</p>
                        </div>

                        <div className="offer-inline-trilogy">
                            {trilogyBooks.map((book, index) => (
                                <article className="offer-inline-book-row" key={book.id}>
                                    <div className="offer-inline-book-cover">
                                        <EbookCover
                                            className="offer-inline-cover"
                                            imageUrl={book.cover_image_url}
                                            label={book.cover}
                                            title={book.title}
                                            subtitle={null}
                                            style={{
                                                '--cover-primary': book.primary_color,
                                                '--cover-secondary': book.secondary_color,
                                            }}
                                        />
                                    </div>

                                    <div className="offer-inline-book-copy">
                                        <span className="offer-inline-tag">{index === 0 ? 'Libro principal' : `Bonus ${index}`}</span>
                                        <h2>{book.title}</h2>
                                        <p>{book.description}</p>
                                        <div className="book-inline-meta">
                                            <span>{book.category}</span>
                                            <span>{index === 0 ? 'Compra base' : 'Incluido'}</span>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="glass-card content-card section-stack offer-inline-story-shell">
                        <div className="offer-inline-story">
                            <div className="offer-inline-text-block">
                                <span className="offer-sales-label">La promesa</span>
                                <h2>Compras un solo libro con intención, pero recibes una solución más completa y una razón más fuerte para decir que sí.</h2>
                                <p>
                                    La página ya no está construida como módulos separados. Ahora el discurso corre en línea: promesa, producto, bonos, valor y cierre.
                                    Eso hace que el usuario sienta una venta más fluida, más parecida a una verdadera landing de infoproducto.
                                </p>
                            </div>

                            <div className="offer-inline-story-grid">
                                <article className="offer-inline-story-card">
                                    <strong>Por qué se entiende mejor</strong>
                                    <p>Todo gira sobre el libro principal, así que el usuario entiende rápido qué compra y qué recibe de extra.</p>
                                </article>
                                <article className="offer-inline-story-card">
                                    <strong>Por qué convierte mejor</strong>
                                    <p>Los bonos y el acceso vitalicio aparecen como una consecuencia natural de la compra, no como piezas sueltas.</p>
                                </article>
                            </div>
                        </div>

                        <div className="offer-inline-cta-band">
                            <div>
                                <strong>Una sola oferta. Un recorrido continuo.</strong>
                                <p>Así el libro principal sigue siendo el centro, mientras los bonos y el acceso de por vida refuerzan el cierre.</p>
                            </div>
                            <a className="primary-action offer-main-cta" href="#bundle-checkout">
                                <FiGift aria-hidden="true" />
                                <span>Obtener oferta</span>
                            </a>
                        </div>
                    </section>

                    <section className="offer-inline-checkout" id="bundle-checkout">
                        <div className="offer-inline-checkout-copy">
                            <span className="offer-sales-label">Call to action</span>
                            <h2>Obtén el libro principal, recibe los bonos y activa tu acceso vitalicio hoy.</h2>
                            <p>
                                Compras <strong>{primaryBook?.title}</strong> y, como parte de la oferta, activamos el resto del paquete con acceso permanente.
                            </p>

                            <div className="offer-inline-checkout-notes">
                                <div><FiBookOpen aria-hidden="true" /> Entras por un libro claro y bien definido.</div>
                                <div><FiGift aria-hidden="true" /> Te llevas una trilogía más acceso extendido.</div>
                                <div><FiShield aria-hidden="true" /> El acceso queda listo en una cuenta privada.</div>
                            </div>
                        </div>

                        <div className="offer-inline-checkout-panel">
                            {purchaseState ? (
                                <div className={`checkout-status-card status-${String(purchaseState.status || '').toLowerCase()}`}>
                                    <div className="checkout-status-head">
                                        <strong>Estado: {purchaseState.status}</strong>
                                        {purchaseState.offer_code ? <span>{purchaseState.offer_code}</span> : null}
                                    </div>
                                    <p>
                                        {purchaseState.status === 'APPROVED'
                                            ? 'Tu compra ya desbloqueó el libro principal, los bonos y el acceso vitalicio.'
                                            : purchaseState.status_message || 'Estamos sincronizando tu compra con Wompi.'}
                                    </p>

                                    {purchaseState.status === 'APPROVED' ? (
                                        <Link className="primary-action offer-main-cta" href={user ? '/library' : '/login'}>
                                            <FiCheckCircle aria-hidden="true" />
                                            <span>{user ? 'Entrar a mi biblioteca' : 'Iniciar sesión'}</span>
                                        </Link>
                                    ) : null}

                                    {!FINAL_STATUSES.includes(purchaseState.status) && purchaseState.reference ? (
                                        <button
                                            className="secondary-action"
                                            type="button"
                                            onClick={() => syncPurchaseStatus(purchaseState.reference, purchaseState.transaction_id)}
                                            disabled={isRefreshing}
                                        >
                                            <FiRefreshCw aria-hidden="true" />
                                            <span>{isRefreshing ? 'Actualizando...' : 'Actualizar estado'}</span>
                                        </button>
                                    ) : null}
                                </div>
                            ) : null}

                            {hasAccess ? (
                                <div className="checkout-success-box">
                                    <p>Tu cuenta ya tiene acceso a todos los ebooks incluidos en esta oferta.</p>
                                    <Link className="primary-action offer-main-cta" href="/library">
                                        <FiBookOpen aria-hidden="true" />
                                        <span>Abrir mi biblioteca</span>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="offer-checkout-price offer-sales-price-card offer-trilogy-price-card">
                                        <small>Oferta activa</small>
                                        <strong>{primaryBook?.price_display}</strong>
                                        <span>{primaryBook?.title} + {bonusCount} bonos + acceso de por vida</span>
                                    </div>

                                    <div className="offer-checkout-structured-layout">
                                        <div className="offer-checkout-form-shell">
                                            <div className="offer-checkout-section-head">
                                                <span>Completa tus datos</span>
                                                <strong>Reserva tu acceso en menos de un minuto</strong>
                                            </div>

                                            <div className="checkout-form-grid checkout-form-grid-structured">
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

                                                <label className="checkout-field checkout-field-full">
                                                    <span>Celular</span>
                                                    <input value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
                                                    {errors.phone ? <small className="auth-error">{errors.phone}</small> : null}
                                                </label>
                                            </div>

                                            {formMessage ? <p className="offer-checkout-warning">{formMessage}</p> : null}
                                        </div>

                                        <aside className="checkout-summary-box offer-summary-box-premium offer-summary-box-cards offer-summary-sidebar">
                                            <div className="offer-summary-card offer-summary-card-featured">
                                                <span>Compras hoy</span>
                                                <strong>{primaryBook?.title}</strong>
                                                <p>El libro principal que activa toda la oferta.</p>
                                            </div>
                                            <div className="offer-summary-card">
                                                <span>Desbloqueas</span>
                                                <strong>{bonusCount} bonos + acceso vitalicio</strong>
                                                <p>Recibes la coleccion completa dentro de tu cuenta.</p>
                                            </div>
                                        </aside>
                                    </div>

                                    <button
                                        className="primary-action checkout-submit offer-main-cta"
                                        type="button"
                                        disabled={!inventoryReady || !wompi?.enabled || !scriptReady || isSubmitting}
                                        onClick={openCheckout}
                                    >
                                        <FiCreditCard aria-hidden="true" />
                                        <span>
                                            {!inventoryReady
                                                ? 'Oferta en preparacion'
                                                : isSubmitting
                                                    ? 'Preparando checkout...'
                                                    : 'Obtener oferta'}
                                        </span>
                                    </button>

                                    <div className="offer-checkout-confidence-row">
                                        <div><FiShield aria-hidden="true" /> Pago seguro con Wompi</div>
                                        <div><FiStar aria-hidden="true" /> Acceso de por vida</div>
                                        <div><FiGift aria-hidden="true" /> Bonos incluidos al instante</div>
                                    </div>

                                    {!inventoryReady ? (
                                        <p className="offer-checkout-warning">
                                            Publica al menos un ebook activo en la base de datos para habilitar el checkout real de esta oferta.
                                        </p>
                                    ) : null}
                                </>
                            )}

                            <div className="offer-promise-list offer-sales-promise-list offer-promise-card">
                                <div><FiTarget aria-hidden="true" /> Libro principal con foco comercial</div>
                                <div><FiGift aria-hidden="true" /> Bonos alineados con la compra</div>
                                <div><FiShield aria-hidden="true" /> Acceso vitalicio como cierre final</div>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
