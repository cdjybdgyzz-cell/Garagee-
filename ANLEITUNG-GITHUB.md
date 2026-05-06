# Garage-App auf GitHub Pages hochladen

## 1. GitHub Account erstellen
- Gehe zu [github.com](https://github.com)
- Klicke auf **Sign up** und erstelle einen Account (falls noch nicht vorhanden)

## 2. Neues Repository erstellen
- Klicke oben rechts auf das **+** → **New repository**
- Repository name: `garage`
- Description (optional): `Fahrzeugverwaltung`
- Wähle **Public**
- ✅ **Add a README file** ankreuzen
- Klicke auf **Create repository**

## 3. Dateien hochladen
- Klicke im neuen Repository auf **Add file** → **Upload files**
- Ziehe diese Dateien aus dem Garage-Ordner per Drag & Drop hoch:
  - `index.html`
  - `styles.css`
  - `app.js`
  - `sw.js`
  - `manifest.json`
- Klicke unten auf **Commit changes**

## 4. GitHub Pages aktivieren
- Klicke auf **Settings** (Zahnrad oben im Repo)
- Links im Menü auf **Pages** klicken
- Unter **Build and deployment**:
  - Source: **Deploy from a branch**
  - Branch: **main**
  - Ordner: **/(root)**
- Klicke auf **Save**

## 5. Warten und öffnen
- Warte ca. 1–3 Minuten
- Oben auf der Pages-Seite erscheint dein Link:
  ```
  https://DEIN-USERNAME.github.io/garage/
  ```
- Klicke darauf oder teile den Link auf dem Handy

## 6. Am Handy installieren
- Link in Safari öffnen
- Tippe auf das **Teilen-Symbol** (Quadrat mit Pfeil nach oben)
- Wähle **Zum Home-Bildschirm**
- Fertig! Die App erscheint wie eine normale App auf dem Startbildschirm

## Bei Änderungen aktualisieren
- Neue Dateien auf GitHub hochladen (gleicher Schritt 3)
- Die App wird automatisch aktualisiert
- Am Handy: App schliessen und neu öffnen, oder Seite neu laden

## Bekannte Probleme
- Wenn die Seite nach 5 Minuten noch nicht da ist: Seite neu laden
- Wenn das Profilbild nicht gespeichert wird: localStorage ist im Private Mode deaktiviert
