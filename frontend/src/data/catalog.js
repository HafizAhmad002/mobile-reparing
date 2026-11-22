// Device catalog: phone brands + tablet brands and their models.
// Later this file can be replaced by an API call to the Django REST API.
//
// Model photos: a model shows its picture when its id is in HAS_IMAGE and the file
// /public/images/phones/<model-id>.jpg exists. Other models show a phone/tablet icon.

const HAS_IMAGE = new Set(["apple-iphone-11", "apple-iphone-11-pro", "apple-iphone-11-pro-max", "apple-iphone-12", "apple-iphone-12-mini", "apple-iphone-12-pro", "apple-iphone-12-pro-max", "apple-iphone-13", "apple-iphone-13-mini", "apple-iphone-13-pro", "apple-iphone-13-pro-max", "apple-iphone-14", "apple-iphone-14-plus", "apple-iphone-14-pro", "apple-iphone-14-pro-max", "apple-iphone-15", "apple-iphone-15-plus", "apple-iphone-15-pro", "apple-iphone-15-pro-max", "apple-iphone-16", "apple-iphone-16-plus", "apple-iphone-16-pro", "apple-iphone-16-pro-max", "apple-iphone-16e", "apple-iphone-17", "apple-iphone-17-pro", "apple-iphone-17-pro-max", "apple-iphone-17e", "apple-iphone-18-pro", "apple-iphone-18-pro-max", "apple-iphone-4", "apple-iphone-4s", "apple-iphone-5", "apple-iphone-5c", "apple-iphone-5s", "apple-iphone-6", "apple-iphone-6-plus", "apple-iphone-6s", "apple-iphone-6s-plus", "apple-iphone-7", "apple-iphone-7-plus", "apple-iphone-8", "apple-iphone-8-plus", "apple-iphone-air", "apple-iphone-duo", "apple-iphone-se-2020", "apple-iphone-se-2022", "apple-iphone-x", "apple-iphone-xr", "apple-iphone-xs", "apple-iphone-xs-max", "ipad-ipad-10-2022", "ipad-ipad-11-inch-2025", "ipad-ipad-2", "ipad-ipad-3", "ipad-ipad-5-2017", "ipad-ipad-6-2018", "ipad-ipad-7", "ipad-ipad-8-2020", "ipad-ipad-9-2021", "ipad-ipad-air", "ipad-ipad-air-11-2024", "ipad-ipad-air-11-2025", "ipad-ipad-air-13-2024", "ipad-ipad-air-13-2025", "ipad-ipad-air-2", "ipad-ipad-air-2022", "ipad-ipad-air-3-2019", "ipad-ipad-air-4-2020", "ipad-ipad-mini", "ipad-ipad-mini-2", "ipad-ipad-mini-2024", "ipad-ipad-mini-3", "ipad-ipad-mini-5-2019", "ipad-ipad-mini-6-2021", "ipad-ipad-pro-10-5", "ipad-ipad-pro-11-2018", "ipad-ipad-pro-11-2020", "ipad-ipad-pro-11-2021", "ipad-ipad-pro-11-2022", "ipad-ipad-pro-11-2024", "ipad-ipad-pro-12-9-2017", "ipad-ipad-pro-12-9-2018", "ipad-ipad-pro-12-9-2020", "ipad-ipad-pro-12-9-2021", "ipad-ipad-pro-12-9-2022", "ipad-ipad-pro-13-2024", "ipad-ipad-pro-9-7"])

