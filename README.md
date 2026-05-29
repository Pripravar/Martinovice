# I/16 Mladá Boleslav – Martinovice — mapová PWA

Mobilní mapa stavby **I/16 Mladá Boleslav – Martinovice** (číslo stavby **925125026**).

- **Trasa:** km 0,000 – 8,200 (cca 8,2 km)
- **ZÚ:** 50.4270175, 14.9449067
- **KÚ:** 50.4349761, 15.0483650
- **URL:** https://pripravar.github.io/Martinovice/

## v0 (2026-05-29) — osa + staničení

Minimální verze pro orientaci na stavbě:

- 4 podkladové mapy (Mapy.cz Outdoor / Basic / Letecká + OSM)
- Katastr ČÚZK (WMS overlay, přepínatelný)
- Osa trasy (291 bodů z GPX export Mapy.cz)
- Markery staničení po 100 m (oranžové) a 20 m (šedé, přepínatelné)
- ZÚ / KÚ markery
- GPS sledování polohy + kompas + výpočet aktuálního km
- PWA — instalovatelná na plochu telefonu

Postaveno podle vzoru aplikace [Sulice–Želivec](https://github.com/Pripravar/Sulice---Zelivec).

## Plánováno (postupně doplnit)

- Vrstva stavebních objektů (SO 101, 102, …) jako barevné úseky
- PDF panel s výkresy PDPS/RDS po km
- Firebase: sdílené poznámky, úkolníček, stavební deník
- KZP + TePř panely

## Konfigurace

`index.html` obsahuje na začátku konstanty:

```js
var MAPY_API_KEY = '...';
var KM_START = 0.000;
var KM_END = 8.200;
var GPX_POINTS = [...];   // 291 bodů
var CALIB_POINTS = [
  {lat:..., lng:..., km:0.000},   // ZÚ
  {lat:..., lng:..., km:8.200}    // KÚ
];
```

Při přidání dalších kalibračních bodů uvnitř trasy (např. z geodézie) se zlepší přesnost mapování GPS → staničení v krajních úsecích.

## Deploy

1. Commit + push do `main`
2. GitHub Pages publikuje do 1–2 minut
3. Na telefonu: otevřít https://pripravar.github.io/Martinovice/ → Sdílet → Přidat na plochu
