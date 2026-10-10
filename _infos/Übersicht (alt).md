# OPMN/

# Umschreiben oder löschen
# Versuch Infodatei mit Links (geht nicht, werden nicht aktualisiert)
iwie kann man das wohl in den einstell. aktivieren, aber kein zeit jetzt

# **bootstrap/**

### `OpmnPlugin` _extends `Plugin`_ [Script](../bootstrap/entry.js)

Der Einstiegspunkt des Plugins. Registriert die Views, Ribbon-Buttons und Commands.
Quasi die "Komposition" des Plugins.

---

# **adapters/**

### `BulkEditorTestView` _extends `ItemView`_ [Script](../adapters/migrationsEditorTestView.js)

Grundsätzlich wird ein View so an [bootstrap/entry.js](../bootstrap/entry.js) angehangen.
Hier probeweise schon verschiedene Test-Features ausprobiert:

- alleMigTestFt
- alleInhMigFtNeu
- inhMigNeuFt
- inhaltMigrationFt
- obsappTest
- defaultDefsTest

---

# **features/**

### alleInhalteMigFt(obsClsObj) [Script](../features/bulkEditorTest/alleInhalteMigFt.js)

Neuer Versuch Inhalts-Migrations-Test-Feature.

Will gucken, wie das aussieht, wenn man alle Inhalts-Instanzen überarbeitet 
(nicht nur die mit Status _ p)

---

### inhMigNeuFt(obsClsObj) [Script](../features/bulkEditorTest/inhMigNeuFt.js)

Neuere Version von Inhalts-Migrations-Test-Feature.
Verantwortlichkeiten getrennt (Upgrade zur vorherigen Version).

---

### defaultDefsTest(obsClsObj) [Script](../features/baustelleFt/defaultDefsTest.js)

- enthält Drag & Drop-Tabelle

Findet die "Ursprungsdefinitionen" und stellt diese in einer Tabelle dar.
Da ich an dem Abend zufällig ein Tutorial über Drag & Drop gesehen habe,
lässt sich die Tabelle verschieben. 

Ursprungsdefinitionen = das was in **Shared/Registry/** > `buildRegistryDefault(...)` ([Script](../shared/registry/defaultDefinitionenReg.js)) definiert, gesucht und zurückgegeben wird.

---

# **shared/**

## **services/**

### seiteIstWerteCheck(app, dv, seite) und neueInhIstWerte(app, dv, seite) [Script](../shared/services/pagesAndLinks/mergeService.js)

unwichtig: wird von verschiedenen Test-Features genutzt, aber muss eh 
überarbeitet werden diesdas, bzw. ersetzt, dann gelöscht

---

## **registry/**

### buildRegistryDefault(app, dv) [Script](../shared/registry/defaultDefinitionenReg.js)

Sucht per `dvLinkSuche(...)` [Script](../shared/services/queries/entityService.js) nach _"Definition _ Klasse"_, _"Ursprungsdefinition"_ 
in _sysTyp_ und _sysRolle_ (_"Definition _ Klasse"_, _sysTyp_ usw. aber nicht mehr aktuell)

**Dafür muss aber erst mal die neue Datenstruktur fertig sein + 
Datenmigration abgeschlossen.**

---