const make = (id, name, kind, image, models) => ({
  id,
  name,
  kind, // 'phone' | 'tablet'
  image, // brand photo (used by other pages); may be empty
  models: models.map((m) => {
    const mid = `${id}-${m.toLowerCase().replace(/\+/g, ' plus ').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
    return { id: mid, name: m, image: HAS_IMAGE.has(mid) ? `/images/phones/${mid}.jpg` : null }
  }),
})

export const phoneBrands = [
  make('apple', 'Apple', 'phone', '', ["iPhone 18 Pro Max", "iPhone 18 Pro", "iPhone Duo", "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17", "iPhone Air", "iPhone 17e", "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16", "iPhone 16e", "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15", "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14", "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 mini", "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 mini", "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11", "iPhone SE (2022)", "iPhone SE (2020)", "iPhone XS Max", "iPhone XS", "iPhone XR", "iPhone X", "iPhone 8 Plus", "iPhone 8", "iPhone 7 Plus", "iPhone 7", "iPhone 6s Plus", "iPhone 6s", "iPhone 6 Plus", "iPhone 6", "iPhone 5s", "iPhone 5c", "iPhone 5", "iPhone 4s", "iPhone 4"]),
  make('samsung', 'Samsung', 'phone', '', ["Galaxy S25 Ultra", "Galaxy S25+", "Galaxy S25", "Galaxy S25 Edge", "Galaxy S25 FE", "Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S24 FE", "Galaxy S23 Ultra", "Galaxy S23+", "Galaxy S23", "Galaxy S23 FE", "Galaxy S22 Ultra", "Galaxy S22+", "Galaxy S22", "Galaxy S21 Ultra", "Galaxy S21+", "Galaxy S21", "Galaxy S21 FE", "Galaxy S20 Ultra", "Galaxy S20+", "Galaxy S20", "Galaxy S20 FE", "Galaxy Z Fold6", "Galaxy Z Fold5", "Galaxy Z Fold4", "Galaxy Z Fold3", "Galaxy Z Flip6", "Galaxy Z Flip5", "Galaxy Z Flip4", "Galaxy Z Flip3", "Galaxy A56", "Galaxy A55", "Galaxy A54", "Galaxy A53", "Galaxy A52", "Galaxy A36", "Galaxy A35", "Galaxy A34", "Galaxy A33", "Galaxy A32", "Galaxy A26", "Galaxy A25", "Galaxy A24", "Galaxy A23", "Galaxy A16", "Galaxy A15", "Galaxy A14", "Galaxy A13", "Galaxy A06", "Galaxy A05s", "Galaxy A05", "Galaxy M55", "Galaxy M54", "Galaxy M34", "Galaxy M14", "Galaxy F15", "Galaxy Note 20 Ultra", "Galaxy Note 20", "Galaxy Note 10+", "Galaxy Note 10", "Galaxy Note 9"]),
  make('pixel', 'Google Pixel', 'phone', '', ["Pixel 9 Pro Fold", "Pixel 9 Pro XL", "Pixel 9 Pro", "Pixel 9", "Pixel 9a", "Pixel 8 Pro", "Pixel 8", "Pixel 8a", "Pixel 7 Pro", "Pixel 7", "Pixel 7a", "Pixel 6 Pro", "Pixel 6", "Pixel 6a", "Pixel 5", "Pixel 5a", "Pixel 4 XL", "Pixel 4", "Pixel 4a", "Pixel 3 XL", "Pixel 3"]),
  make('xiaomi', 'Xiaomi', 'phone', '', ["Xiaomi 15 Ultra", "Xiaomi 15", "Xiaomi 14T Pro", "Xiaomi 14T", "Xiaomi 14 Ultra", "Xiaomi 14", "Xiaomi 13T Pro", "Xiaomi 13T", "Xiaomi 13", "Xiaomi 12T Pro", "Xiaomi 12", "Xiaomi 11T", "Mi 11"]),
  make('redmi', 'Redmi', 'phone', '', ["Redmi Note 14 Pro+", "Redmi Note 14 Pro", "Redmi Note 14", "Redmi Note 13 Pro+", "Redmi Note 13 Pro", "Redmi Note 13", "Redmi Note 12 Pro", "Redmi Note 12", "Redmi Note 11", "Redmi 14C", "Redmi 13C", "Redmi 13", "Redmi 12C", "Redmi 12", "Redmi 10C", "Redmi A3", "Redmi A2"]),
  make('poco', 'Poco', 'phone', '', ["Poco F7", "Poco F6 Pro", "Poco F6", "Poco X7 Pro", "Poco X6 Pro", "Poco X6", "Poco M6 Pro", "Poco C75", "Poco C65"]),
  make('infinix', 'Infinix', 'phone', '', ["Zero 40", "Zero 30 5G", "Zero 20", "Note 50 Pro", "Note 40 Pro", "Note 40", "Note 30", "Note 12", "Hot 50", "Hot 40 Pro", "Hot 40", "Hot 30", "Hot 20", "Smart 9", "Smart 8", "Smart 7", "Smart 6", "GT 20 Pro", "GT 10 Pro"]),
  make('tecno', 'Tecno', 'phone', '', ["Phantom X2 Pro", "Camon 30 Pro", "Camon 30", "Camon 20 Pro", "Camon 20", "Spark 30 Pro", "Spark 30", "Spark 20 Pro", "Spark 20", "Spark 10 Pro", "Spark 10", "Pova 6 Pro", "Pova 5 Pro", "Pova 5", "Pop 9", "Pop 8", "Pop 7"]),
  make('oppo', 'Oppo', 'phone', '', ["Find X8 Pro", "Find X8", "Find X7 Ultra", "Find N3 Flip", "Reno 13", "Reno 12 Pro", "Reno 12", "Reno 11", "Reno 10", "Reno 8", "A98", "A79", "A78", "A60", "A58", "A57", "A38", "A18", "A17", "A5 Pro", "A3"]),
  make('vivo', 'Vivo', 'phone', '', ["X200 Pro", "X200", "X100 Pro", "X100", "V40", "V30", "V29", "V27", "V25", "V23", "Y100", "Y78", "Y36", "Y28", "Y27", "Y22", "Y18", "Y17s", "Y16", "T3", "iQOO 13", "iQOO 12"]),
  make('oneplus', 'OnePlus', 'phone', '', ["OnePlus 13", "OnePlus 13R", "OnePlus 12", "OnePlus 12R", "OnePlus 11", "OnePlus 10 Pro", "OnePlus 9 Pro", "OnePlus 9", "OnePlus 8T", "Nord 4", "Nord 3", "Nord CE 4", "Nord CE 3", "Nord N30"]),
  make('realme', 'Realme', 'phone', '', ["GT 7 Pro", "GT 6", "13 Pro+", "13 Pro", "12 Pro+", "12 Pro", "12", "11 Pro+", "11", "C75", "C67", "C65", "C55", "C53", "C51", "Narzo 70 Pro", "Narzo 60", "Note 50"]),
  make('huawei', 'Huawei', 'phone', '', ["Pura 70 Ultra", "P60 Pro", "P50 Pro", "P40 Pro", "Mate 60 Pro", "Mate 50 Pro", "Nova 12", "Nova 11", "Nova 10"]),
  make('honor', 'Honor', 'phone', '', ["Magic 7 Pro", "Magic 6 Pro", "200 Pro", "200", "90", "X9b", "X8b", "X7b", "70"]),
  make('motorola', 'Motorola', 'phone', '', ["Razr 50 Ultra", "Razr 40 Ultra", "Edge 50 Ultra", "Edge 50 Pro", "Edge 40", "Moto G85", "Moto G84", "Moto G73", "Moto G54", "Moto G34", "Moto G24", "Moto G14", "Moto E14", "Moto E13"]),
  make('nokia', 'Nokia', 'phone', '', ["G60", "G42", "G22", "G21", "C32", "C22", "C12", "X30"]),
  make('sony', 'Sony', 'phone', '', ["Xperia 1 VI", "Xperia 1 V", "Xperia 5 V", "Xperia 10 VI", "Xperia 10 V"]),
  make('asus', 'Asus', 'phone', '', ["ROG Phone 9 Pro", "ROG Phone 8 Pro", "Zenfone 11 Ultra", "Zenfone 10"]),
  make('nothing', 'Nothing', 'phone', '', ["Phone (3a)", "Phone (2a)", "Phone (2)", "Phone (1)", "CMF Phone 1"]),
  make('itel', 'Itel', 'phone', '', ["S24", "S23", "P55", "A70", "A60s"]),
]

export const tabletBrands = [
  make('ipad', 'Apple iPad', 'tablet', '', ["iPad Pro 13 (2024)", "iPad Pro 11 (2024)", "iPad Pro 12.9 (2022)", "iPad Pro 12.9 (2021)", "iPad Pro 12.9 (2020)", "iPad Pro 12.9 (2018)", "iPad Pro 12.9 (2017)", "iPad Pro 11 (2022)", "iPad Pro 11 (2021)", "iPad Pro 11 (2020)", "iPad Pro 11 (2018)", "iPad Pro 10.5", "iPad Pro 9.7", "iPad Air 13 (2025)", "iPad Air 13 (2024)", "iPad Air 11 (2025)", "iPad Air 11 (2024)", "iPad Air (2022)", "iPad Air 4 (2020)", "iPad Air 3 (2019)", "iPad Air 2", "iPad Air", "iPad (11-inch, 2025)", "iPad 10 (2022)", "iPad 9 (2021)", "iPad 8 (2020)", "iPad 7", "iPad 6 (2018)", "iPad 5 (2017)", "iPad 3", "iPad 2", "iPad mini (2024)", "iPad mini 6 (2021)", "iPad mini 5 (2019)", "iPad mini 3", "iPad mini 2", "iPad mini"]),
  make('galaxy-tab', 'Samsung Galaxy Tab', 'tablet', '', ["Galaxy Tab S10 Ultra", "Galaxy Tab S10+", "Galaxy Tab S9 Ultra", "Galaxy Tab S9+", "Galaxy Tab S9", "Galaxy Tab S9 FE+", "Galaxy Tab S9 FE", "Galaxy Tab S8 Ultra", "Galaxy Tab S8+", "Galaxy Tab S8", "Galaxy Tab S7+", "Galaxy Tab S7", "Galaxy Tab S6 Lite", "Galaxy Tab A9+", "Galaxy Tab A9", "Galaxy Tab A8", "Galaxy Tab A7 Lite", "Galaxy Tab A7", "Galaxy Tab Active4 Pro"]),
  make('xiaomi-pad', 'Xiaomi / Redmi Pad', 'tablet', '', ["Xiaomi Pad 7 Pro", "Xiaomi Pad 7", "Xiaomi Pad 6S Pro", "Xiaomi Pad 6 Pro", "Xiaomi Pad 6", "Xiaomi Pad 5", "Redmi Pad Pro", "Redmi Pad SE", "Redmi Pad", "Poco Pad"]),
  make('lenovo', 'Lenovo Tab', 'tablet', '', ["Tab P12 Pro", "Tab P12", "Tab P11 Pro Gen 2", "Tab P11 Gen 2", "Tab M11", "Tab M10 Plus", "Tab M10 (3rd Gen)", "Tab K10", "Yoga Tab 13", "Legion Tab Y700"]),
  make('huawei-pad', 'Huawei MatePad', 'tablet', '', ["MatePad Pro 13.2", "MatePad 11.5", "MatePad Air", "MatePad SE", "MatePad T10"]),
  make('honor-pad', 'Honor Pad', 'tablet', '', ["Honor Pad 9", "Honor Pad X9", "Honor Pad X8", "Honor MagicPad 2"]),
  make('realme-pad', 'Realme Pad', 'tablet', '', ["Realme Pad 2", "Realme Pad Mini", "Realme Pad"]),
  make('oneplus-pad', 'OnePlus Pad', 'tablet', '', ["OnePlus Pad 2", "OnePlus Pad Go", "OnePlus Pad"]),
  make('amazon-fire', 'Amazon Fire', 'tablet', '', ["Fire Max 11", "Fire HD 10", "Fire HD 8", "Fire 7"]),
  make('pixel-tablet', 'Google Pixel Tablet', 'tablet', '', ["Pixel Tablet"]),
]

// All brands (phones first, then tablets)
export const brands = [...phoneBrands, ...tabletBrands]
