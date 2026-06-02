import { Link, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { toast } from 'react-hot-toast';
import AppNavbar from '../Components/AppNavbar';
import SeoHead from '../Components/SeoHead';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function Reader({ selected, chapters = [], security = [], readerPages = [], seo = {} }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    const canManage = roles.includes('admin') || roles.includes('editor');
    const chapterList = Array.isArray(chapters) ? chapters : [];
    const securityList = Array.isArray(security) ? security : [];
    const pages = Array.isArray(readerPages) ? readerPages : [];
    const [shieldMessage, setShieldMessage] = useState('');
    const [isBlurred, setIsBlurred] = useState(false);
    const [pdfPageCount, setPdfPageCount] = useState(0);
    const [pdfError, setPdfError] = useState('');
    const [pdfLoading, setPdfLoading] = useState(false);
    const [readingProgress, setReadingProgress] = useState(selected?.progress ?? 0);
    const [lastReadPage, setLastReadPage] = useState(selected?.last_page ?? 1);
    const [navigationItems, setNavigationItems] = useState([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [viewportTick, setViewportTick] = useState(0);
    const canvasRefs = useRef([]);
    const htmlSurfaceRef = useRef(null);
    const pdfListRef = useRef(null);
    const progressTimerRef = useRef(null);
    const htmlHeadingRefs = useRef([]);
    const lastSentProgressRef = useRef({
        progress: selected?.progress ?? 0,
        last_page: selected?.last_page ?? 1,
    });

    const persistProgress = (nextProgress, nextPage) => {
        if (!selected?.progress_endpoint) {
            return;
        }

        const normalizedProgress = Math.max(0, Math.min(100, Math.round(nextProgress)));
        const normalizedPage = Math.max(1, Math.round(nextPage));
        const currentSignature = `${normalizedProgress}-${normalizedPage}`;
        const previousSignature = `${lastSentProgressRef.current.progress}-${lastSentProgressRef.current.last_page}`;

        if (currentSignature === previousSignature) {
            return;
        }

        window.clearTimeout(progressTimerRef.current);
        progressTimerRef.current = window.setTimeout(async () => {
            try {
                await window.axios.post(selected.progress_endpoint, {
                    progress: normalizedProgress,
                    last_page: normalizedPage,
                });

                lastSentProgressRef.current = {
                    progress: normalizedProgress,
                    last_page: normalizedPage,
                };
            } catch (error) {
                toast.error('No pudimos guardar tu progreso de lectura.', { id: 'reading-progress-error' });
            }
        }, 500);
    };

    const goToPage = (page) => {
        if (selected?.source_type === 'pdf') {
            const list = pdfListRef.current;
            const el = list?.querySelector(`.pdf-canvas-card[data-page-number="${page}"]`);
            if (el && list) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } else {
            const container = htmlSurfaceRef.current;
            if (!container) return;
            const headings = Array.from(container.querySelectorAll('h1, h2, h3, section, article'));
            const target = headings[page - 1];
            target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const nextPage = () => {
        const total = selected?.source_type === 'pdf' ? pdfPageCount || selected?.total_pages || 0 : navigationItems.length || 0;
        const next = Math.min(total || lastReadPage, lastReadPage + 1);
        goToPage(next);
    };

    const prevPage = () => {
        const prev = Math.max(1, lastReadPage - 1);
        goToPage(prev);
    };

    useEffect(() => {
        document.body.classList.add('reader-mode');

        const blockAction = (message) => {
            setShieldMessage(message);
            window.clearTimeout(blockAction.timeoutId);
            blockAction.timeoutId = window.setTimeout(() => setShieldMessage(''), 2200);
            toast.error(message, { id: 'reader-protection' });
        };

        const handleContextMenu = (event) => {
            event.preventDefault();
            blockAction('Menu contextual deshabilitado en lectura protegida');
        };

        const handleCopy = (event) => {
            event.preventDefault();
            blockAction('La copia de contenido esta bloqueada');
        };

        const handleKeyDown = (event) => {
            const key = event.key.toLowerCase();
            const blockedCombo = event.ctrlKey || event.metaKey;
            const isBlocked =
                key === 'printscreen' ||
                (blockedCombo && ['s', 'p', 'u', 'c', 'x'].includes(key)) ||
                key === 'f12';

            if (isBlocked) {
                event.preventDefault();
                blockAction('Accion bloqueada por la capa de proteccion');
            }
        };

        const handleVisibility = () => {
            const hidden = document.visibilityState !== 'visible';
            setIsBlurred(hidden);

            if (hidden) {
                blockAction('Lectura pausada mientras la ventana no esta activa');
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('cut', handleCopy);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.body.classList.remove('reader-mode');
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('cut', handleCopy);
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('visibilitychange', handleVisibility);
            window.clearTimeout(blockAction.timeoutId);
            window.clearTimeout(progressTimerRef.current);
        };
    }, []);

    useEffect(() => {
        setReadingProgress(selected?.progress ?? 0);
        setLastReadPage(selected?.last_page ?? 1);
        lastSentProgressRef.current = {
            progress: selected?.progress ?? 0,
            last_page: selected?.last_page ?? 1,
        };
    }, [selected?.id, selected?.progress, selected?.last_page]);

    useEffect(() => {
        if (selected?.source_type === 'pdf') {
            const total = Math.max(pdfPageCount || selected?.total_pages || 0, 0);
            setNavigationItems(
                Array.from({ length: total }, (_, index) => ({
                    id: `page-${index + 1}`,
                    label: `Pagina ${index + 1}`,
                    page: index + 1,
                    type: 'pdf',
                }))
            );

            return;
        }

        const frame = window.requestAnimationFrame(() => {
            const container = htmlSurfaceRef.current;

            if (!container) {
                setNavigationItems([]);
                return;
            }

            const headings = Array.from(container.querySelectorAll('h1, h2, h3'));
            htmlHeadingRefs.current = headings;

            if (headings.length) {
                setNavigationItems(
                    headings.map((heading, index) => ({
                        id: `section-${index + 1}`,
                        label: heading.textContent?.trim() || `Seccion ${index + 1}`,
                        page: index + 1,
                        type: 'html',
                    }))
                );

                return;
            }

            setNavigationItems(
                chapterList.map((chapter, index) => ({
                    id: `chapter-${index + 1}`,
                    label: chapter,
                    page: index + 1,
                    type: 'html-fallback',
                }))
            );
        });

        return () => {
            window.cancelAnimationFrame(frame);
        };
    }, [selected?.id, selected?.source_type, selected?.total_pages, pdfPageCount, chapterList, pages]);

    useEffect(() => {
        let cancelled = false;
        canvasRefs.current = [];

        const loadPdf = async () => {
            if (selected?.source_type !== 'pdf' || !selected?.pdf_url) {
                setPdfPageCount(0);
                setPdfError('');
                setPdfLoading(false);
                return;
            }

            try {
                setPdfLoading(true);
                setPdfError('');

                const task = pdfjsLib.getDocument({
                    url: selected.pdf_url,
                    withCredentials: false,
                    useSystemFonts: true,
                });

                const pdf = await task.promise;

                if (cancelled) {
                    return;
                }

                setPdfPageCount(pdf.numPages);

                await Promise.all(
                    Array.from({ length: pdf.numPages }, async (_, index) => {
                        const page = await pdf.getPage(index + 1);

                        if (cancelled) {
                            return;
                        }

                        // compute a scale that fits the canvas parent (card) to viewport
                        const baseViewport = page.getViewport({ scale: 1 });
                        const canvas = canvasRefs.current[index];

                        if (!canvas) {
                            return;
                        }

                        const parent = canvas.parentElement || canvas;
                        const rect = parent.getBoundingClientRect();
                        const DPR = window.devicePixelRatio || 1;

                        const availableWidth = Math.max(rect.width - 24, 320);
                        const availableHeight = Math.max(rect.height - 24, window.innerHeight * 0.72);
                        const widthFitScale = availableWidth / baseViewport.width;
                        const heightFitScale = availableHeight / baseViewport.height;
                        const isMobileViewport = window.innerWidth <= 760;
                        const fitScale = isMobileViewport
                            ? Math.min(widthFitScale, heightFitScale) || 1
                            : widthFitScale || 1;
                        const renderScale = fitScale * DPR;
                        const viewport = page.getViewport({ scale: renderScale });
                        const context = canvas.getContext('2d');

                        canvas.width = Math.round(viewport.width);
                        canvas.height = Math.round(viewport.height);
                        canvas.style.width = `${Math.round(baseViewport.width * fitScale)}px`;
                        canvas.style.height = `${Math.round(baseViewport.height * fitScale)}px`;

                        await page.render({
                            canvasContext: context,
                            viewport,
                        }).promise;
                    })
                );
            } catch (error) {
                if (!cancelled) {
                    setPdfError('No pudimos renderizar este PDF correctamente en el visor.');
                    toast.error('No pudimos renderizar este PDF correctamente en el visor.', { id: 'pdf-render-error' });
                }
            } finally {
                if (!cancelled) {
                    setPdfLoading(false);
                }
            }
        };

        loadPdf();

        return () => {
            cancelled = true;
        };
    }, [selected?.id, selected?.pdf_url, selected?.source_type, viewportTick]);

    useEffect(() => {
        if (selected?.source_type !== 'html') {
            return undefined;
        }

        const handleResize = () => setViewportTick((v) => v + 1);
        window.addEventListener('resize', handleResize);

        const handleScroll = () => {
            const node = htmlSurfaceRef.current;
            if (!node) return;

            const maxScroll = Math.max(node.scrollHeight - node.clientHeight, 1);
            const currentProgress = Math.round((node.scrollTop / maxScroll) * 100);
            const derivedPage = Math.min(
                Math.max(1, Math.round((currentProgress / 100) * Math.max(selected?.total_pages ?? 1, 1))),
                Math.max(selected?.total_pages ?? 1, 1)
            );

            setReadingProgress(currentProgress);
            setLastReadPage(derivedPage);
            persistProgress(currentProgress, derivedPage);
        };

        const node = htmlSurfaceRef.current;
        if (!node) {
            window.removeEventListener('resize', handleResize);
            return undefined;
        }

        node.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => {
            node.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [selected?.id, selected?.source_type, selected?.total_pages]);

    // Keyboard navigation for reader (left/right arrows)
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                nextPage();
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                prevPage();
            }
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [lastReadPage, pdfPageCount, navigationItems]);

    // touch gestures for next/prev page (vertical swipes) — improved detection
    useEffect(() => {
        let startX = null;
        let startY = null;

        const onTouchStart = (e) => {
            if (e.touches && e.touches[0]) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }
        };

        const onTouchMove = (e) => {
            // just touching; we track movement but don't block scroll
            if (!startY || !e.touches || !e.touches[0]) return;
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            // if horizontal gesture dominates, ignore
            if (Math.abs(dx) > Math.abs(dy)) {
                // let horizontal interactions pass
            }
        };

        const onTouchEnd = (e) => {
            if (startY === null) return;
            const endTouch = e.changedTouches && e.changedTouches[0];
            if (!endTouch) {
                startX = null;
                startY = null;
                return;
            }
            const endX = endTouch.clientX;
            const endY = endTouch.clientY;
            const dx = endX - startX;
            const dy = endY - startY;
            const threshold = 60;

            // require vertical movement larger than threshold and larger than horizontal movement
            if (Math.abs(dy) > threshold && Math.abs(dy) > Math.abs(dx)) {
                if (dy < 0) {
                    nextPage();
                } else {
                    prevPage();
                }
            }

            startX = null;
            startY = null;
        };

        const attach = (node) => {
            if (!node) return;
            node.addEventListener('touchstart', onTouchStart, { passive: true });
            node.addEventListener('touchmove', onTouchMove, { passive: true });
            node.addEventListener('touchend', onTouchEnd, { passive: true });
            return () => {
                node.removeEventListener('touchstart', onTouchStart);
                node.removeEventListener('touchmove', onTouchMove);
                node.removeEventListener('touchend', onTouchEnd);
            };
        };

        const cleanupFns = [];

        // prefer pdf list surface, then html surface, then reader-document
        const pdfNode = pdfListRef.current;
        const htmlNode = htmlSurfaceRef.current;
        const docNode = document.querySelector('.reader-document');
        const readerStage = document.querySelector('.reader-stage');

        if (pdfNode) cleanupFns.push(attach(pdfNode));
        if (htmlNode) cleanupFns.push(attach(htmlNode));
        // always attach to reader-stage as a reliable fallback
        if (readerStage) cleanupFns.push(attach(readerStage));
        else if (!pdfNode && !htmlNode && docNode) cleanupFns.push(attach(docNode));

        return () => {
            cleanupFns.forEach((fn) => fn && fn());
        };
    }, [selected?.id, selected?.source_type, nextPage, prevPage]);

    useEffect(() => {
        if (selected?.source_type !== 'pdf' || pdfPageCount === 0) {
            return undefined;
        }

        const root = pdfListRef.current || null;

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

                if (!visible) {
                    return;
                }

                const pageNumber = Number(visible.target.getAttribute('data-page-number') || 1);
                const currentProgress = Math.round((pageNumber / Math.max(pdfPageCount, 1)) * 100);

                setReadingProgress(currentProgress);
                setLastReadPage(pageNumber);
                persistProgress(currentProgress, pageNumber);
            },
            {
                root,
                threshold: [0.35, 0.6, 0.85],
            }
        );

        const cards = (root ? root.querySelectorAll('.pdf-canvas-card') : document.querySelectorAll('.pdf-canvas-card'));
        cards.forEach((card) => observer.observe(card));

        return () => {
            observer.disconnect();
        };
    }, [selected?.id, selected?.source_type, pdfPageCount]);

    const jumpToNavigationItem = (item, index) => {
        if (selected?.source_type === 'pdf') {
            const target = document.querySelector(`[data-page-number="${item.page}"]`);

            if (!target) {
                return;
            }

            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const currentProgress = Math.round((item.page / Math.max(pdfPageCount || selected?.total_pages || 1, 1)) * 100);
            setReadingProgress(currentProgress);
            setLastReadPage(item.page);
            persistProgress(currentProgress, item.page);
            return;
        }

        const container = htmlSurfaceRef.current;

        if (!container) {
            return;
        }

        const targetHeading = htmlHeadingRefs.current[index];

        if (targetHeading) {
            container.scrollTo({
                top: Math.max(targetHeading.offsetTop - 18, 0),
                behavior: 'smooth',
            });
        } else {
            const maxScroll = Math.max(container.scrollHeight - container.clientHeight, 1);
            const fallbackIndex = Math.max(navigationItems.length - 1, 1);
            const ratio = fallbackIndex === 0 ? 0 : index / fallbackIndex;

            container.scrollTo({
                top: maxScroll * ratio,
                behavior: 'smooth',
            });
        }

        const maxPage = Math.max(selected?.total_pages ?? navigationItems.length, 1);
        const derivedPage = Math.min(index + 1, maxPage);
        const currentProgress = Math.round((derivedPage / maxPage) * 100);

        setReadingProgress(currentProgress);
        setLastReadPage(derivedPage);
        persistProgress(currentProgress, derivedPage);
    };

    return (
        <div className="reader-shell">
            <SeoHead seo={seo} />

            <AppNavbar
                title="Lector NutriDog Secure"
                subtitle={user ? `Sesion protegida para ${user.name}` : 'Vista privada de demostracion'}
                shellClass="reader-topbar"
                menuItems={[
                    { href: '/library', label: 'Biblioteca' },
                    ...(canManage ? [{ href: '/admin', label: 'Admin' }] : []),
                    { href: '/dashboard', label: 'Dashboard' },
                ]}
            />

            <section className={`reader-stage ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <aside className="reader-sidebar-panel glass-card">
                    <div className="reader-sidebar-head">
                        <span className="eyebrow reader-eyebrow">Contenido abierto</span>
                        <h1 className="reader-title">{selected?.title ?? 'NutriDog Premium'}</h1>
                        <p className="hero-text reader-description">{selected?.description}</p>
                    </div>

                    <div className="reader-kpis">
                        <div>
                            <strong>{selected?.format ?? 'HTML interactivo'}</strong>
                            <span>Formato de entrega</span>
                        </div>
                        <div>
                            <strong>{readingProgress}%</strong>
                            <span>Progreso actual</span>
                        </div>
                        <div>
                            <strong>{lastReadPage}</strong>
                            <span>Ultima pagina</span>
                        </div>
                    </div>

                    <div className="reader-outline-shell">
                        <div className="reader-outline-head">
                            <span className="section-subtitle">Navegacion</span>
                            <strong>{navigationItems.length} entradas</strong>
                        </div>

                        <div className="reader-outline">
                            {navigationItems.map((item, index) => (
                                <button
                                    className={`outline-item outline-button ${lastReadPage === item.page ? 'outline-item-active' : ''}`}
                                    key={item.id}
                                    type="button"
                                    onClick={() => jumpToNavigationItem(item, index)}
                                >
                                    <span>{String(index + 1).padStart(2, '0')}</span>
                                    <div>
                                        <strong>{item.label}</strong>
                                        <p>Ir a esta {selected?.source_type === 'pdf' ? 'pagina' : 'seccion'}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                <main className={`reader-canvas glass-card ${isBlurred ? 'reader-canvas-blurred' : ''}`}>
                    <div className="reader-toolbar">
                        <button
                            type="button"
                            className="sidebar-toggle"
                            aria-pressed={sidebarCollapsed}
                            onClick={() => setSidebarCollapsed((s) => !s)}
                        >
                            {sidebarCollapsed ? 'Mostrar índice' : 'Ocultar índice'}
                        </button>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button type="button" className="reader-page-btn" onClick={prevPage} aria-label="Página anterior">
                                ←
                            </button>
                            <strong style={{ minWidth: 120, textAlign: 'center' }}>
                                Página {lastReadPage}{pdfPageCount ? ` / ${pdfPageCount}` : ''}
                            </strong>
                            <button type="button" className="reader-page-btn" onClick={nextPage} aria-label="Página siguiente">
                                →
                            </button>
                        </div>

                        <span className="reader-pill">Watermark activo</span>
                        <span className="reader-pill">Sin descarga</span>
                        <span className="reader-pill">Sesion trazable</span>
                    </div>

                    <div className="reader-document" aria-live="polite">
                        <div className="dynamic-watermark">
                            {user?.email ?? 'reader@nutridog.test'} / {selected?.slug ?? 'nutridog-secure'}
                        </div>

                        <div className="document-mode-tabs">
                            <span className="mode-tab mode-tab-active">Vista ebook</span>
                            <span className="mode-tab">Origen {selected?.source_type ?? 'html'}</span>
                            <span className="mode-tab">Proteccion activa</span>
                        </div>

                        <section className="document-body">
                            {selected?.source_type === 'html' ? (
                                <article
                                    ref={htmlSurfaceRef}
                                    className="ebook-html-surface"
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            pages[0]?.content ??
                                            '<section class="ebook-fragment"><h2>Sin contenido</h2><p>Este ebook aun no tiene HTML cargado.</p></section>',
                                    }}
                                />
                            ) : (
                                <section className="pdf-viewer-surface">
                                    <div className="pdf-viewer-head">
                                        <strong>{selected?.file_name ?? `${selected?.title}.pdf`}</strong>
                                        <span>{pdfPageCount > 0 ? `${pdfPageCount} paginas renderizadas` : 'Preparando visor PDF'}</span>
                                    </div>

                                    {pdfLoading ? <div className="pdf-viewer-state">Cargando PDF...</div> : null}
                                    {pdfError ? <div className="pdf-viewer-state pdf-viewer-error">{pdfError}</div> : null}

                                    <div className="pdf-canvas-list" ref={pdfListRef}>
                                        {Array.from({ length: pdfPageCount || 1 }, (_, index) => (
                                            <div className="pdf-canvas-card" key={index} data-page-number={index + 1}>
                                                <div className="pdf-canvas-meta">Pagina {index + 1}</div>
                                                <div className="pdf-canvas-stage">
                                                    <canvas
                                                        ref={(element) => {
                                                            canvasRefs.current[index] = element;
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {pdfError && pages.length ? (
                                        <section className="pdf-conversion-surface">
                                            {pages.map((page) => (
                                                <div className="pdf-card" key={page.page}>
                                                    <strong>{page.title || `Pagina ${page.page}`}</strong>
                                                    <p>{page.content}</p>
                                                </div>
                                            ))}
                                        </section>
                                    ) : null}
                                </section>
                            )}
                        </section>
                    </div>

                    {shieldMessage ? <div className="reader-alert">{shieldMessage}</div> : null}
                </main>

                {/* reader-security-panel removed for immersive reader view */}
            </section>
        </div>
    );
}
