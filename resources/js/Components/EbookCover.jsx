export default function EbookCover({ className = 'immersive-cover', imageUrl, label, title, subtitle, style }) {
    return (
        <div className={`${className} ${imageUrl ? 'has-cover-image' : ''}`.trim()} style={style}>
            {imageUrl ? <img className="ebook-cover-image" src={imageUrl} alt={title ? `Portada de ${title}` : 'Portada del ebook'} /> : null}
            {!imageUrl ? <span>{label}</span> : null}
            {subtitle ? <small>{subtitle}</small> : null}
        </div>
    );
}
