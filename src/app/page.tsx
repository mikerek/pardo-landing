'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [orderItem, setOrderItem] = useState<string | null>(null);
  const [visibleReviews, setVisibleReviews] = useState(3);

  // Track page visit on mount
  useEffect(() => {
    const trackVisit = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/track/visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: window.location.pathname,
            userAgent: navigator.userAgent,
            businessId: 1
          }),
        });
      } catch (err) {
        console.error('Failed to track visit', err);
      }
    };
    trackVisit();
  }, []);

  // Fetch Google Reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/reviews`);
        const data = await res.json();
        if (data.reviews) {
          // Shuffle reviews to show randomization on every refresh
          const shuffled = [...data.reviews].sort(() => Math.random() - 0.5);
          setReviews(shuffled);
        }
      } catch (err) {
        console.error('Failed to fetch reviews', err);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, []);

  // Track click on outbound links
  const handleOutboundClick = (target: string, url: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Tracking is secondary: we don't block the user's navigation for it.
    // We send the beacon or a non-blocking fetch.
    const trackingUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/track/click`;
    
    // Attempt tracking but proceed immediately
    fetch(trackingUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target, path: window.location.pathname, businessId: 1 }),
      keepalive: true, // Ensuring it completes even after page unload
    }).catch(err => console.error('Silent track error', err));

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleLikeReview = async (reviewName: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/reviews/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId: reviewName }),
      });
      const data = await res.json();
      if (data.success) {
        // Update local state to reflect the new like count instantly
        setReviews((prev: any[]) => prev.map((r: any) => r.name === reviewName ? { ...r, localLikes: data.likesCount } : r));
      }
    } catch (err) {
      console.error('Failed to like review', err);
    }
  };

  return (
    <main className={styles.container}>
      {/* TOP NAVIGATION BAR */}
      <nav className={styles.navbar}>
        <div className={styles.navLogo}>Pardo Burger</div>
        <div className={styles.navLinks}>
          <a href="#menu" onClick={(e) => { e.preventDefault(); document.querySelector(`.${styles.contentSection}`)?.scrollIntoView({ behavior: 'smooth' }) }}>Nuestro Menú</a>
          <a href="#reviews" onClick={(e) => { e.preventDefault(); document.querySelector(`.${styles.testimonialSection}`)?.scrollIntoView({ behavior: 'smooth' }) }}>Reseñas</a>
          <Link href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/system`} className={styles.navLoginBtn}>Acceso ERP</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className={styles.hero}>
        <div className={styles.heroImageContainer}>
          <Image
            src="/images/cali_burger.png"
            alt="Pardo Smash Burger Hero"
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>

        <div className={styles.heroContent}>
          <h1 className={styles.title}>Pardo Burger</h1>
          <p className={styles.subtitle}>
            El auténtico arte del Smash. Carne premium caramelizada al extremo, pan brioche hiper-suave y todo el sabor que Puerto Vallarta merece.
          </p>

          <div className={styles.ctaGroup}>
            <button
              className={styles.primaryButton}
              onClick={handleOutboundClick("Uber Eats", "https://www.ubereats.com/mx/store/pardo-burger-puerto-vallarta/9j0Xryx1ROmi9avqkbcFJg")}
            >
              🍔 Pedir en Uber Eats
            </button>
            <button
              className={styles.secondaryButton}
              onClick={handleOutboundClick("Rappi", "https://www.rappi.com.mx/restaurantes/1930332407-pardo-burger")}
            >
              🛵 Pedir en Rappi
            </button>
          </div>
        </div>
      </header>

      {/* MENU FULL SCREEN MODAL / LIGHTBOX (PHOTOS ONLY) */}
      {selectedPhoto && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15,23,42,0.95)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9998,
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
            <button
              onClick={() => setSelectedPhoto(null)}
              style={{ position: 'absolute', top: '20px', right: '30px', background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '1.2rem', cursor: 'pointer', zIndex: 100 }}
            >
              Cerrar &times;
            </button>

            <div style={{ display: 'flex', gap: '30px', overflowX: 'auto', alignItems: 'center', maxWidth: '100%', maxHeight: '100%', paddingBottom: '20px' }}>
              
              {/* Menu 1 Wrapper */}
              {(selectedPhoto === '/images/menu_one.png' || selectedPhoto) && (
                <div style={{ position: 'relative', height: '85vh', aspectRatio: '715/1012', flexShrink: 0 }}>
                  <img src="/images/menu_one.png" alt="Menu 1" style={{ width: '100%', height: '100%', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', objectFit: 'contain' }} />
                  
                  {/* Invisible Hit Areas */}
                  <button onClick={() => setOrderItem('Cali Burger')} style={{ position: 'absolute', top: '28%', left: '20%', width: '40%', height: '6%', background: 'transparent', border: 'none', cursor: 'pointer' }} aria-label="Order Cali Burger" />
                  <button onClick={() => setOrderItem('Cheese Burger')} style={{ position: 'absolute', top: '47%', left: '20%', width: '45%', height: '6%', background: 'transparent', border: 'none', cursor: 'pointer' }} aria-label="Order Cheese Burger" />
                  <button onClick={() => setOrderItem('Bacon Burger')} style={{ position: 'absolute', top: '63%', left: '20%', width: '45%', height: '6%', background: 'transparent', border: 'none', cursor: 'pointer' }} aria-label="Order Bacon Burger" />
                  <button onClick={() => setOrderItem('Sweet Bacon Burger')} style={{ position: 'absolute', top: '80%', left: '20%', width: '65%', height: '6%', background: 'transparent', border: 'none', cursor: 'pointer' }} aria-label="Order Sweet Bacon Burger" />
                </div>
              )}

              {/* Menu 2 Wrapper */}
              {(selectedPhoto === '/images/menu_one.png' || selectedPhoto === '/images/menu_two.png') && (
                <div style={{ position: 'relative', height: '85vh', aspectRatio: '715/1012', flexShrink: 0 }}>
                  <img src="/images/menu_two.png" alt="Menu 2" style={{ width: '100%', height: '100%', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', objectFit: 'contain' }} />
                  
                  {/* Invisible Hit Areas for Menu 2 */}
                  <button onClick={() => setOrderItem('Sunny Side Burger')} style={{ position: 'absolute', top: '26%', left: '20%', width: '55%', height: '6%', background: 'transparent', border: 'none', cursor: 'pointer' }} aria-label="Order Sunny Side Burger" />
                  <button onClick={() => setOrderItem('Crispy Crispy Burger')} style={{ position: 'absolute', top: '42%', left: '20%', width: '60%', height: '6%', background: 'transparent', border: 'none', cursor: 'pointer' }} aria-label="Order Crispy Crispy" />
                  <button onClick={() => setOrderItem('Pardo Strips')} style={{ position: 'absolute', top: '58%', left: '20%', width: '50%', height: '6%', background: 'transparent', border: 'none', cursor: 'pointer' }} aria-label="Order Pardo Strips" />
                  <button onClick={() => setOrderItem('Papas Estilo Pardo')} style={{ position: 'absolute', top: '81.5%', left: '15%', width: '35%', height: '6.5%', background: 'transparent', border: 'none', cursor: 'pointer' }} aria-label="Order Pardo Fries" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MENU SECTION */}
      <section className={styles.contentSection}>
        <h2 className={styles.sectionTitle}>Nuestro <span>Menú</span> Estelar</h2>
        <p className={styles.sectionSubtitle}>Explora el sabor auténtico del Smash. Haz clic en el botón de abajo para ver nuestro menú completo.</p>

        <div style={{ marginBottom: '3rem' }}>
          <button
            onClick={() => setSelectedPhoto('/images/menu_one.png')}
            className={styles.primaryButton}
            style={{ margin: '0 auto', fontSize: '1rem', padding: '0.8rem 2rem' }}
          >
            🔍 Ver Menú Completo (Imagen)
          </button>
        </div>

        <div className={styles.menuGrid}>
          {/* Item 1 */}
          <div className={styles.card} onClick={() => setOrderItem('Cheese Burger')}>
            <div className={styles.cardImage}>
              <Image src="/images/cheese_burger.png" alt="Cheese Burger" width={500} height={300} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Cheese Burger</h3>
              <p className={styles.cardDesc}>La tradicional e insuperable. Carne smash, doble queso americano fundido y nuestra Pardo Sauce secreta.</p>
              <div className={styles.cardPrice}>$195 MXN <span style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.8 }}>*Doble $255</span></div>
            </div>
          </div>

          {/* Item 2 */}
          <div className={styles.card} onClick={() => setOrderItem('Sweet Bacon Burger')}>
            <div className={styles.cardImage}>
              <Image src="/images/sweet_bacon_burger.png" alt="Sweet Bacon Smash" width={500} height={300} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Sweet Bacon Burger</h3>
              <p className={styles.cardDesc}>Crujiente tocino ahumado grueso con un toque dulce, queso suizo derretido y carne smash doradita.</p>
              <div className={styles.cardPrice}>$210 MXN <span style={{ fontSize: '0.75rem', fontWeight: 'normal', opacity: 0.8 }}>*Doble $260</span></div>
            </div>
          </div>

          {/* Item 3 */}
          <div className={styles.card} onClick={() => setOrderItem('Crispy Crispy Burger')}>
            <div className={styles.cardImage}>
              <Image src="/images/crispy_crispy_burger.png" alt="Crispy Chicken" width={500} height={300} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Crispy Crispy Burger</h3>
              <p className={styles.cardDesc}>Pechuga de pollo extra crujiente, jugosa por dentro. Coronado con deliciosa ensalada coleslaw fresca.</p>
              <div className={styles.cardPrice}>$195 MXN</div>
            </div>
          </div>

          {/* Item 4 */}
          <div className={styles.card} onClick={() => setOrderItem('Papas Estilo Pardo')}>
            <div className={styles.cardImage}>
              <Image src="/images/pardo_fries.png" alt="Pardo Fries" width={500} height={300} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>Papas Estilo Pardo</h3>
              <p className={styles.cardDesc}>Corteza extra dorada, preparadas al momento y sazonadas con nuestra mezcla secreta de especias de la casa.</p>
              <div className={styles.cardPrice}>$95 MXN</div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className={styles.testimonialSection}>
        <h2 className={styles.sectionTitle}>Lo que dicen en <span>Google Maps</span></h2>
        <p className={styles.sectionSubtitle}>Reseñas 100% reales de nuestros clientes.</p>

        {loadingReviews ? (
          <p>Cargando comentarios...</p>
        ) : (
          <>
            <div className={styles.testimonialGrid}>
              {reviews.slice(0, visibleReviews).map((r: any, i: number) => (
                <div key={i} className={styles.testimonialCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                    {r.authorAttribution?.photoUri && (
                      <img src={r.authorAttribution.photoUri} alt="Author" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--foreground)' }}>{r.authorAttribution?.displayName || 'Cliente Google'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#888' }}>
                        {'⭐'.repeat(r.rating || 5)} • {r.relativePublishTimeDescription}
                      </div>
                    </div>
                  </div>

                  <p style={{ color: '#555' }}>{r.text?.text || r.text || 'Excelente lugar.'}</p>

                  {/* if review has photos, show thumbnails */}
                  {r.photos && r.photos.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '1rem', overflowX: 'auto' }}>
                      {r.photos.map((photo: any, pIndex: number) => {
                        // Simply use the securely proxied or directly returned URI 
                        // The backend will now deliver fully signed/formed URLs.
                        const photoUrl = photo.authorAttributions?.[0]?.photoUri || photo.uri || "";
                        if (!photoUrl) return null;
                        return (
                          <img
                            key={pIndex}
                            src={photoUrl}
                            alt="Review attached photo"
                            onClick={(e) => { e.stopPropagation(); setSelectedPhoto(photoUrl) }}
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer', border: '1px solid #eee' }}
                          />
                        )
                      })}
                    </div>
                  )}

                  <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLikeReview(r.name) }}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                      👍 Apoyar ({r.localLikes || 0})
                    </button>
                    <a
                      href={r.authorAttribution?.uri || "https://maps.app.goo.gl/9ZfgFX8R8sMBfyTNA"}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: '0.8rem', color: '#888', textDecoration: 'underline' }}
                    >
                      Ver en Maps
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {reviews.length > visibleReviews && (
              <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                <button
                  onClick={() => setVisibleReviews(prev => prev + 6)}
                  className={styles.secondaryButton}
                >
                  ➕ Cargar más testimonios
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* FOOTER CALL TO ACTION */}
      <section className={styles.contentSection}>
        <h2 className={styles.sectionTitle}>¿Listo para <span>Comprobarlo</span>?</h2>
        <p className={styles.sectionSubtitle}>Síguenos en redes o visítanos usando Google Maps.</p>

        <div className={styles.ctaGroup} style={{ marginTop: '2rem' }}>
          <button
            className={styles.secondaryButton}
            onClick={handleOutboundClick("Google Maps", "https://maps.app.goo.gl/sJ2jH1EhwAYfwgDv8")}
          >
            📍 Ver Ubicación en Mapas
          </button>
          <button
            className={styles.secondaryButton}
            onClick={handleOutboundClick("Instagram", "https://www.instagram.com/pardo.burger/")}
          >
            📸 Instagram Oficial
          </button>
          <button
            className={styles.secondaryButton}
            onClick={handleOutboundClick("Facebook", "https://www.facebook.com/people/Pardo-Burger/61579336423578/")}
          >
            👍 Danos Like
          </button>
        </div>

        {/* BOTTOM CONVERSION TUNNEL (UBER & RAPPI) */}
        <h3 style={{ marginTop: '4rem', fontSize: '1.5rem', fontWeight: 800, textAlign: 'center', color: '#1e293b' }}>¿Antojo Inmediato?</h3>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1.5rem' }}>Pide a domicilio y recíbelo calientito en tu puerta.</p>
        <div className={styles.ctaGroup} style={{ justifyContent: 'center' }}>
          <button
            className={styles.primaryButton}
            onClick={handleOutboundClick("Uber Eats - Bottom", "https://www.ubereats.com/mx/store/pardo-burger-puerto-vallarta/9j0Xryx1ROmi9avqkbcFJg")}
          >
            🍔 Pedir en Uber Eats
          </button>
          <button
            className={styles.secondaryButton}
            onClick={handleOutboundClick("Rappi - Bottom", "https://www.rappi.com.mx/restaurantes/1930332407-pardo-burger")}
          >
            🛵 Pedir en Rappi
          </button>
        </div>
      </section>

      {/* CORPORATE LEGAL FOOTER */}
      <footer style={{ background: '#0f172a', color: '#cbd5e1', padding: '4rem 2rem 2rem 2rem', borderTop: '1px solid #1e293b' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '3rem', justifyContent: 'space-between' }}>
          <div style={{ flex: '1 1 300px' }}>
            <h3 style={{ color: '#f8fafc', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>Pardo Burger</h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#94a3b8' }}>
              Las mejores Smash Burgers de Puerto Vallarta. Carne marinada 100% de vaca fresca, sin congelar, y pan brioche súper brillante que no se rompe.
            </p>
            <div style={{ marginTop: '1.5rem', fontSize: '0.85rem' }}>
              <strong>📍 Ubicación Clandestina:</strong><br />
              C. Prol. Brasil 1220 <br />
              5 de Diciembre <br />
              48350 Puerto Vallarta, Jal.
            </div>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <h4 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Soporte Comercial</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><a href="mailto:hola@pardoburger.com" style={{ color: '#cbd5e1', textDecoration: 'none' }}>✉️ hola@pardoburger.com</a></li>
              <li><a href="https://wa.me/523223149867" style={{ color: '#cbd5e1', textDecoration: 'none' }}>📞 +52 322 314 9867</a></li>
              <li>Operación de Martes a Domingo</li>
            </ul>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <h4 style={{ color: '#f8fafc', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Plataforma ERP</h4>
            <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
              Este negocio opera digitalmente sobre la infraestructura tecnológica de <b>AEC (Amazing ERP Creator)</b>.
            </p>
            <Link href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/system`} style={{ display: 'inline-block', marginTop: '1rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1rem', borderRadius: '4px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 'bold' }}>
              🏢 Intranet Empleados
            </Link>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '3rem auto 0 auto', paddingTop: '1.5rem', borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
          <div>&copy; {new Date().getFullYear()} Pardo Burgers. Todos los derechos reservados.</div>
          <div>
            La marca "Pardo Smash Burger", logotipos afines y las recetas estrucuradas son Propiedad Intelectual protegida. Queda estrictamente prohibida la reproducción parcial total sin el consentimiento autografiado.
          </div>
        </div>
      </footer>
      {/* INDEPENDENT PLATFORM SELECTOR MODAL (HIGHEST PRIORITY) */}
      {orderItem && (
         <div style={{
           position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
           background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
           display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999
         }}>
           <div style={{ 
             background: '#1e293b', 
             padding: '3rem', 
             borderRadius: '24px', 
             boxShadow: '0 25px 50px -12px rgba(0,0,0,1)', 
             textAlign: 'center',
             border: '1px solid rgba(255,255,255,0.1)',
             maxWidth: '450px',
             width: '90%'
           }}>
             <h3 style={{ fontSize: '1.8rem', color: '#f8fafc', marginBottom: '0.5rem' }}>Excelente elección</h3>
             <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2rem' }}>Pide tu <strong>{orderItem}</strong> ahora mismo por tu app favorita:</p>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               <a 
                 href="https://www.rappi.com.mx/restaurantes/1930332407-pardo-burger" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 onClick={() => setOrderItem(null)} 
                 style={{
                   background: '#ff441f', color: '#fff', padding: '15px 20px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
                 }}
               >
                 🛵 Pedir por Rappi
               </a>
               <a 
                 href="https://www.ubereats.com/mx/store/pardo-burger-puerto-vallarta/9j0Xryx1ROmi9avqkbcFJg" 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 onClick={() => setOrderItem(null)}
                 style={{
                   background: '#06C167', color: '#fff', padding: '15px 20px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 'bold', textDecoration: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
                 }}
               >
                 🚙 Pedir por Uber Eats
               </a>
               <button onClick={() => setOrderItem(null)} style={{ background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', padding: '15px', borderRadius: '12px', fontSize: '1rem', marginTop: '10px', cursor: 'pointer' }}>
                 Cerrar
               </button>
             </div>
           </div>
         </div>
      )}
    </main>
  );
}
