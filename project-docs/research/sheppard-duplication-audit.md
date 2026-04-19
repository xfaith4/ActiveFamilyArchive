# Sheppard Duplication Audit

Date: 2026-04-14

Scope: Nathan Cross Sheppard (302), Eliza M. Clark (303), their children in family F95, and the immediately affected Donahoo grandchildren in family F61.

Method: Local data review only. Evidence levels follow the genealogy research convention used in this project: proven, probable, possible, unproven. No records were merged during this audit.

## Summary

Family F95 currently has 20 children for Nathan Cross Sheppard and Eliza M. Clark. The local GEDCOM and derived JSON show four same-name sibling duplicate groups directly under F95:

- Elizabeth E. Sheppard: 164 and 261
- John H. Sheppard: 305 and 412
- Samuel Nelson Sheppard: 309 and 413
- Aaron Sheppard: 213 and 414

Family F61, the children of John Alexander Donahoo (163) and Elizabeth E. Sheppard (164), also has three same-name duplicate groups:

- Mary Louisa Donahoo: 224 and 236
- Amos Wilbur Donahoo: 218 and 234
- Josiah Everett Donahoo: 219 and 237

These are not extraction artifacts. The duplicates are present in the source GEDCOM as separate INDI records and separate CHIL links in the family records.

## Source Anchors

- `FamilyTreeMedia/Total Family/index.ged`, family F95, lists Nathan (I302), Eliza (I303), and all 20 children.
- `FamilyTreeMedia/Total Family/index.ged`, family F61, lists John Alexander Donahoo (I163), Elizabeth E. Sheppard (I164), and all 16 children.
- `person-family.json` mirrors those family child lists.
- `person-details.json` mirrors the separate individual records and their events.

## Direct F95 Duplicate Candidates

### Probable Merge: Samuel Nelson Sheppard

Records:

- 309: Samuel Nelson Sheppard, male, born 1840, died 25 Jul 1862, Farmington, Alcorn, Mississippi
- 413: Samuel Nelson Sheppard, female, born 1840, died 25 Jul 1862, Corinth, Adams, Mississippi

Assessment: Probable duplicate. Same parents, same full name, same birth year, same death date. Record 413 has sex set to female, which conflicts with the name and with record 309. The death locations are near the same Civil War context, though `Corinth, Adams, Mississippi` looks geographically suspect and should be verified before preserving it.

Suggested canonical record: 309.

Suggested merge handling: Keep 309 as the primary record. Move alternate death place from 413 into research notes if not otherwise sourced. Do not keep 413 as a separate child unless an external source proves a second child with the same full name and same death date.

### Probable Merge: Aaron Sheppard

Records:

- 213: Aaron Sheppard, male, born 1848, Hendrysburg, Belmont, Ohio, died Jun 1850
- 414: Aaron Sheppard, male, born 1848, Maryland, died Jun 1850

Assessment: Probable duplicate. Same parents, same name, same sex, same birth year, same death month/year. The only conflict is birth place. Maryland is less plausible in this family timeline than Belmont County/Hendrysburg, but both should remain unproven until tied to a source.

Suggested canonical record: 213.

Suggested merge handling: Keep 213. Preserve 414 birth place as an alternate/uncertain note only if a source exists.

### Possible Merge: John H. Sheppard

Records:

- 305: John H. Sheppard, male, born Dec 1830, Hendrysburg, Belmont, Ohio, died 4 Mar 1905, Linn, Kansas
- 412: John H. Sheppard, male, born 1831, Iowa City, Johnson, Iowa, died 1880, Linn, Kansas

Assessment: Possible duplicate. Same parents, same name, same sex, similar birth year, same death region. The death years conflict significantly. This should not be merged until an external record identifies which death date is correct.

Suggested canonical record if confirmed duplicate: 305, because it has a more specific birth date and place.

Suggested research: Find burial, obituary, probate, or death notice in Linn County, Kansas, for John H. Sheppard. Resolve whether he died in 1880 or on 4 Mar 1905.

### Possible But Conflicted: Elizabeth E. Sheppard

Records:

- 164: Elizabeth E. Sheppard, female, born 29 Sep 1827, Hendrysburg, Ohio, died 4 Mar 1905, Milan, Rock Island County, Illinois; spouse John Alexander Donahoo
- 261: Elizabeth E. Sheppard, female, born 29 Sep 1827, died Jun 1850, Iowa City, Johnson, Iowa; no spouse or children

