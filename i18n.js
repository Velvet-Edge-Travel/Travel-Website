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
  Object.assign(translations, {
    "Curiosity is our compass.": ["La curiosité est notre boussole.", "Neugier ist unser Kompass.", "La curiosidad es nuestra brújula.", "La curiosità è la nostra bussola."],
    "We travel deeply, listen closely and design every journey as if it were our own.": ["Nous voyageons en profondeur, écoutons attentivement et concevons chaque voyage comme si c’était le nôtre.", "Wir reisen intensiv, hören genau zu und gestalten jede Reise, als wäre sie unsere eigene.", "Viajamos a fondo, escuchamos atentamente y diseñamos cada viaje como si fuera nuestro.", "Viaggiamo in profondità, ascoltiamo con attenzione e progettiamo ogni viaggio come se fosse il nostro."],
    "Our beginning": ["Nos débuts", "Unser Anfang", "Nuestro comienzo", "Il nostro inizio"],
    "Born from a love of going further": ["Née de l’envie d’aller plus loin", "Aus Liebe zum Weiterreisen entstanden", "Nacida del deseo de ir más allá", "Nata dall’amore per andare oltre"],
    "What guides us": ["Ce qui nous guide", "Was uns leitet", "Lo que nos guía", "Ciò che ci guida"],
    "Our promises": ["Nos engagements", "Unsere Versprechen", "Nuestras promesas", "Le nostre promesse"],
    "We listen first": ["Nous écoutons d’abord", "Wir hören zuerst zu", "Primero escuchamos", "Prima ascoltiamo"],
    "We choose with care": ["Nous choisissons avec soin", "Wir wählen mit Sorgfalt", "Elegimos con cuidado", "Scegliamo con cura"],
    "We travel responsibly": ["Nous voyageons de manière responsable", "Wir reisen verantwortungsvoll", "Viajamos de forma responsable", "Viaggiamo responsabilmente"],
    "A world of experience": ["Un monde d’expérience", "Eine Welt voller Erfahrung", "Un mundo de experiencia", "Un mondo di esperienza"],
    "Knowledge you can feel": ["Un savoir qui se ressent", "Wissen, das man spürt", "Conocimiento que se siente", "Conoscenza che si percepisce"],
    "Our people": ["Notre équipe", "Unser Team", "Nuestro equipo", "Il nostro team"],
    "Meet your travel designer": ["Rencontrez votre conseiller", "Lernen Sie Ihren Reiseberater kennen", "Conozca a su asesor", "Incontra il tuo consulente"],
    "The world, chosen well": ["Le monde, choisi avec soin", "Die Welt, gut gewählt", "El mundo, bien elegido", "Il mondo, scelto bene"],
    "Find your place in the world.": ["Trouvez votre place dans le monde.", "Finden Sie Ihren Platz in der Welt.", "Encuentre su lugar en el mundo.", "Trova il tuo posto nel mondo."],
    "Where we travel": ["Où nous voyageons", "Wohin wir reisen", "Adónde viajamos", "Dove viaggiamo"],
    "Places we know and love": ["Des lieux que nous connaissons et aimons", "Orte, die wir kennen und lieben", "Lugares que conocemos y amamos", "Luoghi che conosciamo e amiamo"],
    "Old worlds, new perspectives": ["Des mondes anciens, de nouveaux regards", "Alte Welten, neue Perspektiven", "Mundos antiguos, nuevas perspectivas", "Mondi antichi, nuove prospettive"],
    "Wildness in its purest form": ["La nature sauvage à l’état pur", "Wildnis in ihrer reinsten Form", "Naturaleza en su forma más pura", "Natura selvaggia nella sua forma più pura"],
    "Tradition meets tomorrow": ["La tradition rencontre demain", "Tradition trifft auf morgen", "La tradición se encuentra con el mañana", "La tradizione incontra il domani"],
    "Big skies and bold cities": ["Des ciels immenses et des villes audacieuses", "Weite Himmel und mutige Städte", "Cielos inmensos y ciudades audaces", "Cieli immensi e città audaci"],
    "Rhythm, colour and scale": ["Rythme, couleur et grandeur", "Rhythmus, Farbe und Weite", "Ritmo, color y escala", "Ritmo, colore e grandezza"],
    "Barefoot, beautifully": ["Pieds nus, tout simplement", "Barfuß, wunderschön", "Descalzo, bellamente", "A piedi nudi, meravigliosamente"],
    "Not sure where?": ["Vous hésitez ?", "Noch unentschlossen?", "¿No sabe dónde?", "Non sai dove?"],
    "Start with how you want to feel.": ["Commencez par ce que vous voulez ressentir.", "Beginnen Sie damit, wie Sie sich fühlen möchten.", "Empiece por cómo quiere sentirse.", "Inizia da come vuoi sentirti."],
    "Great courses.": ["Des parcours d’exception.", "Großartige Plätze.", "Grandes campos.", "Grandi campi."],
    "Unforgettable settings.": ["Des cadres inoubliables.", "Unvergessliche Kulissen.", "Entornos inolvidables.", "Scenari indimenticabili."],
    "Tee times worth travelling for": ["Des départs qui valent le voyage", "Abschlagszeiten, für die sich die Reise lohnt", "Horas de salida por las que vale viajar", "Tee time per cui vale viaggiare"],
    "Golf, elevated": ["Le golf, réinventé", "Golf, neu gedacht", "Golf elevado", "Golf, elevato"],
    "Play the world beautifully": ["Jouez le monde avec élégance", "Spielen Sie die Welt auf schöne Weise", "Juegue el mundo con elegancia", "Gioca il mondo con stile"],
    "Every detail handled": ["Chaque détail pris en charge", "Jedes Detail geregelt", "Cada detalle resuelto", "Ogni dettaglio gestito"],
    "Arrive ready to play": ["Arrivez prêt à jouer", "Kommen Sie spielbereit an", "Llegue listo para jugar", "Arriva pronto a giocare"],
    "Our signature collection": ["Notre collection Signature", "Unsere Signature-Kollektion", "Nuestra colección Signature", "La nostra collezione Signature"],
    "Journeys with a sense of wonder.": ["Des voyages empreints d’émerveillement.", "Reisen voller Staunen.", "Viajes con sentido de asombro.", "Viaggi pieni di meraviglia."],
    "Handpicked by us, made yours": ["Choisis par nous, faits pour vous", "Von uns ausgewählt, für Sie gemacht", "Elegidos por nosotros, hechos suyos", "Scelti da noi, fatti tuoi"],
    "Ideas to inspire your next great journey": ["Des idées pour inspirer votre prochain grand voyage", "Ideen für Ihre nächste große Reise", "Ideas para inspirar su próximo gran viaje", "Idee per ispirare il tuo prossimo grande viaggio"],
    "The Velvet Edge collection": ["La collection Velvet Edge", "Die Velvet-Edge-Kollektion", "La colección Velvet Edge", "La collezione Velvet Edge"],
    "Somewhere extraordinary.": ["Quelque part d’extraordinaire.", "Irgendwo außergewöhnlich.", "En algún lugar extraordinario.", "Da qualche parte straordinario."],
    "Your next chapter": ["Votre prochain chapitre", "Ihr nächstes Kapitel", "Su próximo capítulo", "Il tuo prossimo capitolo"],
    "Find a journey that feels like you.": ["Trouvez un voyage qui vous ressemble.", "Finden Sie eine Reise, die zu Ihnen passt.", "Encuentre un viaje que se sienta como usted.", "Trova un viaggio che ti somigli."],
    "Region": ["Région", "Region", "Región", "Regione"],
    "Holiday style": ["Style de voyage", "Reisestil", "Estilo de viaje", "Stile di viaggio"],
    "Duration": ["Durée", "Dauer", "Duración", "Durata"],
    "Sort by": ["Trier par", "Sortieren nach", "Ordenar por", "Ordina per"],
    "Begin your journey": ["Commencez votre voyage", "Beginnen Sie Ihre Reise", "Comience su viaje", "Inizia il tuo viaggio"],
    "Tell us what you are dreaming of.": ["Dites-nous ce dont vous rêvez.", "Erzählen Sie uns, wovon Sie träumen.", "Cuéntenos con qué sueña.", "Raccontaci cosa sogni."],
    "Speak with us": ["Parlez-nous", "Sprechen Sie mit uns", "Hable con nosotros", "Parla con noi"],
    "It starts with a conversation.": ["Tout commence par une conversation.", "Es beginnt mit einem Gespräch.", "Todo empieza con una conversación.", "Tutto inizia con una conversazione."],
  });
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
    const generated = window.VELVET_I18N_CATALOG?.[locale];
    if (generated) {
      const key = Object.keys(window.VELVET_I18N_CATALOG.en || {}).find(candidate => window.VELVET_I18N_CATALOG.en[candidate] === source.trim());
      if (key && generated[key]) return generated[key];
    }
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
        const generated = window.VELVET_I18N_CATALOG?.[locale];
        const key = Object.keys(window.VELVET_I18N_CATALOG?.en || {}).find(candidate => window.VELVET_I18N_CATALOG.en[candidate] === source);
        const generatedValue = key && generated?.[key];
        if (generatedValue) { element.setAttribute(attribute, generatedValue); return; }
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
