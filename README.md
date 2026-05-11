# VillaNova, La culture vit ici

Plateforme culturelle web qui centralise les événements d'une ville (concerts, expos, théâtre, ateliers, festivals…) en s'appuyant sur l'API OpenAgenda.

## Aperçu

VillaNova permet aux habitants de découvrir facilement l'offre culturelle locale :
- Recherche et filtrage d'événements par catégorie
- Fiches détaillées pour chaque événement (lieu, date, tarif, description)
- Mood Picker pour explorer selon son humeur
- Section événements gratuits
- Design responsive (mobile-first)

## Stack technique

- **HTML5** sémantique avec attributs d'accessibilité (ARIA, skip-link…)
- **SASS / CSS** architecture modulaire (abstracts, base, components, layout)
- **JavaScript vanilla** (ES6+, async/await) aucun framework
- **API OpenAgenda v2** pour la récupération dynamique des événements
- **Google Fonts** Fraunces, Inter, JetBrains Mono

Pas de bundler ni de dépendances npm. Le projet tourne en statique.

## Structure du projet

```
VillaNova/
├── index.html                 # Page d'accueil
├── tous-les-evenements.html   # Liste complète des événements
├── evenements.html            # Page détail d'un événement
├── css/
│   └── style.css              # CSS compilé
├── sass/
│   ├── style.scss             # Point d'entrée SASS
│   ├── abstracts/             # Variables, mixins
│   ├── base/                  # Reset, typographie
│   ├── components/            # Boutons, cards, tags, filtres
│   └── layout/                # Header, hero, sections, footer
├── js/
│   ├── api.js                 # Client API (fetch, pagination)
│   ├── event-card.js          # Construction des cartes événement
│   ├── home.js                # Logique page d'accueil
│   ├── events-listing.js      # Logique page listing
│   ├── event-detail.js        # Logique page détail
│   └── mobile-menu.js         # Menu hamburger mobile
└── assets/
    ├── icons/                 # Icônes SVG
    └── images/                # Images (AVIF, WebP, PNG)
```

## Lancer le projet

Aucune installation nécessaire. Il suffit d'ouvrir `index.html` dans un navigateur ou d'utiliser un serveur local type Live Server (extension VS Code).

Pour modifier le SASS, utiliser l'extension **Live Sass Compiler** dans VS Code ou tout autre compilateur SASS.

## API utilisée

Les données événementielles proviennent de l'API **OpenAgenda** (v2).
- Documentation : [https://developers.openagenda.com](https://developers.openagenda.com)

## Accessibilité

Le projet suit les bonnes pratiques d'accessibilité :
- Navigation au clavier
- Attributs ARIA et balises sémantiques
- Textes alternatifs sur les images
- Annonces pour lecteurs d'écran
- Conformité visée : RGAA 4.1

## Auteur

Projet réalisé dans le cadre de la formation à **La Plateforme**.