Assessment: Possible duplicate, but conflicted. Same parents, same name, same birth date. The death date on 261 conflicts with 164 having a spouse and many children born after 1850. Record 261 cannot be the same person if its June 1850 death is correct. It may be a bad imported duplicate, or it may represent a different child with copied birth details.

Suggested canonical record if confirmed duplicate: 164.

Suggested research: Verify Elizabeth E. Sheppard Donahoo's death and burial in Rock Island County, Illinois. Separately check whether a child Elizabeth Sheppard died in Iowa City in June 1850.

## Other F95 Records Requiring Review

These are not same-name duplicate hits, but they show suspicious date clusters or timeline problems:

- 260 Hannah Sheppard: born 29 Sep 1827, same date as Elizabeth E. Sheppard. Could be a twin, a duplicate with a wrong given name, or a conflated record.
- 212 Mairra Sheppard, 213 Aaron Sheppard, 414 Aaron Sheppard, 415 Moses Sheppard, and 214 Wilbur Sheppard all have death date Jun 1850. This cluster may come from the 1850 census/mortality schedule or a copied event.
- 215 Jemima H. Sheppard: born 1852, after Nathan's 1856 death but before Eliza's 1894 death; plausible chronologically.
- 216 Jemima M. Shepherd: born Apr 1859, after Nathan's 1856 death. As currently linked, this is biologically impossible and should be detached from Nathan unless Nathan's death date is wrong or the parents are wrong.
- 311 Mary J. Sheppard: death date 4 Mar 1905 matches Elizabeth E. Sheppard and John H. Sheppard. This could be a copied death date.

## F61 Donahoo Duplicate Candidates

### Possible Merge: Josiah Everett Donahoo

Records:

- 219: Josiah Everett Donahoo, male, born 1862, Port Byron, Rock Island, Illinois, died 30 Aug 1939
- 237: Josiah Everett Donahoo, male, born 1862, Hillsdale, Rock Island County, Illinois, died 1880

Assessment: Possible duplicate. Same parents, same full name, same birth year, nearby birth places. Death years conflict. The 1939 death date is specific and was already flagged as a research target; do not merge until the 1939 death index/cemetery record is checked.

Suggested canonical record if confirmed duplicate: 219.

### Possible Merge: Amos Wilbur Donahoo

Records:

- 218: Amos Wilbur Donahoo, male, born 1858, Port Byron, Rock Island, Illinois, died 1906
- 234: Amos Wilbur Donahoo, male, born 1858, Port Byron, Rock Island, Illinois, died 1880

Assessment: Possible duplicate. Same parents, same full name, same sex, same birth year and place. Death years conflict.

Suggested canonical record if confirmed duplicate: 218, pending external death evidence.

### Possible But Not Ready: Mary Louisa Donahoo

Records:

- 224: Mary Louisa Donahoo, female, born 1856, Port Byron, Rock Island, Illinois, died 25 May 1930, Milan, Rock Island County, Illinois
- 236: Mary Louisa Donahoo, female, born Oct 1851, Port Byron, Rock Island, Illinois, died 1909, Fresno, Fresno County, California

Assessment: Possible duplicate by name and parents, but birth years and death places differ enough that this could be two sisters with the same name after an infant death, or two conflated records. Do not merge without external evidence.

Suggested research: Find cemetery/death records for both Mary Louisa Donahoo entries before merging.

## Recommended Cleanup Order

1. Fix or detach biologically impossible parentage first: Jemima M. Shepherd (216), born 1859 after Nathan's 1856 death.
2. Merge high-confidence duplicate children only after checking source notes in RootsMagic: Samuel Nelson Sheppard (309/413) and Aaron Sheppard (213/414).
3. Investigate copied date clusters before merging: Jun 1850 deaths and 4 Mar 1905 deaths.
4. Resolve John H. Sheppard (305/412) through Kansas death/burial/probate evidence.
5. Resolve Elizabeth E. Sheppard (164/261) through Rock Island County death/burial evidence and any Iowa City 1850 mortality evidence.
6. Then handle Donahoo duplicate groups in F61, starting with Josiah Everett Donahoo (219/237), because he already has a specific death date target.

## Practical RootsMagic Merge Notes

- Treat `person-details.json` and `person-family.json` as generated data. Merge or detach records in RootsMagic or the GEDCOM source, then regenerate the JSON.
- Before each merge, copy conflicting birth/death places into the surviving person's notes as unproven alternates unless a source proves them wrong.
- Do not delete source citations from the discarded duplicate until they have been copied to the survivor.
- After the source tree is corrected, regenerate `person-details.json`, `person-family.json`, and any derived directory/source files.

