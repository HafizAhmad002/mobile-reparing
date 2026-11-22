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
