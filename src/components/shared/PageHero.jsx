// Photo banner used at the top of every in-app page.
export default function PageHero({ image, eyebrow, title, subtitle, children, tall = false, position = 'center' }) {
  return (
    <section className={`page-hero ${tall ? 'page-hero--tall' : ''}`}>
      <div className="page-hero__media" style={{ backgroundImage: `url(${image})`, backgroundPosition: position }} aria-hidden="true" />
      <div className="page-hero__shade" aria-hidden="true" />
      <div className="page-hero__content">
        {eyebrow && <span className="page-hero__eyebrow">{eyebrow}</span>}
        <h1 className="page-hero__title">{title}</h1>
        {subtitle && <p className="page-hero__subtitle">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}
