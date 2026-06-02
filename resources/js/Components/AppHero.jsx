export default function AppHero({
    eyebrow,
    title,
    description,
    titleClassName = 'page-title',
    shellClassName = '',
    contentClassName = '',
    sideClassName = '',
    actions,
    meta,
    supporting,
}) {
    return (
        <section className={`app-hero-panel glass-card ${shellClassName}`.trim()}>
            <div className={`app-hero-main ${contentClassName}`.trim()}>
                {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
                <h1 className={titleClassName}>{title}</h1>
                {description ? <p className="hero-text hero-text-wide">{description}</p> : null}
                {actions ? <div className="app-hero-actions">{actions}</div> : null}
                {meta ? <div className="app-hero-meta">{meta}</div> : null}
            </div>

            {supporting ? <div className={`app-hero-side ${sideClassName}`.trim()}>{supporting}</div> : null}
        </section>
    );
}
