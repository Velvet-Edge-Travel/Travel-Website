/* Site-wide language selection for Velvet Edge Travel. */
(() => {
  "use strict";

  const storageKey = "velvet-locale-v1";
  const locales = {
    en: { label: "English", native: "English" },
    fr: { label: "French", native: "Français" },
    de: { label: "German", native: "Deutsch" },
    es: { label: "Spanish", native: "Español" },
    it: { label: "Italian", native: "Italiano" },
  };
  const translations = {
    "Skip to content": ["Aller au contenu", "Zum Inhalt springen", "Ir al contenido", "Vai al contenuto"],
    "Find a holiday": ["Trouver un voyage", "Reise finden", "Encontrar un viaje", "Trova un viaggio"],
    "Golf journeys": ["Voyages golf", "Golfreisen", "Viajes de golf", "Viaggi golf"],
    "Destinations": ["Destinations", "Reiseziele", "Destinos", "Destinazioni"],
    "Our story": ["Notre histoire", "Unsere Geschichte", "Nuestra historia", "La nostra storia"],
    "Saved": ["Enregistrés", "Gespeichert", "Guardados", "Salvati"],
    "Plan my journey": ["Planifier mon voyage", "Meine Reise planen", "Planificar mi viaje", "Pianifica il mio viaggio"],
    "Find my holiday": ["Trouver mon voyage", "Meine Reise finden", "Encontrar mi viaje", "Trova il mio viaggio"],
    "Speak to a designer": ["Parler à un conseiller", "Mit einem Reiseberater sprechen", "Hablar con un asesor", "Parla con un consulente"],
    "Discover": ["Découvrir", "Entdecken", "Descubrir", "Scopri"],
    "Explore holidays": ["Explorer les voyages", "Reisen entdecken", "Explorar viajes", "Esplora i viaggi"],
    "Our philosophy": ["Notre philosophie", "Unsere Philosophie", "Nuestra filosofía", "La nostra filosofia"],
    "View all holidays": ["Voir tous les voyages", "Alle Reisen ansehen", "Ver todos los viajes", "Vedi tutti i viaggi"],
    "Explore": ["Explorer", "Entdecken", "Explorar", "Esplora"],
    "See the collection": ["Voir la collection", "Die Kollektion ansehen", "Ver la colección", "Vedi la collezione"],
    "Plan a journey": ["Planifier un voyage", "Eine Reise planen", "Planificar un viaje", "Pianifica un viaggio"],
    "Travel enquiries": ["Demandes de voyage", "Reiseanfragen", "Consultas de viaje", "Richieste di viaggio"],
    "Contact": ["Contact", "Kontakt", "Contacto", "Contatti"],
    "Privacy policy": ["Politique de confidentialité", "Datenschutz", "Política de privacidad", "Informativa sulla privacy"],
    "Enquiry information": ["Informations sur la demande", "Informationen zur Anfrage", "Información de la consulta", "Informazioni sulla richiesta"],
    "Signature Holidays": ["Voyages Signature", "Signature-Reisen", "Viajes Signature", "Viaggi Signature"],
    "Golf Packages": ["Séjours golf", "Golfpakete", "Paquetes de golf", "Pacchetti golf"],
    "About Velvet Edge": ["À propos de Velvet Edge", "Über Velvet Edge", "Sobre Velvet Edge", "Informazioni su Velvet Edge"],
    "Travel Enquiry": ["Demande de voyage", "Reiseanfrage", "Consulta de viaje", "Richiesta di viaggio"],
    "Company": ["Entreprise", "Unternehmen", "Empresa", "Azienda"],
    "Concierge": ["Conciergerie", "Concierge", "Conserjería", "Concierge"],
    "Open navigation": ["Ouvrir la navigation", "Navigation öffnen", "Abrir navegación", "Apri navigazione"],
    "Close navigation": ["Fermer la navigation", "Navigation schließen", "Cerrar navegación", "Chiudi navigazione"],
    "Private journeys, beautifully considered": ["Des voyages privés, pensés avec soin", "Private Reisen, mit Bedacht gestaltet", "Viajes privados, cuidadosamente diseñados", "Viaggi privati, pensati con cura"],
    "Travel beyond the": ["Voyagez au-delà de", "Reisen Sie über das", "Viaje más allá de", "Viaggia oltre"],
    "expected.": ["l’attendu.", "Erwartete hinaus.", "esperado.", "l’ordinario."],
    "Journeys to remember": ["Des voyages inoubliables", "Reisen, die bleiben", "Viajes para recordar", "Viaggi da ricordare"],
    "Luxury, made personal": ["Le luxe, à votre image", "Luxus, ganz persönlich", "Lujo, hecho personal", "Il lusso, personale"],
    "The Velvet Edge way": ["L’art de voyager avec Velvet Edge", "Die Velvet-Edge-Art", "El estilo Velvet Edge", "Il modo Velvet Edge"],
    "Not a holiday.": ["Pas de simples vacances.", "Nicht nur ein Urlaub.", "No son unas vacaciones.", "Non è una vacanza."],
    "A story worth telling.": ["Une histoire à raconter.", "Eine Geschichte, die es wert ist, erzählt zu werden.", "Una historia que merece ser contada.", "Una storia da raccontare."],
    "Curated for this season": ["Pensé pour cette saison", "Für diese Saison kuratiert", "Seleccionado para esta temporada", "Selezionato per questa stagione"],
    "Why travel with us": ["Pourquoi voyager avec nous", "Warum mit uns reisen", "Por qué viajar con nosotros", "Perché viaggiare con noi"],
    "Made around you": ["Conçu autour de vous", "Ganz auf Sie zugeschnitten", "Hecho a su medida", "Pensato intorno a te"],
    "Your journey": ["Votre voyage", "Ihre Reise", "Tu viaje", "Il tuo viaggio"],
    "Your journey. Your rhythm.": ["Votre voyage. Votre rythme.", "Ihre Reise. Ihr Rhythmus.", "Tu viaje. Tu ritmo.", "Il tuo viaggio. Il tuo ritmo."],
    "Back to the collection": ["Retour à la collection", "Zurück zur Kollektion", "Volver a la colección", "Torna alla collezione"],
    "Make it your own": ["Faites-en le vôtre", "Machen Sie sie zu Ihrer Reise", "Hágalo suyo", "Rendilo tuo"],
    "Begin the conversation": ["Commençons la conversation", "Beginnen Sie das Gespräch", "Empecemos la conversación", "Iniziamo la conversazione"],
    "Your tailored quote": ["Votre devis sur mesure", "Ihr individuelles Angebot", "Su presupuesto a medida", "Il tuo preventivo su misura"],
    "Enquire about this journey": ["Demander des informations", "Diese Reise anfragen", "Consultar este viaje", "Richiedi informazioni"],
    "Save journey": ["Enregistrer le voyage", "Reise speichern", "Guardar viaje", "Salva viaggio"],
    "Saved journey": ["Voyage enregistré", "Gespeicherte Reise", "Viaje guardado", "Viaggio salvato"],
    "Every journey is tailor-made · Enquire for your personal quote": ["Chaque voyage est sur mesure · Demandez votre devis personnel", "Jede Reise ist maßgeschneidert · Fragen Sie Ihr persönliches Angebot an", "Cada viaje está hecho a medida · Solicite su presupuesto personal", "Ogni viaggio è su misura · Richiedi il tuo preventivo personale"],
    "Design something personal": ["Créer quelque chose de personnel", "Etwas Persönliches gestalten", "Diseñar algo personal", "Crea qualcosa di personale"],
    "Not quite your kind of escape?": ["Pas tout à fait votre idée de l’évasion ?", "Noch nicht Ihre Art von Auszeit?", "¿No es exactamente su tipo de escapada?", "Non è proprio il tuo tipo di fuga?"],
    "Your journey": ["Votre voyage", "Ihre Reise", "Tu viaje", "Il tuo viaggio"],
    "About you": ["À votre sujet", "Über Sie", "Sobre usted", "Su di te"],
    "Review": ["Vérifier", "Prüfen", "Revisar", "Rivedi"],
    "Adults": ["Adultes", "Erwachsene", "Adultos", "Adulti"],
    "Children": ["Enfants", "Kinder", "Niños", "Bambini"],
    "Send enquiry": ["Envoyer la demande", "Anfrage senden", "Enviar consulta", "Invia richiesta"],
    "Download enquiry": ["Télécharger la demande", "Anfrage herunterladen", "Descargar consulta", "Scarica richiesta"],
    "Previous": ["Précédent", "Zurück", "Anterior", "Indietro"],
    "Continue": ["Continuer", "Weiter", "Continuar", "Continua"],
    "Explore destinations": ["Explorer les destinations", "Reiseziele entdecken", "Explorar destinos", "Esplora destinazioni"],
    "Meet Velvet Edge": ["Découvrez Velvet Edge", "Velvet Edge kennenlernen", "Conozca Velvet Edge", "Scopri Velvet Edge"],
    "Get in touch": ["Nous contacter", "Kontakt aufnehmen", "Póngase en contacto", "Contattaci"],
    "Luxury golf, perfectly played.": ["Le golf de luxe, parfaitement orchestré.", "Luxusgolf, perfekt gespielt.", "Golf de lujo, perfectamente jugado.", "Golf di lusso, giocato alla perfezione."],
    "Signature journeys": ["Voyages Signature", "Signature-Reisen", "Viajes Signature", "Viaggi Signature"],
    "All rights reserved.": ["Tous droits réservés.", "Alle Rechte vorbehalten.", "Todos los derechos reservados.", "Tutti i diritti riservati."],
  };
  const attributeTranslations = {
    "Choose language": ["Choisir la langue", "Sprache auswählen", "Elegir idioma", "Scegli lingua"],
    "Velvet Edge Travel home": ["Accueil Velvet Edge Travel", "Velvet Edge Travel Startseite", "Inicio de Velvet Edge Travel", "Home Velvet Edge Travel"],
    "Open navigation": ["Ouvrir la navigation", "Navigation öffnen", "Abrir navegación", "Apri navigazione"],
    "Close navigation": ["Fermer la navigation", "Navigation schließen", "Cerrar navegación", "Chiudi navigazione"],
    "A destination, a feeling, a favourite pastime": ["Une destination, une émotion, une passion", "Ein Reiseziel, ein Gefühl, ein Lieblingszeitvertreib", "Un destino, una sensación, una afición favorita", "Una destinazione, una sensazione, un passatempo preferito"],
  };
  const originalText = new WeakMap();
  const indexFor = locale => ["fr", "de", "es", "it"].indexOf(locale);
  const currentLocale = () => document.documentElement.lang || "en";
  const translated = (source, locale) => {
    const entry = translations[source.trim()];
    const index = indexFor(locale);
    return entry && index >= 0 ? entry[index] : source;
  };
  const translateTree = (root = document.body) => {
    const locale = currentLocale();
    if (locale === "en" || !root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue.trim() || node.parentElement?.closest("script, style, select, option, textarea")) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const original = originalText.get(node) || node.nodeValue;
      originalText.set(node, original);
      const match = original.match(/^(\s*)(.*?)(\s*)$/);
      const value = translated(match[2], locale);
      if (value !== match[2]) node.nodeValue = `${match[1]}${value}${match[3]}`;
    });
    root.querySelectorAll?.("[aria-label], [placeholder], [title]").forEach(element => {
      ["aria-label", "placeholder", "title"].forEach(attribute => {
        const source = element.dataset[`i18n${attribute.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}`] || element.getAttribute(attribute);
        element.dataset[`i18n${attribute.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}`] = source;
        const entry = attributeTranslations[source];
        const index = indexFor(locale);
        if (entry && index >= 0) element.setAttribute(attribute, entry[index]);
      });
    });
  };
  const restoreEnglish = () => location.reload();
  const setLocale = locale => {
    if (!locales[locale]) return;
    try { localStorage.setItem(storageKey, locale); } catch {}
    if (locale === "en" && currentLocale() !== "en") { restoreEnglish(); return; }
    document.documentElement.lang = locale;
    document.documentElement.dir = "ltr";
    document.querySelectorAll("[data-language-picker]").forEach(picker => picker.value = locale);
    translateTree();
    document.dispatchEvent(new CustomEvent("velvet:localechange", { detail: { locale } }));
  };
  const addPicker = () => {
    document.querySelectorAll(".nav").forEach(nav => {
      if (nav.querySelector("[data-language-picker]")) return;
      const label = document.createElement("label");
      label.className = "language-picker";
      label.innerHTML = '<span class="sr-only">Choose language</span><select data-language-picker aria-label="Choose language"></select>';
      const select = label.querySelector("select");
      Object.entries(locales).forEach(([code, language]) => {
        const option = new Option(language.native, code);
        option.lang = code;
        select.add(option);
      });
      select.value = currentLocale();
      select.addEventListener("change", () => setLocale(select.value));
      const links = nav.querySelector(".nav__links");
      nav.insertBefore(label, links || null);
    });
  };
  const addStyles = () => {
    const style = document.createElement("style");
    style.textContent = '.language-picker{display:inline-flex;align-items:center;margin-left:auto;color:inherit}.language-picker select{min-height:34px;max-width:94px;padding:0 24px 0 9px;border:1px solid currentColor;border-radius:0;color:inherit;background:transparent;font-size:.68rem;font-weight:600;letter-spacing:.06em;cursor:pointer}.language-picker option{color:#12100e;background:#fff}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media (max-width:1000px){.language-picker{margin-left:auto}.nav{gap:10px}.language-picker select{max-width:72px;padding-left:6px;font-size:.62rem}}';
    document.head.append(style);
  };
  const initialLocale = (() => {
    try { const saved = localStorage.getItem(storageKey); if (locales[saved]) return saved; } catch {}
    const browserLocale = navigator.language.slice(0, 2).toLowerCase();
    return locales[browserLocale] ? browserLocale : "en";
  })();
  addStyles();
  document.documentElement.lang = initialLocale;
  addPicker();
  translateTree();
  new MutationObserver(records => {
    if (currentLocale() === "en") return;
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) translateTree(node);
      if (node.nodeType === Node.TEXT_NODE && node.parentElement) translateTree(node.parentElement);
    }));
  }).observe(document.body, { childList: true, subtree: true });
  window.VelvetI18n = { getLocale: currentLocale, setLocale, translate: translateTree, locales };
})();
