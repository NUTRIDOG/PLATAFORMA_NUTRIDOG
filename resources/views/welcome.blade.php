<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#4316FF">
        <title>NUTRIDOG | Plataforma de lectura protegida</title>
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body>
        <div class="shell">
            <aside class="sidebar">
                <div class="brand">
                    <div class="brand-mark">ND</div>
                    <div>
                        <h1>NUTRIDOG Reader</h1>
                        <p>Biblioteca privada con lectura protegida</p>
                    </div>
                </div>

                <div class="nav-group">
                    <a class="nav-link {{ $screen === 'library' ? 'active' : '' }}" href="{{ route('library.index') }}">
                        <span>Biblioteca</span>
                        <span class="pill">{{ $ebooks->count() }} ebooks</span>
                    </a>
                    <a class="nav-link {{ $screen === 'reader' ? 'active' : '' }}" href="{{ route('reader.show', $featured['slug']) }}">
                        <span>Lector protegido</span>
                        <span class="pill success">Live</span>
                    </a>
                    <a class="nav-link {{ $screen === 'admin' ? 'active' : '' }}" href="{{ route('admin.index') }}">
                        <span>Panel admin</span>
                        <span class="pill warning">Demo</span>
                    </a>
                    <a class="nav-link {{ $screen === 'blocked' ? 'active' : '' }}" href="{{ route('reader.blocked') }}">
                        <span>Acceso bloqueado</span>
                        <span class="pill danger">Alert</span>
                    </a>
                </div>

                <div class="panel">
                    <div class="card-title">Pilares del PDF</div>
                    <div class="tag-list">
                        <span class="tag">Lectura en HTML</span>
                        <span class="tag">Watermark dinamica</span>
                        <span class="tag">Modo offline cifrado</span>
                        <span class="tag">Logs y sesiones</span>
                    </div>
                </div>

                <div class="sidebar-footer">
                    <p class="muted">Seguridad operativa</p>
                    <strong>96% sincronizado</strong>
                    <p class="muted">Sin exponer PDF original, con biblioteca, trazabilidad y experiencia premium.</p>
                </div>
            </aside>

            <main class="main">
                <div class="topbar">
                    <div class="search">
                        <span>Buscar</span>
                        <input type="text" value="Guia NutriDog, accesos, eventos..." readonly>
                    </div>

                    <div class="topbar-actions">
                        <button class="theme-button" type="button" data-theme-toggle>Cambiar tema</button>
                        <a class="ghost-button" href="{{ route('reader.show', $featured['slug']) }}">Probar lector</a>
                        <a class="button" href="{{ route('admin.index') }}">Abrir dashboard</a>
                    </div>
                </div>

                @if ($screen === 'library')
                    <section class="hero-grid">
                        <div class="hero-card">
                            <span class="eyebrow">SaaS premium para lectura protegida</span>
                            <h2 class="hero-title">Una plataforma moderna para convertir el PDF en una experiencia privada, elegante y controlada.</h2>
                            <p class="hero-copy">
                                Esta base recoge el enfoque del documento: biblioteca privada, lector HTML protegido, marca de agua
                                dinamica, guardado de progreso, sesiones activas, panel administrador y soporte para offline controlado.
                            </p>

                            <div class="hero-actions" style="margin-top: 22px;">
                                <a class="button" href="{{ route('reader.show', $featured['slug']) }}">Continuar lectura</a>
                                <a class="ghost-button" href="{{ route('admin.index') }}">Ver operacion</a>
                            </div>

                            <div class="feature-list">
                                <div class="feature-item">
                                    <strong>Lector protegido</strong>
                                    <span class="small-copy">Sin PDF embebido y con control visual tipo app.</span>
                                </div>
                                <div class="feature-item">
                                    <strong>Biblioteca privada</strong>
                                    <span class="small-copy">Cards modernas, progreso y estados de acceso.</span>
                                </div>
                                <div class="feature-item">
                                    <strong>Arquitectura escalable</strong>
                                    <span class="small-copy">Lista para crecer hacia Inertia, React y flujos reales.</span>
                                </div>
                            </div>
                        </div>

                        <div class="stats-card">
                            <div>
                                <p class="muted">Resumen operativo</p>
                                <div class="stat-value">PWA + Seguridad + UX</div>
                            </div>

                            <div class="stats-grid">
                                @foreach ($metrics as $metric)
                                    <div>
                                        <span class="metric-value">{{ $metric['value'] }}</span>
                                        <strong>{{ $metric['label'] }}</strong>
                                        <p class="muted">{{ $metric['detail'] }}</p>
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    </section>

                    <section class="status-banner">
                        <div>
                            <span class="eyebrow">Stack visual</span>
                            <h3 class="section-title">Look & feel inspirado en el PDF</h3>
                            <p class="muted">Glassmorphism sutil, gradientes con la paleta NutriDog, layout limpio y enfoque mobile-first.</p>
                        </div>

                        <div class="tag-list">
                            <span class="tag">#4316FF</span>
                            <span class="tag">#7CC21F</span>
                            <span class="tag">Sidebar moderna</span>
                            <span class="tag">Cards con metricas</span>
                        </div>
                    </section>

                    <section class="panel">
                        <div class="metric-top">
                            <div>
                                <p class="muted">Biblioteca del usuario</p>
                                <h3 class="section-title">Ebooks con acceso, progreso y continuidad de lectura</h3>
                            </div>
                            <a class="ghost-button" href="{{ route('reader.show', $featured['slug']) }}">Abrir ultimo ebook</a>
                        </div>

                        <div class="library-grid" style="margin-top: 22px;">
                            @foreach ($ebooks as $ebook)
                                <article class="book-card">
                                    <div class="book-cover" style="--cover-primary: {{ $ebook['primary_color'] }}; --cover-secondary: {{ $ebook['secondary_color'] }};">
                                        <span>{{ $ebook['cover'] }}</span>
                                    </div>

                                    <div class="book-top">
                                        <div>
                                            <span class="pill {{ $ebook['access'] === 'Expirado' ? 'danger' : ($ebook['offline'] ? 'success' : '') }}">
                                                {{ $ebook['access'] }}
                                            </span>
                                            <h4 class="card-title" style="margin-top: 12px;">{{ $ebook['title'] }}</h4>
                                            <p class="book-description">{{ $ebook['description'] }}</p>
                                        </div>
                                    </div>

                                    <div class="book-meta">
                                        <span class="tag">{{ $ebook['author'] }}</span>
                                        <span class="tag">{{ $ebook['category'] }}</span>
                                        <span class="tag">{{ $ebook['total_pages'] }} paginas</span>
                                    </div>

                                    <div>
                                        <div class="status-row">
                                            <span class="muted">Progreso</span>
                                            <strong>{{ $ebook['progress'] }}%</strong>
                                        </div>
                                        <div class="progress" style="margin-top: 10px;">
                                            <span style="width: {{ $ebook['progress'] }}%;"></span>
                                        </div>
                                    </div>

                                    <div class="status-row">
                                        <span class="muted">Ultima pagina {{ $ebook['last_page'] }}</span>
                                        <span class="muted">{{ $ebook['offline'] ? 'Disponible offline' : 'Solo online' }}</span>
                                    </div>

                                    <div class="hero-actions">
                                        <a class="button" href="{{ route('reader.show', $ebook['slug']) }}">Continuar</a>
                                        <a class="ghost-button" href="{{ $ebook['access'] === 'Expirado' ? route('reader.blocked') : route('reader.show', $ebook['slug']) }}">
                                            {{ $ebook['access'] === 'Expirado' ? 'Ver bloqueo' : 'Ver detalles' }}
                                        </a>
                                    </div>
                                </article>
                            @endforeach
                        </div>
                    </section>
                @endif

                @if ($screen === 'reader')
                    <section class="status-banner">
                        <div>
                            <span class="eyebrow">Lector HTML protegido</span>
                            <h3 class="section-title">{{ $selected['title'] }}</h3>
                            <p class="muted">Sesion activa, trazabilidad visual, progreso sincronizado y preparacion para offline cifrado.</p>
                        </div>

                        <div class="tag-list">
                            <span class="tag">Pagina {{ $selected['last_page'] }} / {{ $selected['total_pages'] }}</span>
                            <span class="tag">{{ $selected['progress'] }}% leido</span>
                            <span class="tag">{{ $selected['offline'] ? 'Offline listo' : 'Sin cache local' }}</span>
                        </div>
                    </section>

                    <section class="reader-grid">
                        <div class="reader-page reader-frame">
                            <div class="watermark">
                                Camila Rojas · camila@nutridog.co · ID 21 · {{ $selected['title'] }}
                            </div>

                            <div class="reader-toolbar">
                                <span class="pill success">Sesion valida</span>
                                <span class="tag">Contenido sanitizado</span>
                                <span class="tag">Copia bloqueada</span>
                                <span class="tag">Print bloqueado</span>
                            </div>

                            <article style="margin-top: 28px;">
                                <h2 class="reader-heading">Capitulo {{ $selected['last_page'] }}: Lectura protegida con experiencia premium</h2>
                                <p>
                                    El contenido del ebook se entrega como HTML seguro desde almacenamiento privado. El lector muestra una
                                    interfaz limpia, con control de ancho de lectura, porcentaje consumido, navegacion contextual y una
                                    capa de disuasion visual para reforzar trazabilidad y acceso autorizado.
                                </p>
                                <p>
                                    La idea del PDF se refleja aqui en una experiencia tipo app: no se expone el archivo original, la
                                    lectura se guarda por pagina, el usuario mantiene continuidad entre dispositivos y la capa operativa
                                    puede registrar aperturas, bloqueos y actividad sospechosa sin romper la comodidad visual.
                                </p>
                                <p>
                                    Tambien se deja espacio para el siguiente paso tecnico: migrar esta vista a Inertia + React, sumar
                                    hooks de seguridad, sincronizacion con IndexedDB y carga protegida de assets internos.
                                </p>
                            </article>
                        </div>

                        <div style="display: grid; gap: 24px;">
                            <div class="chapter-card">
                                <div class="card-title">Indice lateral</div>
                                <div class="chapter-list">
                                    @foreach ($chapters as $index => $chapter)
                                        <div class="chapter-item">
                                            <span>{{ str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT) }} · {{ $chapter }}</span>
                                            <span class="muted">{{ $index + 1 === 4 ? 'Actual' : 'Listo' }}</span>
                                        </div>
                                    @endforeach
                                </div>
                            </div>

                            <div class="chapter-card">
                                <div class="card-title">Controles del lector</div>
                                <div class="tag-list">
                                    <span class="tag">Tema claro/oscuro</span>
                                    <span class="tag">Ancho de lectura</span>
                                    <span class="tag">Pantalla completa</span>
                                    <span class="tag">Guardar offline</span>
                                    <span class="tag">Seguridad overlay</span>
                                </div>
                            </div>
                        </div>
                    </section>
                @endif

                @if ($screen === 'admin')
                    <section class="hero-grid">
                        <div class="hero-card">
                            <span class="eyebrow">Panel administrador moderno</span>
                            <h2 class="hero-title">Monitorea accesos, sesiones, ebooks y eventos desde una sola operacion visual.</h2>
                            <p class="hero-copy">
                                El PDF plantea un dashboard con sidebar, topbar, metricas, tablas y logs. Aqui queda una version
                                profesional, lista para crecer con CRUD real, policies, middleware y flujos de asignacion de acceso.
                            </p>
                        </div>

                        <div class="stats-card">
                            @foreach ($metrics as $metric)
                                <div>
                                    <p class="muted">{{ $metric['label'] }}</p>
                                    <div class="stat-value">{{ $metric['value'] }}</div>
                                    <span class="muted">{{ $metric['detail'] }}</span>
                                </div>
                            @endforeach
                        </div>
                    </section>

                    <section class="admin-grid">
                        <div class="admin-table">
                            <div class="metric-top">
                                <div>
                                    <p class="muted">Catalogo administrado</p>
                                    <h3 class="section-title">Ebooks y estado de acceso</h3>
                                </div>
                                <a class="button" href="{{ route('library.index') }}">Ver biblioteca</a>
                            </div>

                            <table style="margin-top: 18px;">
                                <thead>
                                    <tr>
                                        <th>Ebook</th>
                                        <th>Autor</th>
                                        <th>Estado</th>
                                        <th>Paginas</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach ($ebooks as $ebook)
                                        <tr>
                                            <td>{{ $ebook['title'] }}</td>
                                            <td>{{ $ebook['author'] }}</td>
                                            <td>{{ $ebook['status'] }}</td>
                                            <td>{{ $ebook['total_pages'] }}</td>
                                        </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>

                        <div class="event-list">
                            @foreach ($events as $event)
                                <div class="event-item">
                                    <div>
                                        <strong>{{ $event['event'] }}</strong>
                                        <p class="muted">{{ $event['user'] }}</p>
                                    </div>
                                    <div style="text-align: right;">
                                        <strong>{{ $event['time'] }}</strong>
                                        <p class="muted">{{ $event['status'] }}</p>
                                    </div>
                                </div>
                            @endforeach
                        </div>
                    </section>
                @endif

                @if ($screen === 'blocked')
                    <section class="protected-box">
                        <span class="eyebrow">Acceso bloqueado</span>
                        <h2>No tienes acceso valido a este ebook.</h2>
                        <p>
                            El documento solicita una pantalla clara para accesos revocados, expirados o sesiones invalidas. Esta vista
                            presenta la razon del bloqueo y ofrece una salida limpia hacia biblioteca o soporte.
                        </p>

                        <div class="tag-list" style="justify-content: center; margin-bottom: 24px;">
                            <span class="tag">Acceso expirado</span>
                            <span class="tag">Sesion no valida</span>
                            <span class="tag">Limite de dispositivos</span>
                        </div>

                        <div class="hero-actions" style="justify-content: center;">
                            <a class="button" href="{{ route('library.index') }}">Volver a biblioteca</a>
                            <a class="ghost-button" href="{{ route('admin.index') }}">Contactar soporte</a>
                        </div>
                    </section>
                @endif

                <p class="footer-note">
                    Base visual creada a partir del PDF cargado: biblioteca privada, lector protegido, panel admin y experiencia
                    moderna lista para evolucionar a la arquitectura completa.
                </p>
            </main>
        </div>
    </body>
</html>
