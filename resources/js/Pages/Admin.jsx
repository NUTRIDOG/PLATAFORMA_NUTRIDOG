import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import AppHero from '../Components/AppHero';
import AppNavbar from '../Components/AppNavbar';
import EbookCover from '../Components/EbookCover';

const policyCards = [
    {
        title: 'Crea ebooks HTML',
        copy: 'Puedes escribir el contenido en el panel o subir un archivo .html para publicarlo como lectura interna.',
    },
    {
        title: 'Gestiona personas y accesos',
        copy: 'El admin crea usuarios, asigna roles y complementa permisos directos desde el mismo panel.',
    },
    {
        title: 'Arma combos editoriales',
        copy: 'Agrupa varios ebooks en un solo paquete comercial o tematico para publicar rutas de lectura.',
    },
];

const accessOptions = ['De por vida', 'Activo', 'Temporal', 'Premium', 'Expirado'];
const statusOptions = ['Activo', 'En progreso', 'Restringido'];
const categoryOptions = ['Nutricion avanzada', 'Recetas', 'Clinica', 'Entrenamiento', 'Bienestar', 'Cocina para mascotas'];

export default function Admin({
    metrics = [],
    events = [],
    uploads = [],
    security = [],
    pipeline = [],
    ebooks = [],
    editingItems = [],
    formDefaults,
    users = [],
    editingUsers = [],
    roleOptions = [],
    permissionOptions = [],
    userFormDefaults,
    combos = [],
    editingCombos = [],
    comboFormDefaults,
}) {
    const { auth, status } = usePage().props;
    const user = auth?.user;
    const timeline = Array.isArray(events) ? events : [];
    const queue = Array.isArray(uploads) ? uploads : [];
    const items = Array.isArray(ebooks) ? ebooks : [];
    const editable = Array.isArray(editingItems) ? editingItems : [];
    const managedUsers = Array.isArray(users) ? users : [];
    const editableUsers = Array.isArray(editingUsers) ? editingUsers : [];
    const managedCombos = Array.isArray(combos) ? combos : [];
    const editableCombos = Array.isArray(editingCombos) ? editingCombos : [];

    const ebookDefaults = formDefaults ?? {
        title: '',
        author: '',
        category: '',
        cover: '',
        access: 'De por vida',
        status: 'Activo',
        source_type: 'html',
        protection: 'Blindaje total',
        primary_color: '#4316FF',
        secondary_color: '#7CC21F',
        description: '',
        html_content: '',
        progress: 0,
        last_page: 1,
        total_pages: 1,
        offline: false,
        is_featured: false,
        cover_image_url: null,
    };

    const personDefaults = userFormDefaults ?? {
        name: '',
        email: '',
        password: '',
        roles: [],
        permissions: [],
    };

    const comboDefaults = comboFormDefaults ?? {
        title: '',
        description: '',
        access: 'Premium',
        status: 'Activo',
        ebook_ids: [],
    };

    const [editingId, setEditingId] = useState(null);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editingComboId, setEditingComboId] = useState(null);
    const [ebookFormKey, setEbookFormKey] = useState(0);
    const [userFormKey, setUserFormKey] = useState(0);
    const [comboFormKey, setComboFormKey] = useState(0);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState(null);

    const ebookForm = useForm({
        ...ebookDefaults,
        html_file: null,
        pdf_file: null,
        cover_image: null,
    });

    const userForm = useForm({
        ...personDefaults,
    });

    const comboForm = useForm({
        ...comboDefaults,
    });

    const fieldClass = (errors, name, base = '') => `${base} ${errors[name] ? 'is-invalid' : ''}`.trim();
    const toggleArrayValue = (values, value) => (values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value]);

    useEffect(() => {
        if (!(ebookForm.data.cover_image instanceof File)) {
            setCoverPreviewUrl(null);

            return undefined;
        }

        const nextPreviewUrl = URL.createObjectURL(ebookForm.data.cover_image);
        setCoverPreviewUrl(nextPreviewUrl);

        return () => URL.revokeObjectURL(nextPreviewUrl);
    }, [ebookForm.data.cover_image]);

    const resetEbookForm = () => {
        setEditingId(null);
        ebookForm.reset();
        ebookForm.setData({
            ...ebookDefaults,
            html_file: null,
            pdf_file: null,
            cover_image: null,
        });
        setEbookFormKey((value) => value + 1);
    };

    const resetUserForm = () => {
        setEditingUserId(null);
        userForm.reset();
        userForm.setData({ ...personDefaults });
        setUserFormKey((value) => value + 1);
    };

    const resetComboForm = () => {
        setEditingComboId(null);
        comboForm.reset();
        comboForm.setData({ ...comboDefaults });
        setComboFormKey((value) => value + 1);
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        ebookForm.setData({
            ...ebookDefaults,
            ...item,
            html_file: null,
            pdf_file: null,
            cover_image: null,
        });
        setEbookFormKey((value) => value + 1);
    };

    const startUserEdit = (item) => {
        if (!item) {
            return;
        }

        setEditingUserId(item.id);
        userForm.setData({
            ...personDefaults,
            ...item,
            password: '',
        });
        setUserFormKey((value) => value + 1);
    };

    const startComboEdit = (item) => {
        if (!item) {
            return;
        }

        setEditingComboId(item.id);
        comboForm.setData({
            ...comboDefaults,
            ...item,
        });
        setComboFormKey((value) => value + 1);
    };

    const submitEbook = (event) => {
        event.preventDefault();

        const url = editingId ? `/admin/ebooks/${editingId}` : '/admin/ebooks';

        ebookForm.post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success(editingId ? 'Ebook actualizado correctamente.' : 'Ebook creado correctamente.');
                resetEbookForm();
            },
            onError: () => {
                toast.error('No pudimos guardar el ebook. Revisa los campos del formulario.');
            },
        });
    };

    const submitUser = (event) => {
        event.preventDefault();

        const url = editingUserId ? `/admin/users/${editingUserId}` : '/admin/users';

        userForm.post(url, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(editingUserId ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
                resetUserForm();
            },
            onError: () => {
                toast.error('No pudimos guardar el usuario.');
            },
        });
    };

    const submitCombo = (event) => {
        event.preventDefault();

        const url = editingComboId ? `/admin/combos/${editingComboId}` : '/admin/combos';

        comboForm.post(url, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(editingComboId ? 'Combo actualizado correctamente.' : 'Combo creado correctamente.');
                resetComboForm();
            },
            onError: () => {
                toast.error('No pudimos guardar el combo.');
            },
        });
    };

    const destroyItem = (type, id, label) => {
        if (!window.confirm(`Esta accion eliminara ${label}. Deseas continuar?`)) {
            return;
        }

        router.delete(`/admin/${type}/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${label} eliminado correctamente.`);

                if (type === 'ebooks' && editingId === id) {
                    resetEbookForm();
                }

                if (type === 'users' && editingUserId === id) {
                    resetUserForm();
                }

                if (type === 'combos' && editingComboId === id) {
                    resetComboForm();
                }
            },
            onError: () => {
                toast.error(`No pudimos eliminar ${label.toLowerCase()}.`);
            },
        });
    };

    return (
        <div className="experience-shell admin-shell">
            <Head title="Panel admin" />

            <AppNavbar
                title="Consola editorial"
                subtitle={user ? `Gestionando como ${user.name}` : 'Zona restringida'}
                menuItems={[
                    { href: '/library', label: 'Ver biblioteca' },
                    { href: '/dashboard', label: 'Dashboard' },
                    { href: '/reader/guia-nutridog-premium', label: 'Probar lector', tone: 'primary' },
                ]}
            />

            <AppHero
                eyebrow="Operacion editorial"
                title="Publica, administra accesos y crea combos desde un mismo panel."
                description="El admin no solo mantiene ebooks: tambien controla usuarios, roles, permisos y paquetes editoriales listos para comercializar o asignar a una audiencia."
                shellClassName="app-hero-panel-page"
                sideClassName="app-hero-side-actions"
                supporting={
                    <>
                        <Link className="primary-action" href={items[0] ? `/reader/${items[0].slug}` : '/library'}>
                            Probar lector
                        </Link>
                        <Link className="secondary-action" href="/dashboard">
                            Volver al dashboard
                        </Link>
                    </>
                }
            />

            <section className="stats-band">
                {metrics.map((metric) => (
                    <article className="metric-card" key={metric.label}>
                        <span className="section-subtitle">{metric.label}</span>
                        <strong>{metric.value}</strong>
                        <p>{metric.detail}</p>
                    </article>
                ))}
            </section>

            <section className="admin-stack">
                <article className="glass-card content-card section-stack">
                    <div className="section-heading">
                        <span className="section-subtitle">Panel integral</span>
                        <h2>Lo que ahora puede gestionar el admin</h2>
                    </div>

                    {status ? <div className="admin-status-banner">{status}</div> : null}

                    <div className="pipeline-preview admin-policy-grid">
                        {policyCards.map((card) => (
                            <article className="pipeline-card" key={card.title}>
                                <strong>{card.title}</strong>
                                <p>{card.copy}</p>
                            </article>
                        ))}
                    </div>
                </article>

                <section className="admin-layout admin-layout-expanded">
                    <article className="glass-card content-card section-stack">
                        <div className="section-heading">
                            <span className="section-subtitle">Publicacion real</span>
                            <h2>{editingId ? 'Editar ebook' : 'Crear nuevo ebook'}</h2>
                        </div>

                        <form className="admin-form-grid" onSubmit={submitEbook} key={ebookFormKey}>
                            <div className="admin-field admin-field-span-2">
                                <label>Titulo</label>
                                <input
                                    className={fieldClass(ebookForm.errors, 'title')}
                                    value={ebookForm.data.title}
                                    onChange={(event) => ebookForm.setData('title', event.target.value)}
                                />
                                {ebookForm.errors.title ? <small className="auth-error">{ebookForm.errors.title}</small> : null}
                            </div>

                            <div className="admin-field">
                                <label>Autor</label>
                                <input
                                    className={fieldClass(ebookForm.errors, 'author')}
                                    value={ebookForm.data.author}
                                    onChange={(event) => ebookForm.setData('author', event.target.value)}
                                />
                                {ebookForm.errors.author ? <small className="auth-error">{ebookForm.errors.author}</small> : null}
                            </div>

                            <div className="admin-field">
                                <label>Categoria</label>
                                <select
                                    className={fieldClass(ebookForm.errors, 'category')}
                                    value={ebookForm.data.category}
                                    onChange={(event) => ebookForm.setData('category', event.target.value)}
                                >
                                    <option value="">Selecciona una categoria</option>
                                    {categoryOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                {ebookForm.errors.category ? <small className="auth-error">{ebookForm.errors.category}</small> : null}
                            </div>

                            <div className="admin-field">
                                <label>Formato de origen</label>
                                <select
                                    className={fieldClass(ebookForm.errors, 'source_type')}
                                    value={ebookForm.data.source_type}
                                    onChange={(event) => ebookForm.setData('source_type', event.target.value)}
                                >
                                    <option value="html">HTML / Ebook</option>
                                    <option value="pdf">PDF</option>
                                </select>
                            </div>

                            <div className="admin-field">
                                <label>Estado</label>
                                <select
                                    className={fieldClass(ebookForm.errors, 'status')}
                                    value={ebookForm.data.status}
                                    onChange={(event) => ebookForm.setData('status', event.target.value)}
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="admin-field">
                                <label>Acceso</label>
                                <select
                                    className={fieldClass(ebookForm.errors, 'access')}
                                    value={ebookForm.data.access}
                                    onChange={(event) => ebookForm.setData('access', event.target.value)}
                                >
                                    {accessOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="admin-field">
                                <label>Portada corta</label>
                                <input
                                    className={fieldClass(ebookForm.errors, 'cover')}
                                    value={ebookForm.data.cover}
                                    maxLength={8}
                                    onChange={(event) => ebookForm.setData('cover', event.target.value)}
                                />
                            </div>

                            <div className="admin-field">
                                <label>Imagen de portada</label>
                                <input
                                    className={fieldClass(ebookForm.errors, 'cover_image')}
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                    onChange={(event) => ebookForm.setData('cover_image', event.target.files[0])}
                                />
                                <small className="auth-help">
                                    {ebookForm.data.cover_image_url
                                        ? 'Ya hay una portada cargada. Puedes subir otra para reemplazarla en WebP comprimido.'
                                        : 'Opcional. Se convertira automaticamente a WebP y se mostrara en las cards del inicio y la biblioteca.'}
                                </small>
                                {ebookForm.errors.cover_image ? <small className="auth-error">{ebookForm.errors.cover_image}</small> : null}
                            </div>

                            <div className="admin-field admin-field-span-2">
                                <label>Vista previa de card</label>
                                <EbookCover
                                    className="admin-cover-preview"
                                    imageUrl={coverPreviewUrl ?? ebookForm.data.cover_image_url}
                                    label={ebookForm.data.cover || 'ND'}
                                    title={ebookForm.data.title || 'Nuevo ebook'}
                                    subtitle={ebookForm.data.source_type === 'pdf' ? 'PDF convertido' : 'HTML interactivo'}
                                    style={{
                                        '--cover-primary': ebookForm.data.primary_color,
                                        '--cover-secondary': ebookForm.data.secondary_color,
                                    }}
                                />
                            </div>

                            <div className="admin-field admin-field-span-2">
                                <label>Descripcion</label>
                                <textarea
                                    className={fieldClass(ebookForm.errors, 'description')}
                                    rows={4}
                                    value={ebookForm.data.description}
                                    onChange={(event) => ebookForm.setData('description', event.target.value)}
                                />
                            </div>

                            <div className="admin-field">
                                <label>Proteccion</label>
                                <input
                                    className={fieldClass(ebookForm.errors, 'protection')}
                                    value={ebookForm.data.protection}
                                    onChange={(event) => ebookForm.setData('protection', event.target.value)}
                                />
                            </div>

                            <div className="admin-field">
                                <label>Progreso</label>
                                <input
                                    className={fieldClass(ebookForm.errors, 'progress')}
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={ebookForm.data.progress}
                                    onChange={(event) => ebookForm.setData('progress', event.target.value)}
                                />
                            </div>

                            <div className="admin-field">
                                <label>Ultima pagina</label>
                                <input
                                    className={fieldClass(ebookForm.errors, 'last_page')}
                                    type="number"
                                    min="1"
                                    value={ebookForm.data.last_page}
                                    onChange={(event) => ebookForm.setData('last_page', event.target.value)}
                                />
                            </div>

                            <div className="admin-field">
                                <label>Total paginas</label>
                                <input
                                    className={fieldClass(ebookForm.errors, 'total_pages')}
                                    type="number"
                                    min="1"
                                    value={ebookForm.data.total_pages}
                                    disabled={ebookForm.data.source_type === 'pdf'}
                                    onChange={(event) => ebookForm.setData('total_pages', event.target.value)}
                                />
                            </div>

                            <div className="admin-field">
                                <label>Color principal</label>
                                <div className={fieldClass(ebookForm.errors, 'primary_color', 'color-input-shell')}>
                                    <span className="color-preview" style={{ backgroundColor: ebookForm.data.primary_color }} />
                                    <input
                                        className="color-input-native"
                                        type="color"
                                        value={ebookForm.data.primary_color}
                                        onChange={(event) => ebookForm.setData('primary_color', event.target.value)}
                                    />
                                    <span className="color-hex">{ebookForm.data.primary_color}</span>
                                </div>
                            </div>

                            <div className="admin-field">
                                <label>Color secundario</label>
                                <div className={fieldClass(ebookForm.errors, 'secondary_color', 'color-input-shell')}>
                                    <span className="color-preview" style={{ backgroundColor: ebookForm.data.secondary_color }} />
                                    <input
                                        className="color-input-native"
                                        type="color"
                                        value={ebookForm.data.secondary_color}
                                        onChange={(event) => ebookForm.setData('secondary_color', event.target.value)}
                                    />
                                    <span className="color-hex">{ebookForm.data.secondary_color}</span>
                                </div>
                            </div>

                            <div className="admin-toggle-row admin-field-span-2">
                                <label className="admin-toggle">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(ebookForm.data.offline)}
                                        onChange={(event) => ebookForm.setData('offline', event.target.checked)}
                                    />
                                    <span>Disponible offline</span>
                                </label>

                                <label className="admin-toggle">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(ebookForm.data.is_featured)}
                                        onChange={(event) => ebookForm.setData('is_featured', event.target.checked)}
                                    />
                                    <span>Marcar como destacado</span>
                                </label>
                            </div>

                            {ebookForm.data.source_type === 'html' ? (
                                <>
                                    <div className="admin-field admin-field-span-2">
                                        <label>Contenido HTML</label>
                                        <textarea
                                            className={fieldClass(ebookForm.errors, 'html_content')}
                                            rows={12}
                                            value={ebookForm.data.html_content}
                                            onChange={(event) => ebookForm.setData('html_content', event.target.value)}
                                        />
                                        <small className="auth-help">Puedes pegar HTML aqui o complementar con un archivo .html.</small>
                                    </div>

                                    <div className="admin-field admin-field-span-2">
                                        <label>Archivo HTML opcional</label>
                                        <input
                                            className={fieldClass(ebookForm.errors, 'html_file')}
                                            type="file"
                                            accept=".html,.htm,.txt"
                                            onChange={(event) => ebookForm.setData('html_file', event.target.files[0])}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="admin-field admin-field-span-2">
                                    <label>Archivo PDF</label>
                                    <input
                                        className={fieldClass(ebookForm.errors, 'pdf_file')}
                                        type="file"
                                        accept=".pdf"
                                        onChange={(event) => ebookForm.setData('pdf_file', event.target.files[0])}
                                    />
                                    <small className="auth-help">
                                        {ebookForm.data.file_name
                                            ? `Archivo actual: ${ebookForm.data.file_name}. Tamano maximo: 50 MB.`
                                            : 'Sube un PDF para convertirlo a lectura interna. Tamano maximo: 50 MB.'}
                                    </small>
                                </div>
                            )}

                            <div className="admin-form-actions admin-field-span-2">
                                <button className="primary-action" type="submit" disabled={ebookForm.processing}>
                                    {ebookForm.processing ? 'Guardando...' : editingId ? 'Actualizar ebook' : 'Crear ebook'}
                                </button>
                                <button className="secondary-action" type="button" onClick={resetEbookForm}>
                                    Limpiar formulario
                                </button>
                            </div>
                        </form>
                    </article>

                    <aside className="admin-side-stack">
                        <article className="glass-card content-card section-stack">
                            <div className="section-heading">
                                <span className="section-subtitle">Catalogo actual</span>
                                <h2>Ebooks creados</h2>
                            </div>

                            <div className="admin-ebook-list">
                                {editable.map((item) => {
                                    const liveBook = items.find((book) => book.id === item.id);

                                    return (
                                        <div className="admin-ebook-row" key={item.id}>
                                            <div className="admin-ebook-row-main">
                                                <EbookCover
                                                    className="admin-ebook-thumb"
                                                    imageUrl={liveBook?.cover_image_url ?? item.cover_image_url}
                                                    label={item.cover}
                                                    title={item.title}
                                                    subtitle={null}
                                                    style={{
                                                        '--cover-primary': liveBook?.primary_color ?? item.primary_color,
                                                        '--cover-secondary': liveBook?.secondary_color ?? item.secondary_color,
                                                    }}
                                                />
                                                <div>
                                                    <strong>{item.title}</strong>
                                                    <p>{item.source_type.toUpperCase()} / {item.status}</p>
                                                </div>
                                            </div>
                                            <div className="admin-mini-actions">
                                                <button className="secondary-action" type="button" onClick={() => startEdit(item)}>
                                                    Editar
                                                </button>
                                                {liveBook ? (
                                                    <Link className="secondary-action" href={`/reader/${liveBook.slug}`}>
                                                        Ver
                                                    </Link>
                                                ) : null}
                                                <button className="ghost-action" type="button" onClick={() => destroyItem('ebooks', item.id, 'el ebook')}>
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </article>

                        <article className="glass-card content-card section-stack">
                            <div className="section-heading">
                                <span className="section-subtitle">Archivos recientes</span>
                                <h2>Ultimos ingresos</h2>
                            </div>

                            <div className="queue-list">
                                {queue.map((item) => (
                                    <div className="queue-row" key={item.name}>
                                        <div>
                                            <strong>{item.name}</strong>
                                            <p>{item.audience}</p>
                                        </div>
                                        <div className="queue-meta">
                                            <span>{item.type}</span>
                                            <span>{item.stage}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </article>
                    </aside>
                </section>

                <section className="admin-layout admin-layout-expanded">
                    <article className="glass-card content-card section-stack">
                        <div className="section-heading">
                            <span className="section-subtitle">Usuarios y accesos</span>
                            <h2>{editingUserId ? 'Editar usuario' : 'Crear usuario'}</h2>
                        </div>

                        <form className="admin-form-grid" onSubmit={submitUser} key={userFormKey}>
                            <div className="admin-field">
                                <label>Nombre</label>
                                <input
                                    className={fieldClass(userForm.errors, 'name')}
                                    value={userForm.data.name}
                                    onChange={(event) => userForm.setData('name', event.target.value)}
                                />
                            </div>

                            <div className="admin-field">
                                <label>Email</label>
                                <input
                                    className={fieldClass(userForm.errors, 'email')}
                                    type="email"
                                    value={userForm.data.email}
                                    onChange={(event) => userForm.setData('email', event.target.value)}
                                />
                            </div>

                            <div className="admin-field admin-field-span-2">
                                <label>{editingUserId ? 'Password nueva (opcional)' : 'Password'}</label>
                                <input
                                    className={fieldClass(userForm.errors, 'password')}
                                    type="password"
                                    value={userForm.data.password}
                                    onChange={(event) => userForm.setData('password', event.target.value)}
                                />
                                {userForm.errors.password ? <small className="auth-error">{userForm.errors.password}</small> : null}
                            </div>

                            <div className="admin-field admin-field-span-2">
                                <label>Roles</label>
                                <div className="admin-choice-grid">
                                    {roleOptions.map((role) => (
                                        <label className="admin-switch-card" key={role}>
                                            <div className="admin-switch-copy">
                                                <strong>{role}</strong>
                                                <span>Activa este rol para el usuario.</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={userForm.data.roles.includes(role)}
                                                onChange={() => userForm.setData('roles', toggleArrayValue(userForm.data.roles, role))}
                                            />
                                            <span className="admin-switch-ui" aria-hidden="true">
                                                <span className="admin-switch-thumb" />
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="admin-field admin-field-span-2">
                                <label>Permisos directos</label>
                                <div className="admin-choice-grid">
                                    {permissionOptions.map((permission) => (
                                        <label className="admin-switch-card" key={permission}>
                                            <div className="admin-switch-copy">
                                                <strong>{permission}</strong>
                                                <span>Concede este permiso directo sin depender solo del rol.</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={userForm.data.permissions.includes(permission)}
                                                onChange={() =>
                                                    userForm.setData('permissions', toggleArrayValue(userForm.data.permissions, permission))
                                                }
                                            />
                                            <span className="admin-switch-ui" aria-hidden="true">
                                                <span className="admin-switch-thumb" />
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="admin-form-actions admin-field-span-2">
                                <button className="primary-action" type="submit" disabled={userForm.processing}>
                                    {userForm.processing ? 'Guardando...' : editingUserId ? 'Actualizar usuario' : 'Crear usuario'}
                                </button>
                                <button className="secondary-action" type="button" onClick={resetUserForm}>
                                    Limpiar formulario
                                </button>
                            </div>
                        </form>
                    </article>

                    <aside className="admin-side-stack">
                        <article className="glass-card content-card section-stack">
                            <div className="section-heading">
                                <span className="section-subtitle">Equipo actual</span>
                                <h2>Usuarios registrados</h2>
                            </div>

                            <div className="admin-ebook-list">
                                {managedUsers.map((person) => (
                                    <div className="admin-ebook-row" key={person.id}>
                                        <div>
                                            <strong>{person.name}</strong>
                                            <p>{person.email}</p>
                                            <div className="book-inline-meta">
                                                {(person.roles.length ? person.roles : ['reader']).map((role) => (
                                                    <span key={`${person.id}-${role}`}>{role}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="admin-mini-actions">
                                            <button className="secondary-action" type="button" onClick={() => startUserEdit(editableUsers.find((item) => item.id === person.id))}>
                                                Editar
                                            </button>
                                            <button
                                                className="ghost-action"
                                                type="button"
                                                disabled={person.email === user?.email}
                                                onClick={() => destroyItem('users', person.id, 'el usuario')}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </article>

                        <article className="glass-card content-card section-stack">
                            <div className="section-heading">
                                <span className="section-subtitle">Seguridad y actividad</span>
                                <h2>Contexto operativo</h2>
                            </div>

                            <div className="security-list">
                                {security.map((item) => (
                                    <div className="security-row" key={item.label}>
                                        <strong>{item.label}</strong>
                                        <span>{item.state}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="timeline promo-list">
                                {timeline.map((event, index) => (
                                    <div className="timeline-item promo-row" key={`${event.time}-${event.user}`}>
                                        <span className="timeline-time">{String(index + 1).padStart(2, '0')}</span>
                                        <div>
                                            <strong>{event.event}</strong>
                                            <p>{event.user} / {event.status}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </article>
                    </aside>
                </section>

                <section className="admin-layout admin-layout-expanded">
                    <article className="glass-card content-card section-stack">
                        <div className="section-heading">
                            <span className="section-subtitle">Combos de ebooks</span>
                            <h2>{editingComboId ? 'Editar combo' : 'Crear combo editorial'}</h2>
                        </div>

                        <form className="admin-form-grid" onSubmit={submitCombo} key={comboFormKey}>
                            <div className="admin-field">
                                <label>Titulo del combo</label>
                                <input
                                    className={fieldClass(comboForm.errors, 'title')}
                                    value={comboForm.data.title}
                                    onChange={(event) => comboForm.setData('title', event.target.value)}
                                />
                            </div>

                            <div className="admin-field">
                                <label>Acceso</label>
                                <select
                                    className={fieldClass(comboForm.errors, 'access')}
                                    value={comboForm.data.access}
                                    onChange={(event) => comboForm.setData('access', event.target.value)}
                                >
                                    {accessOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="admin-field">
                                <label>Estado</label>
                                <select
                                    className={fieldClass(comboForm.errors, 'status')}
                                    value={comboForm.data.status}
                                    onChange={(event) => comboForm.setData('status', event.target.value)}
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="admin-field admin-field-span-2">
                                <label>Descripcion</label>
                                <textarea
                                    className={fieldClass(comboForm.errors, 'description')}
                                    rows={4}
                                    value={comboForm.data.description}
                                    onChange={(event) => comboForm.setData('description', event.target.value)}
                                />
                            </div>

                            <div className="admin-field admin-field-span-2">
                                <label>Ebooks asociados</label>
                                <div className="admin-choice-grid admin-choice-grid-compact">
                                    {items.map((ebook) => (
                                        <label className="admin-switch-card" key={ebook.id}>
                                            <div className="admin-switch-copy">
                                                <strong>{ebook.title}</strong>
                                                <span>
                                                    {ebook.source_type.toUpperCase()} / {ebook.category || 'Catalogo general'}
                                                </span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={comboForm.data.ebook_ids.includes(ebook.id)}
                                                onChange={() =>
                                                    comboForm.setData('ebook_ids', toggleArrayValue(comboForm.data.ebook_ids, ebook.id))
                                                }
                                            />
                                            <span className="admin-switch-ui" aria-hidden="true">
                                                <span className="admin-switch-thumb" />
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                {comboForm.errors.ebook_ids ? <small className="auth-error">{comboForm.errors.ebook_ids}</small> : null}
                            </div>

                            <div className="admin-form-actions admin-field-span-2">
                                <button className="primary-action" type="submit" disabled={comboForm.processing}>
                                    {comboForm.processing ? 'Guardando...' : editingComboId ? 'Actualizar combo' : 'Crear combo'}
                                </button>
                                <button className="secondary-action" type="button" onClick={resetComboForm}>
                                    Limpiar formulario
                                </button>
                            </div>
                        </form>
                    </article>

                    <aside className="admin-side-stack">
                        <article className="glass-card content-card section-stack">
                            <div className="section-heading">
                                <span className="section-subtitle">Packs disponibles</span>
                                <h2>Combos editoriales</h2>
                            </div>

                            <div className="admin-ebook-list">
                                {managedCombos.map((combo) => (
                                    <div className="admin-ebook-row" key={combo.id}>
                                        <div>
                                            <strong>{combo.title}</strong>
                                            <p>{combo.ebook_count} ebooks / {combo.status}</p>
                                            <div className="book-inline-meta">
                                                {combo.ebooks.map((ebook) => (
                                                    <span key={`${combo.id}-${ebook.id}`}>{ebook.title}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="admin-mini-actions">
                                            <button
                                                className="secondary-action"
                                                type="button"
                                                onClick={() => startComboEdit(editableCombos.find((item) => item.id === combo.id))}
                                            >
                                                Editar
                                            </button>
                                            <button className="ghost-action" type="button" onClick={() => destroyItem('combos', combo.id, 'el combo')}>
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </article>

                        <article className="glass-card content-card section-stack">
                            <div className="section-heading">
                                <span className="section-subtitle">Flujo de publicacion</span>
                                <h2>Secuencia editorial</h2>
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
                    </aside>
                </section>
            </section>
        </div>
    );
}
