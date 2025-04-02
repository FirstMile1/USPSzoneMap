import 'mapbox-gl/dist/mapbox-gl.css';

import mapboxgl from 'mapbox-gl';

import { greetUser } from '$utils/greet';

import { ZoneCalculator } from './zone-calculator.ts';

window.Webflow ||= [];
window.Webflow.push(() => {
  const name = 'John Doe';
  greetUser(name);
});

class USPSZoneMap {
  private map: mapboxgl.Map;
  private zoneCalculator: ZoneCalculator;
  private originMarker: mapboxgl.Marker | null = null;
  private destinationMarker: mapboxgl.Marker | null = null;

  constructor(containerId: string) {
    const mapboxToken =
      'pk.eyJ1IjoiZmlyc3RtaWxlIiwiYSI6ImNtNzE2b211ajA5bjcybXB4bGRjN3YxZmUifQ.pXpqQH9D3Vk2rsP5bFtn3Q';
    mapboxgl.accessToken = mapboxToken;

    this.zoneCalculator = new ZoneCalculator();

    this.map = new mapboxgl.Map({
      container: containerId,
      style: 'mapbox://styles/mapbox/light-v10',
      center: [-98.5795, 39.8283],
      zoom: 3.5,
      minZoom: 3.5,
      maxZoom: 3.5,
      maxBounds: [
        [-125, 24],
        [-66, 50],
      ],
      scrollZoom: false,
    });

    this.map.dragRotate.disable();
    this.map.touchZoomRotate.disable();
    this.map.doubleClickZoom.disable();
    this.map.boxZoom.disable();
    this.map.keyboard.disable();

    this.initializeMap();
    this.createControls();
    this.createLegend();
  }

