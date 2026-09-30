/* Une page ouverte directement sur une ancre (experiences.html#phasage, un lien
   du sommaire, une adresse collee) reste en haut : le defilement doux du site
   empeche le saut initial. On repositionne une fois la page chargee, sans doux
   pour cette fois-la, puis on rend le doux aux clics suivants. */
(function () {
  if (!location.hash) return;
  var cible;
  try { cible = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { return; }
  if (!cible) return;

  /* Sinon le navigateur restaure la position precedente apres le chargement et
     ecrase le saut a l'ancre. Une adresse qui nomme sa cible prime sur elle. */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function aller() {
    var racine = document.documentElement;
    var doux = racine.style.scrollBehavior;
    racine.style.scrollBehavior = 'auto';
    cible.scrollIntoView();
    racine.style.scrollBehavior = doux;
  }

  /* Servie depuis le cache, la page peut deja etre chargee quand ce script
     s'execute : l'evenement load ne se represente pas, il faut y aller tout de
     suite. Les images portent toutes leurs dimensions, la hauteur de la page
     est donc deja juste a ce moment-la. */
  if (document.readyState === 'complete') aller();
  else window.addEventListener('load', aller);
})();


/* Apparition au defilement. Sans ce script, tout reste visible. */
(function () {
  var items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    for (var i = 0; i < items.length; i++) items[i].classList.add('is-in');
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
      setTimeout(function () { el.classList.add('is-in'); }, delay);
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  for (var j = 0; j < items.length; j++) io.observe(items[j]);
})();


/* Etude de cas : le curseur des annees pilote la carte et le tableau de bord.
   Chiffres fictifs, coherents entre eux : la somme par type et par quartier
   vaut toujours le realise de l'annee, et le cumul est la somme des annees. */
(function () {
  /* Deux curseurs, un au pied de la carte, un au pied du tableau de bord :
     bouger l'un deplace l'autre, les deux vues restent sur la meme annee. */
  var curseurs = [].slice.call(document.querySelectorAll('.webmap__range'));
  if (!curseurs.length) return;

  /* Chaque annuel est la longueur reellement dessinee cette annee-la sur la carte,
     divisee par l'echelle affichee (99 px pour 2 km). Le trace et les colonnes
     grandissent donc ensemble, et le total tombe sur les 58 km du cumul. */
  var DONNEES = {
    2020: { annuel: 3.7, piste: 1.5, bande: 1.5, voie: 0.7, nord: 1.4, centre: 1.3, sud: 1.0 },
    2021: { annuel: 5.9, piste: 2.4, bande: 2.4, voie: 1.1, nord: 2.3, centre: 2.0, sud: 1.6 },
    2022: { annuel: 7.3, piste: 3.1, bande: 2.9, voie: 1.3, nord: 2.9, centre: 2.4, sud: 2.0 },
    2023: { annuel: 7.7, piste: 3.4, bande: 3.0, voie: 1.3, nord: 3.1, centre: 2.5, sud: 2.1 },
    2024: { annuel: 10.3, piste: 4.8, bande: 3.6, voie: 1.9, nord: 4.3, centre: 3.2, sud: 2.8 },
    2025: { annuel: 10.3, piste: 5.0, bande: 3.5, voie: 1.8, nord: 4.4, centre: 3.1, sud: 2.8 },
    2026: { annuel: 12.8, piste: 6.3, bande: 4.2, voie: 2.3, nord: 5.4, centre: 4.0, sud: 3.4 }
  };
  var OBJECTIF = 80;
  var MIN = 2020;

  /* Toujours une decimale, y compris pour un cumul rond : sinon la serie passe
     de « 45,6 » a « 58 » en bougeant le curseur, et le chiffre a l'air d'un autre. */
  function fr(n) { return n.toFixed(1).replace('.', ','); }
  function txt(id, v) { var e = document.getElementById(id); if (e) e.textContent = v; }
  function tous(classe, v) {
    var l = document.querySelectorAll('.' + classe);
    for (var i = 0; i < l.length; i++) l[i].textContent = v;
  }

  function barre(idBarre, idValeur, valeur, max) {
    var b = document.getElementById(idBarre);
    var v = document.getElementById(idValeur);
    if (b) b.style.width = Math.max(6, (valeur / max) * 100) + '%';
    if (v) v.textContent = fr(valeur);
  }

  var troncons = document.querySelectorAll('.troncon');
  var colonnes = document.querySelectorAll('#colonnes .dash__year');

  function rendre(annee) {
    var d = DONNEES[annee];
    if (!d) return;

    /* La carte : on n'affiche que ce qui est realise jusqu'a l'annee choisie */
    for (var i = 0; i < troncons.length; i++) {
      var a = parseInt(troncons[i].getAttribute('data-annee'), 10);
      troncons[i].classList.toggle('is-off', a > annee);
    }

    /* Le cumul depuis 2020 */
    var cumul = 0;
    for (var an = MIN; an <= annee; an++) cumul += DONNEES[an].annuel;
    cumul = Math.round(cumul * 10) / 10;
    var pct = Math.min(100, (cumul / OBJECTIF) * 100);

    tous('annee-lue', String(annee));
    txt('f-annee', String(annee));
    txt('k-annee', String(annee));
    txt('v-annuel', fr(d.annuel));
    txt('v-cumul', fr(cumul));
    txt('v-cumul-2', fr(cumul));
    txt('v-pct', Math.round(pct) + ' %');
    var fill = document.getElementById('v-fill');
    if (fill) fill.style.width = pct + '%';

    /* Les deux repartitions, chacune ramenee a son propre maximum */
    var maxType = Math.max(d.piste, d.bande, d.voie);
    barre('b-piste', 'v-piste', d.piste, maxType);
    barre('b-bande', 'v-bande', d.bande, maxType);
    barre('b-voie', 'v-voie', d.voie, maxType);

    var maxQ = Math.max(d.nord, d.centre, d.sud);
    barre('b-nord', 'v-nord', d.nord, maxQ);
    barre('b-centre', 'v-centre', d.centre, maxQ);
    barre('b-sud', 'v-sud', d.sud, maxQ);

    /* Les colonnes annuelles : celles d'apres l'annee choisie s'effacent */
    for (var k = 0; k < colonnes.length; k++) {
      var ca = parseInt(colonnes[k].getAttribute('data-annee'), 10);
      colonnes[k].classList.toggle('is-off', ca > annee);
      colonnes[k].classList.toggle('is-now', ca === annee);
    }

    /* La partie remplie, et les curseurs remis d'accord entre eux */
    var p = ((annee - MIN) / (curseurs[0].max - MIN)) * 100;
    for (var c = 0; c < curseurs.length; c++) {
      curseurs[c].value = annee;
      curseurs[c].style.setProperty('--p', p + '%');
    }
  }

  curseurs.forEach(function (c) {
    c.addEventListener('input', function () { rendre(parseInt(c.value, 10)); });
  });
  rendre(parseInt(curseurs[0].value, 10));
})();


/* Carrousel de cartes. Sans script, la piste reste simplement defilable
   a la main ou au doigt, et la barre de commande n'apparait pas. */
(function () {
  var c = document.querySelector('[data-carrousel]');
  if (!c) return;

  var piste = c.querySelector('.carrousel__piste');
  var vues = [].slice.call(c.querySelectorAll('.carrousel__vue'));
  var points = [].slice.call(c.querySelectorAll('.carrousel__point'));
  var boutons = [].slice.call(c.querySelectorAll('.carrousel__b'));
  if (!piste || vues.length < 2) return;

  var doux = !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function courante() {
    var ref = piste.scrollLeft;
    var meilleure = 0, ecart = Infinity;
    for (var i = 0; i < vues.length; i++) {
      var d = Math.abs(vues[i].offsetLeft - piste.offsetLeft - ref);
      if (d < ecart) { ecart = d; meilleure = i; }
    }
    return meilleure;
  }

  /* L'etat se peint a partir de l'indice, pas de la position : les pastilles
     repondent tout de suite au clic, sans attendre la fin du defilement. */
  function peindre(i) {
    for (var k = 0; k < points.length; k++) {
      points[k].classList.toggle('is-on', k === i);
      points[k].setAttribute('aria-current', k === i ? 'true' : 'false');
    }
  }

  /* L'indice vise est retenu : sans ca, deux clics rapides se perdent, le
     second relisant la position pendant que le defilement est en cours. */
  var actuel = 0;

  /* La piste prend la hauteur de la vue affichee. Sans ca, toutes les vues
     s'alignent sur la plus haute, celle qui porte la chaine des etapes, et les
     autres laissent un vide sous leur texte avant les fleches.
     On grandit avant de defiler et on retrecit apres : dans l'autre sens, la
     vue visee serait coupee en bas pendant le mouvement. */
  function ajusterHauteur(i, moment) {
    var v = vues[i];
    if (!v) return;
    var cible = v.offsetHeight;
    if (!cible) return;
    if (moment === 'apres' || cible > piste.offsetHeight) piste.style.height = cible + 'px';
  }

  var minuteur;

  /* On boucle : apres la derniere vue on revient a la premiere, et inversement */
  function aller(i) {
    var n = vues.length;
    actuel = ((i % n) + n) % n;
    ajusterHauteur(actuel, 'avant');
    piste.scrollTo({ left: vues[actuel].offsetLeft - piste.offsetLeft, behavior: doux ? 'smooth' : 'auto' });
    peindre(actuel);
    clearTimeout(minuteur);
    minuteur = setTimeout(function () { ajusterHauteur(actuel, 'apres'); }, doux ? 420 : 0);
  }

  function rafraichir() {
    actuel = courante();
    peindre(actuel);
    ajusterHauteur(actuel, 'apres');
  }

  boutons.forEach(function (b) {
    b.addEventListener('click', function () {
      aller(actuel + parseInt(b.getAttribute('data-pas'), 10));
    });
  });

  points.forEach(function (p, i) {
    p.addEventListener('click', function () { aller(i); });
  });

  piste.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); aller(actuel + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); aller(actuel - 1); }
  });

  var attente;
  piste.addEventListener('scroll', function () {
    clearTimeout(attente);
    attente = setTimeout(rafraichir, 90);
  }, { passive: true });

  window.addEventListener('resize', rafraichir);
  rafraichir();
})();


/* Sur telephone, les onglets defilent horizontalement et le dernier sort du
   cadre. Celui de la page ouverte doit etre visible : on l'amene au centre. */
(function () {
  var barre = document.querySelector('.nav__links');
  if (!barre) return;
  var actif = barre.querySelector('[aria-current]');
  if (!actif) return;
  var debord = barre.scrollWidth - barre.clientWidth;
  if (debord <= 0) return;
  var vise = actif.offsetLeft + actif.offsetWidth / 2 - barre.clientWidth / 2;
  barre.scrollLeft = Math.max(0, Math.min(vise, debord));
})();


/* Mentions en bulle : un toucher ouvre, un second ferme, comme un toucher
   ailleurs ou la touche Echap. A la souris, le survol suffit (feuille de style). */
(function () {
  var boutons = [].slice.call(document.querySelectorAll('.info__b'));
  if (!boutons.length) return;
  function fermer(sauf) {
    boutons.forEach(function (b) { if (b !== sauf) b.setAttribute('aria-expanded', 'false'); });
  }
  boutons.forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      b.setAttribute('aria-expanded', b.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
      fermer(b);
    });
  });
  document.addEventListener('click', function () { fermer(null); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fermer(null); });
})();
