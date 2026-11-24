// Manchester areas we visit. The client can add or remove areas here.
// Later this can come from the Django API.

export const areaGroups = [
  {
    zone: 'City centre',
    areas: ['City Centre', 'Northern Quarter', 'Ancoats', 'Deansgate', 'Castlefield', 'Piccadilly', 'Ardwick', 'Chinatown'],
  },
  {
    zone: 'South Manchester',
    areas: ['Didsbury', 'West Didsbury', 'Withington', 'Fallowfield', 'Chorlton', 'Whalley Range', 'Rusholme', 'Moss Side', 'Hulme', 'Levenshulme', 'Longsight', 'Burnage', 'Heaton Moor', 'Northenden', 'Wythenshawe', 'Baguley', 'Heald Green', 'Cheadle'],
  },
  {
    zone: 'North Manchester',
    areas: ['Cheetham Hill', 'Crumpsall', 'Blackley', 'Harpurhey', 'Moston', 'Collyhurst', 'Newton Heath', 'Miles Platting', 'Prestwich', 'Whitefield'],
  },
  {
    zone: 'East Manchester',
    areas: ['Gorton', 'Openshaw', 'Clayton', 'Beswick', 'Droylsden', 'Failsworth', 'Denton', 'Ashton-under-Lyne', 'Stockport'],
  },
  {
    zone: 'West: Salford & Trafford',
    areas: ['Salford', 'Salford Quays', 'MediaCityUK', 'Eccles', 'Old Trafford', 'Stretford', 'Urmston', 'Sale', 'Altrincham'],
  },
]

export const allAreas = areaGroups.flatMap((g) => g.areas)

// Areas shown on the Home page (short list)
export const featuredAreas = ['City Centre', 'Didsbury', 'Chorlton', 'Fallowfield', 'Salford Quays']

// Service area for the booking map: a circle around Manchester city centre.
// 15 km covers every area above (Altrincham, Stockport, Ashton, Whitefield are about 10–13 km out).
// districts: extra postcode districts you cover even outside the circle, with an optional call-out fee (£)
// e.g. [{ code: 'WA14', fee: 10 }]
export const SERVICE_AREA = { lat: 53.4808, lon: -2.2426, radiusKm: 15, districts: [] }
