import { Head } from '@inertiajs/react';

export default function SeoHead({ seo = {} }) {
    if (!seo || typeof seo !== 'object') {
        return null;
    }

    const structuredData = Array.isArray(seo.structured_data)
        ? seo.structured_data
        : seo.structured_data
          ? [seo.structured_data]
          : [];

    return (
        <Head title={seo.title}>
            {seo.description ? <meta head-key="description" name="description" content={seo.description} /> : null}
            {seo.robots ? <meta head-key="robots" name="robots" content={seo.robots} /> : null}
            {seo.canonical ? <link head-key="canonical" rel="canonical" href={seo.canonical} /> : null}

            <meta head-key="og:type" property="og:type" content={seo.type || 'website'} />
            {seo.title ? <meta head-key="og:title" property="og:title" content={seo.title} /> : null}
            {seo.description ? <meta head-key="og:description" property="og:description" content={seo.description} /> : null}
            {seo.canonical ? <meta head-key="og:url" property="og:url" content={seo.canonical} /> : null}
            {seo.site_name ? <meta head-key="og:site_name" property="og:site_name" content={seo.site_name} /> : null}
            {seo.image ? <meta head-key="og:image" property="og:image" content={seo.image} /> : null}
            {seo.image_alt ? <meta head-key="og:image:alt" property="og:image:alt" content={seo.image_alt} /> : null}
            {seo.locale ? <meta head-key="og:locale" property="og:locale" content={seo.locale} /> : null}

            <meta head-key="twitter:card" name="twitter:card" content={seo.twitter_card || 'summary_large_image'} />
            {seo.title ? <meta head-key="twitter:title" name="twitter:title" content={seo.title} /> : null}
            {seo.description ? <meta head-key="twitter:description" name="twitter:description" content={seo.description} /> : null}
            {seo.image ? <meta head-key="twitter:image" name="twitter:image" content={seo.image} /> : null}
            {seo.image_alt ? <meta head-key="twitter:image:alt" name="twitter:image:alt" content={seo.image_alt} /> : null}

            {structuredData.map((item, index) => (
                <script
                    key={`structured-data-${index}`}
                    head-key={`structured-data-${index}`}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
                />
            ))}
        </Head>
    );
}
