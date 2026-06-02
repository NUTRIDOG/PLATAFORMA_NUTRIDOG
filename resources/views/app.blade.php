@php
    $seo = $page['props']['seo'] ?? [];
    $seoTitle = $seo['title'] ?? config('app.name', 'Laravel');
    $seoDescription = $seo['description'] ?? 'NutriDog es una plataforma para presentar y vender infoproductos de mascotas con una experiencia profesional y protegida.';
    $seoCanonical = $seo['canonical'] ?? url()->current();
    $seoRobots = $seo['robots'] ?? 'index,follow';
    $seoType = $seo['type'] ?? 'website';
    $seoImage = $seo['image'] ?? url('/images/ebooks.webp');
    $seoImageAlt = $seo['image_alt'] ?? $seoTitle;
    $seoSiteName = $seo['site_name'] ?? config('app.name', 'NutriDog');
    $seoLocale = $seo['locale'] ?? 'es_CO';
    $seoTwitterCard = $seo['twitter_card'] ?? 'summary_large_image';
    $structuredData = $seo['structured_data'] ?? [];
    $structuredData = is_array($structuredData) && array_is_list($structuredData)
        ? $structuredData
        : (empty($structuredData) ? [] : [$structuredData]);
@endphp
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#4316FF">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title inertia>{{ $seoTitle }}</title>
        <meta name="description" content="{{ $seoDescription }}">
        <meta name="robots" content="{{ $seoRobots }}">
        <link rel="canonical" href="{{ $seoCanonical }}">
        <meta property="og:type" content="{{ $seoType }}">
        <meta property="og:title" content="{{ $seoTitle }}">
        <meta property="og:description" content="{{ $seoDescription }}">
        <meta property="og:url" content="{{ $seoCanonical }}">
        <meta property="og:site_name" content="{{ $seoSiteName }}">
        <meta property="og:image" content="{{ $seoImage }}">
        <meta property="og:image:alt" content="{{ $seoImageAlt }}">
        <meta property="og:locale" content="{{ $seoLocale }}">
        <meta name="twitter:card" content="{{ $seoTwitterCard }}">
        <meta name="twitter:title" content="{{ $seoTitle }}">
        <meta name="twitter:description" content="{{ $seoDescription }}">
        <meta name="twitter:image" content="{{ $seoImage }}">
        <meta name="twitter:image:alt" content="{{ $seoImageAlt }}">
        @foreach ($structuredData as $item)
            <script type="application/ld+json">{!! json_encode($item, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) !!}</script>
        @endforeach
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                theme: {
                    extend: {
                        colors: {
                            nutridog: {
                                ink: '#111827',
                                mist: '#f8fafc',
                                panel: '#0f172a',
                                brand: '#4f46e5',
                                lime: '#84cc16',
                            },
                        },
                        boxShadow: {
                            panel: '0 24px 80px rgba(15, 23, 42, 0.28)',
                        },
                    },
                },
            };
        </script>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
        @inertiaHead
    </head>
    <body class="modern-app">
        <script type="application/json" data-page="app">@json($page)</script>
        <div id="app"></div>
    </body>
</html>