  private initializeMap() {
    this.map.on('load', () => {
      // Add US boundary mask first
      this.map.addSource('us-boundary', {
        type: 'vector',
        url: 'mapbox://mapbox.boundaries-adm0-v3',
      });

      // Create the mask layer
      this.map.addLayer({
        id: 'us-mask',
        type: 'fill',
        source: 'us-boundary',
        'source-layer': 'boundaries_admin_0',
        filter: ['==', ['get', 'iso_3166_1'], 'US'],
        paint: {
          'fill-color': '#ffffff',
          'fill-opacity': 1,
        },
      });

      // Add zones source
      this.map.addSource('zones', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Add zones layer with mask
      this.map.addLayer(
        {
          id: 'zone-fills',
          type: 'fill',
          source: 'zones',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.5,
          },
        },
        'us-mask'
      ); // Place zones under the mask

      // Add state boundaries source
      this.map.addSource('state-boundaries', {
        type: 'vector',
        url: 'mapbox://mapbox.boundaries-adm1-v3',
      });

      // Add state boundaries layer
      this.map.addLayer({
        id: 'state-boundaries',
        type: 'line',
        source: 'state-boundaries',
        'source-layer': 'boundaries_admin_1',
        filter: ['==', ['get', 'iso_3166_1'], 'US'],
        paint: {
          'line-color': '#000',
          'line-width': 0.5,
          'line-opacity': 0.7,
        },
      });

      // Add state labels source
      this.map.addSource('state-labels', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Add state labels layer
      this.map.addLayer({
        id: 'state-label-layer',
        type: 'symbol',
        source: 'state-labels',
        layout: {
          'text-field': ['get', 'abbr'],
          'text-size': 12,
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-allow-overlap': false,
          'text-ignore-placement': false,
        },
        paint: {
          'text-color': '#333',
          'text-halo-color': 'rgba(255, 255, 255, 0.8)',
          'text-halo-width': 1.5,
        },
      });

      // Load state data
      this.loadStateData();
    });
  }

  private async loadStateData() {
    try {
      // This is a simplified dataset of US state centers with abbreviations
      const stateData = [
        { abbr: 'AL', center: [-86.79113, 32.806671] },
        { abbr: 'AK', center: [-152.404419, 61.370716] },
        { abbr: 'AZ', center: [-111.431221, 33.729759] },
        { abbr: 'AR', center: [-92.373123, 34.969704] },
        { abbr: 'CA', center: [-119.681564, 36.116203] },
        { abbr: 'CO', center: [-105.311104, 39.059811] },
        { abbr: 'CT', center: [-72.755371, 41.597782] },
        { abbr: 'DE', center: [-75.507141, 39.318523] },
        { abbr: 'FL', center: [-81.686783, 27.766279] },
        { abbr: 'GA', center: [-83.643074, 33.040619] },
        { abbr: 'HI', center: [-157.498337, 21.094318] },
        { abbr: 'ID', center: [-114.478828, 44.240459] },
        { abbr: 'IL', center: [-88.986137, 40.349457] },
        { abbr: 'IN', center: [-86.258278, 39.849426] },
        { abbr: 'IA', center: [-93.210526, 42.011539] },
        { abbr: 'KS', center: [-96.726486, 38.5266] },
        { abbr: 'KY', center: [-84.670067, 37.66814] },
        { abbr: 'LA', center: [-91.867805, 31.169546] },
        { abbr: 'ME', center: [-69.381927, 44.693947] },
        { abbr: 'MD', center: [-76.802101, 39.063946] },
        { abbr: 'MA', center: [-71.530106, 42.230171] },
        { abbr: 'MI', center: [-84.536095, 43.326618] },
        { abbr: 'MN', center: [-93.900192, 45.694454] },
        { abbr: 'MS', center: [-89.678696, 32.741646] },
        { abbr: 'MO', center: [-92.288368, 38.456085] },
        { abbr: 'MT', center: [-110.454353, 46.921925] },
        { abbr: 'NE', center: [-98.268082, 41.12537] },
        { abbr: 'NV', center: [-117.055374, 38.313515] },
        { abbr: 'NH', center: [-71.563896, 43.452492] },
        { abbr: 'NJ', center: [-74.521011, 40.298904] },
        { abbr: 'NM', center: [-106.248482, 34.840515] },
        { abbr: 'NY', center: [-74.948051, 42.165726] },
        { abbr: 'NC', center: [-79.806419, 35.630066] },
        { abbr: 'ND', center: [-99.784012, 47.528912] },
        { abbr: 'OH', center: [-82.764915, 40.388783] },
        { abbr: 'OK', center: [-96.928917, 35.565342] },
        { abbr: 'OR', center: [-122.070938, 44.572021] },
        { abbr: 'PA', center: [-77.209755, 40.590752] },
        { abbr: 'RI', center: [-71.51178, 41.680893] },
        { abbr: 'SC', center: [-80.945007, 33.856892] },
        { abbr: 'SD', center: [-99.438828, 44.299782] },
        { abbr: 'TN', center: [-86.692345, 35.747845] },
        { abbr: 'TX', center: [-97.563461, 31.054487] },
        { abbr: 'UT', center: [-111.862434, 40.150032] },
        { abbr: 'VT', center: [-72.710686, 44.045876] },
        { abbr: 'VA', center: [-78.169968, 37.769337] },
        { abbr: 'WA', center: [-121.490494, 47.400902] },
        { abbr: 'WV', center: [-80.954453, 38.491226] },
        { abbr: 'WI', center: [-89.616508, 44.268543] },
        { abbr: 'WY', center: [-107.30249, 42.755966] },
        { abbr: 'DC', center: [-77.026817, 38.897438] },
      ];

      // Convert to GeoJSON
      const features = stateData.map((state) => ({
        type: 'Feature',
        properties: {
          abbr: state.abbr,
        },
        geometry: {
          type: 'Point',
          coordinates: state.center,
        },
      }));

      // Update the state labels source
      (this.map.getSource('state-labels') as mapboxgl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features,
      });
    } catch (error) {
      console.error('Error loading state data:', error);
    }
  }

