// page carte interactive

(function () {
  'use strict';

  var mapContainer = document.getElementById('map');
  if (!mapContainer) return;

  // coordonnees de Marseille (centre par defaut)
  var DEFAULT_LAT = 43.2965;
  var DEFAULT_LNG = 5.3698;
  var DEFAULT_ZOOM = 13;

  // initialise la carte Leaflet
  var map = L.map('map', {
    scrollWheelZoom: false
  }).setView([DEFAULT_LAT, DEFAULT_LNG], DEFAULT_ZOOM);

  // tuiles OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  // icone personnalisee pour les marqueurs
  var eventIcon = L.divIcon({
    className: 'map-marker',
    html: '<span class="map-marker__dot"></span>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20]
  });

  var countEl = document.getElementById('map-count');

  // construit le HTML du popup
  function buildPopup(event) {
    var title = (event.title && event.title.fr) || 'Événement';
    var location = (event.location && event.location.name) || '';
    var date = event.firstTiming ? VillaNova.formatEventDate(event.firstTiming) : '';
    var priceInfo = VillaNova.extractPrice(event);
    var link = 'evenements.html?uid=' + event.uid;

    var html = '<div class="map-popup">';
    html += '<h3 class="map-popup__title">' + escapeHtml(title) + '</h3>';

    if (location) {
      html += '<p class="map-popup__location">' + escapeHtml(location) + '</p>';
    }

    if (date) {
      html += '<p class="map-popup__date">' + escapeHtml(date) + '</p>';
    }

    if (priceInfo.free) {
      html += '<span class="map-popup__free">Gratuit</span>';
    }

    html += '<a href="' + link + '" class="map-popup__link">Voir l\'événement ↗</a>';
    html += '</div>';

    return html;
  }

  // echappe les caracteres HTML
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  // charge les evenements et place les marqueurs
  async function loadMarkers() {
    try {
      var data = await VillaNova.api.fetchEvents({
        limit: 100,
        offset: 0
      });

      var markers = [];
      var markerCount = 0;

      for (var i = 0; i < data.events.length; i++) {
        var event = data.events[i];
        var loc = event.location;

        if (!loc || !loc.latitude || !loc.longitude) continue;

        var marker = L.marker([loc.latitude, loc.longitude], {
          icon: eventIcon
        }).addTo(map);

        marker.bindPopup(buildPopup(event), {
          maxWidth: 280,
          className: 'map-popup-wrapper'
        });

        markers.push(marker);
        markerCount++;
      }

      // ajuste la vue pour englober tous les marqueurs
      if (markers.length > 1) {
        var group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
      }

      // compteur
      if (countEl) {
        countEl.textContent = markerCount + ' lieu' + (markerCount > 1 ? 'x' : '') + ' sur la carte';
      }

    } catch (err) {
      console.error('Erreur chargement carte:', err);
      if (countEl) {
        countEl.textContent = 'Impossible de charger les événements.';
      }
    }
  }

  loadMarkers();
})();
