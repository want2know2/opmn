
```yaml
# [[2026-02-02 _ 18-14-12 _ What do you think about the project]]

klasse:
  - "[[Inhalt]]"
typ:
  - "[[Inhalt _ Text]]"
art:
  - "[[Inhalt _ Mail]]"
pstatus:
  - "[[Status _ p]]"
```

```yaml
# [[Inhalt]]

struc:
  - "[[klasse]]"
```

```yaml
# [[Inhalt _ Text]]

struc:
  - "[[typ]]"
inKlasse:
  - "[[Inhalt]]"
```

```yaml
# [[Inhalt _ Buch _ Kapitel]]

struc:
  - "[[art]]"
inKlasse:
  - "[[Inhalt]]"
parent: 
  - "[[Inhalt _ Buch]]"
erlaubtInTyp:
  - "[[Inhalt _ Text]]"
```

```yaml
# [[Status _ p]]

struc:
  - "[[Status]]"
```

```yaml
# [[klasse]]

sys: 
  - "[[sys]]"
```

```yaml
# [[typ]]

sys: 
  - "[[sys]]"
```

```yaml
# [[art]]

sys: 
  - "[[sys]]"
```

```yaml
# [[Status]]

sys: 
  - "[[sys]]"
```