  private async lookupZipCode(zipCode: string): Promise<[number, number] | null> {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${zipCode}.json?access_token=${mapboxgl.accessToken}&country=US&types=postcode`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        return data.features[0].center as [number, number];
      }
      return null;
    } catch (error) {
      console.error('Error looking up ZIP code:', error);
      return null;
    }
  }

  private async calculateZones(fromZip: string, toZip: string) {
    if (!/^\d{5}$/.test(fromZip) || !/^\d{5}$/.test(toZip)) {
      alert('Please enter valid 5-digit ZIP codes');
      return;
    }

    const fromCoords = await this.lookupZipCode(fromZip);
    const toCoords = await this.lookupZipCode(toZip);

    if (!fromCoords || !toCoords) {
      alert('Unable to locate one or both ZIP codes');
      return;
    }

    // Remove existing markers
    if (this.originMarker) {
      this.originMarker.remove();
      this.originMarker = null;
    }
    if (this.destinationMarker) {
      this.destinationMarker.remove();
      this.destinationMarker = null;
    }

    // Calculate and display zones without adding markers
    this.updateZoneVisualization(fromCoords);

    // Calculate distance and display it (optional)
    const distance = this.zoneCalculator.calculateDistance(
      fromCoords[1],
      fromCoords[0],
      toCoords[1],
      toCoords[0]
    );
    const zone = this.zoneCalculator.calculateZone(distance);

    console.log(`Distance: ${Math.round(distance)} miles, Zone: ${zone.zoneNumber}`);
  }

  private updateZoneVisualization(originCoordinates: [number, number]) {
    // Create a grid of points across the US
    const features = [];
    const gridSize = 0.25; // Reduce grid size for higher resolution (was 0.5)

    // Create a buffer to store zone values for smoothing
    const zoneBuffer: number[][][] = [];

    // First pass: calculate raw zones
    for (let lat = 24; lat <= 50; lat += gridSize) {
      const latRow: number[][] = [];
      for (let lng = -125; lng <= -66; lng += gridSize) {
        const distance = this.zoneCalculator.calculateDistance(
          originCoordinates[1],
          originCoordinates[0],
          lat,
          lng
        );

        const zone = this.zoneCalculator.calculateZone(distance);
        latRow.push([zone.zoneNumber, distance]);
      }
      zoneBuffer.push(latRow);
    }

    // Second pass: smooth zones and create features
    for (let latIdx = 0; latIdx < zoneBuffer.length; latIdx++) {
      const lat = 24 + latIdx * gridSize;

      for (let lngIdx = 0; lngIdx < zoneBuffer[latIdx].length; lngIdx++) {
        const lng = -125 + lngIdx * gridSize;

        // Get current cell's zone
        const [zoneNumber, distance] = zoneBuffer[latIdx][lngIdx];

        // Simple smoothing: if this is an outlier compared to neighbors, adjust it
        let smoothedZone = zoneNumber;

        // Only smooth if we're not at the edges
        if (
          latIdx > 0 &&
          latIdx < zoneBuffer.length - 1 &&
          lngIdx > 0 &&
          lngIdx < zoneBuffer[latIdx].length - 1
        ) {
          // Get neighboring zones
          const neighbors = [
            zoneBuffer[latIdx - 1][lngIdx][0], // above
            zoneBuffer[latIdx + 1][lngIdx][0], // below
            zoneBuffer[latIdx][lngIdx - 1][0], // left
            zoneBuffer[latIdx][lngIdx + 1][0], // right
          ];

          // Count occurrences of each zone in neighbors
          const zoneCounts = neighbors.reduce(
            (acc, z) => {
              acc[z] = (acc[z] || 0) + 1;
              return acc;
            },
            {} as Record<number, number>
          );

          // If this cell's zone is different from all neighbors, use the most common neighbor zone
          if (!neighbors.includes(zoneNumber)) {
            const mostCommonZone = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1])[0][0];
            smoothedZone = parseInt(mostCommonZone);
          }
        }

        // Get the zone object for the smoothed zone
        const zoneObj = this.zoneCalculator
          .getZoneRanges()
          .find((z) => z.zoneNumber === smoothedZone);

        if (zoneObj) {
          features.push({
            type: 'Feature',
            properties: {
              distance,
              zone: smoothedZone,
              color: zoneObj.color,
              description: zoneObj.description,
            },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [lng, lat],
                  [lng + gridSize, lat],
                  [lng + gridSize, lat + gridSize],
                  [lng, lat + gridSize],
                  [lng, lat],
                ],
              ],
            },
          });
        }
      }
    }

    // Update the zones source
    (this.map.getSource('zones') as mapboxgl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features,
    });
  }

  private createControls() {
    const controlDiv = document.createElement('div');
    controlDiv.className = 'map-controls';
    controlDiv.innerHTML = `
      <div class="zip-input-group">
        <div>
          <label for="from-zip">From:</label>
          <input type="text" id="from-zip" class="zip-input" placeholder="From ZIP" maxlength="5" pattern="[0-9]*">
        </div>
        <div>
          <label for="to-zip">To:</label>
          <input type="text" id="to-zip" class="zip-input" placeholder="To ZIP" maxlength="5" pattern="[0-9]*">
        </div>
        <button id="calculate-zones" class="calculate-button">Calculate Zones</button>
      </div>
    `;

    this.map.getContainer().appendChild(controlDiv);

    const fromInput = controlDiv.querySelector('#from-zip') as HTMLInputElement;
    const toInput = controlDiv.querySelector('#to-zip') as HTMLInputElement;
    const calculateButton = controlDiv.querySelector('#calculate-zones') as HTMLButtonElement;

    calculateButton.addEventListener('click', () => {
      this.calculateZones(fromInput.value, toInput.value);
    });
  }

  private createLegend() {
    const legend = document.createElement('div');
    legend.className = 'zone-legend';

    // Add a title to the legend
    const title = document.createElement('div');
    title.className = 'legend-title';
    title.textContent = 'USPS Shipping Zones';
    legend.appendChild(title);

    const zones = this.zoneCalculator.getZoneRanges();
    zones.forEach((zone) => {
      const row = document.createElement('div');
      row.className = 'legend-row';

      // Create a color box that matches the zone color
      const colorBox = document.createElement('span');
      colorBox.className = 'color-box';
      colorBox.style.backgroundColor = zone.color;
      colorBox.style.border = '1px solid rgba(0,0,0,0.2)';
      colorBox.style.display = 'inline-block';
      colorBox.style.width = '20px';
      colorBox.style.height = '20px';
      colorBox.style.marginRight = '8px';
      colorBox.style.borderRadius = '3px';

      // Create the zone description text
      const description = document.createElement('span');
      description.className = 'zone-description';
      description.textContent = zone.description;

      // Add the elements to the row
      row.appendChild(colorBox);
      row.appendChild(description);

      // Style the row
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.marginBottom = '6px';

      legend.appendChild(row);
    });

    // Style the legend container
    legend.style.position = 'absolute';
    legend.style.bottom = '20px';
    legend.style.right = '20px';
    legend.style.backgroundColor = 'white';
    legend.style.padding = '12px';
    legend.style.borderRadius = '4px';
    legend.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
    legend.style.maxWidth = '250px';
    legend.style.fontSize = '12px';
    legend.style.lineHeight = '1.5';
    legend.style.zIndex = '10';

    // Add the legend title styling
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '8px';
    title.style.fontSize = '14px';
    title.style.borderBottom = '1px solid #eee';
    title.style.paddingBottom = '4px';

    document.getElementById(this.map.getContainer().id)?.appendChild(legend);
  }
}

// Initialize the map when the page loads
window.addEventListener('load', () => {
  new USPSZoneMap('usps-map');
});
