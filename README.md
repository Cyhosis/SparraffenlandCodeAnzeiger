# SparraffenlandCodeAnzeiger
Zeigt die Promocodes vom EDEKA Gewinnspiel direkt im Browser an
🚀 Installation:

Alle Dateien in einen Ordner speichern

Chrome öffnen → chrome://extensions/

"Entwicklermodus" aktivieren

"Entpackte Erweiterung laden" → Ordner auswählen

Mögliche Fehler:
Öffne manifest.json mit einem BOM-freien UTF-8-Editor, entferne alle unsichtbaren Zeichen vor dem ersten {.
Lade in Chrome unter chrome://extensions den Ordner, der manifest.json enthält – nicht die einzelne Datei.
Dann wird Chrome das Manifest ohne den “expected value at line 1 column 1”-Fehler laden.
