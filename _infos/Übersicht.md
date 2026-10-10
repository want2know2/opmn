###### Examples of Ontology Definitions

```yaml
# [[Inhalt _ Text]]

inKlasse:
  - "[[Inhalt]]"
inFeld:
  - "[[typ]]"
parent:
  - "[[Inhalt]]"
```

And:

```yaml
# [[Inhalt _ Buch]]

inKlasse:
  - "[[Inhalt]]"
inFeld:
  - "[[art]]"
parent:
  - "[[Inhalt]]"
erlaubterTyp:
  - "[[Inhalt _ Text]]"
```

Then:

```yaml
# [[Inhalt _ Buch _ Sachbuch]]

inKlasse:
  - "[[Inhalt]]"
inFeld:
  - "[[art]]"
parent:
  - "[[Inhalt _ Buch]]"
```

###### Explanation of the Fields used by Ontology Definitions

`inKlasse` answers:

> To which root ontology class does this definition belong?

`inFeld` answers:

> Which classification field does this definition provide values for?

`parent` answers:

> Where does this definition sit in the ontology hierarchy?
> Please note: `parent` defines the hierarchical relationship between ontology definitions; it is not a classification field.

`erlaubterTyp` answers:

> Which values of the `typ` dimension are permitted for this definition?

---
##### Instances

Instances are concrete entities classified through fields such as:

```
klasse: 
typ: 
art:
pstatus:
```

###### Example of an Instance

```yaml
# [[Friedrich Nietzsche - Beyond Good and Evil]]

klasse:
  - "[[Inhalt]]"
typ:
  - "[[Inhalt _ Text]]"
art:
  - "[[Inhalt _ Buch _ Monographie]]"
pstatus: 
  - "[[nicht-p-Eintrag]]"
```

###### Explanation of  the Fields used by Instances

`klasse` answers:

> Which root ontology class is this page an instance of?

`typ` answers:

> Which ontology definition(s) for the `typ` field classify this instance?

`art` answers:

> Which ontology definition(s) for the `art` field classify this instance?

`pstatus` answers:

> Which private status does this page have?

---

##### Semantic Taxonomy Pages

Semantic taxonomy pages belong to:

- Kategorie
- Thema

and use the fields:

```
stKlasse:
stParent:
pstatus:
```

###### Example of a Semantic Taxonomy Page

```yaml
# [[Kategorie _ Wissenschaft _ Philosophie]]

stKlasse:
  - "[[Kategorie]]"
stParent:
  - "[[Kategorie _ Wissenschaft]]"
pstatus:
  - "[[nicht-p-Eintrag]]"
```
