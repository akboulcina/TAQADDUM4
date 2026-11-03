#!/usr/bin/env python3
"""
Exports the TAQADDUM 43-KPI workbook into src/kpi/referentiel.data.js.

    python3 scripts/kpi/export-referentiel.py <workbook.xlsx> [out.js]

The workbook is the single source of truth. Nothing is retyped: every string and
number below is copied from a cell (01_KPI, 02_Regles_Alertes, 03_Matrice_Roles,
08_Glossaire). Re-run this script when the workbook changes, then run
`npm run test:kpi`.
"""
import hashlib, json, sys, warnings
import openpyxl

warnings.filterwarnings("ignore")
src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else "src/kpi/referentiel.data.js"
wb = openpyxl.load_workbook(src, data_only=False)

def rows(name):
    ws = wb[name]
    return [[c for c in r] for r in ws.iter_rows(values_only=True)]

def clean(v):
    if v is None:
        return None
    if isinstance(v, float) and v.is_integer():
        return int(v)
    return v

# ── 01_KPI ──────────────────────────────────────────────────────────────────
kpi_rows = rows("01_KPI")
head = kpi_rows[0]
kpis = []
for r in kpi_rows[1:]:
    if not r[0] or not str(r[0]).strip() or len(str(r[0])) > 4:
        continue
    d = {head[i]: clean(r[i]) for i in range(len(head))}
    kpis.append({
        "id": d["KPI_ID"],
        "familyLabel": d["Famille"],
        "name": d["Nom_KPI"],
        "importanceLabel": d["Importance"],
        "phase": d["Phase"],
        "calculability": d["Calculabilité"],
        "definition": d["Définition"],
        "formula": d["Formule"],
        "unit": d["Unité"],
        "directionLabel": d["Sens"],
        "greenThreshold": d["Seuil_Vert"],
        "redThreshold": d["Seuil_Rouge"],
        "greenText": d["Vert"],
        "orangeText": d["Orange"],
        "redText": d["Rouge"],
        "dataOwner": d["Alimenté_par"],
        "kpiOwner": d["Responsable"],
        "targetFrequency": d["Fréquence_cible"],
        "dataSources": d["Tables_sources"],
        "justification": d["Justification_importance"],
    })

# ── 03_Matrice_Roles ────────────────────────────────────────────────────────
m = rows("03_Matrice_Roles")
roles = []
for i in range(3, 9):
    roles.append({"label": m[i][12], "scope": m[i][13], "view": m[i][14]})
def matrix(first, last):
    out_ = {}
    for r in m[first:last]:
        if r[0]:
            out_[r[0]] = [clean(x) for x in r[4:10]]
    return out_
kpi_matrix = matrix(3, 46)
scope_notes = {r[0]: r[11] for r in m[3:46] if r[0] and r[11]}
alert_matrix = matrix(50, 67)
for k in kpis:
    k["roleAccess"] = kpi_matrix[k["id"]]
    if k["id"] in scope_notes:
        k["roleScopeNote"] = scope_notes[k["id"]]

# ── 02_Regles_Alertes ───────────────────────────────────────────────────────
a = rows("02_Regles_Alertes")
ah = a[0]
alerts = []
for r in a[1:]:
    if not r[0] or not str(r[0]).startswith("AL"):
        continue
    d = {ah[i]: clean(r[i]) for i in range(len(ah))}
    conds = []
    for n in (1, 2, 3):
        f = d.get(f"C{n}_KPI_ou_champ")
        if f is not None:
            conds.append({"field": f, "op": d.get(f"C{n}_Op"), "threshold": d.get(f"C{n}_Seuil")})
    alerts.append({
        "id": d["Regle_ID"], "name": d["Nom"], "level": d["Niveau"],
        "importanceLabel": d["Importance"], "phase": d["Phase"],
        "condition": d["Condition (lisible)"], "logic": d["Logique"], "conditions": conds,
        "recipient": d["Destinataire"], "action": d["Action"], "frequency": d["Fréquence"],
        "origin": d["Origine"], "change": d["Changement par rapport à l'ancienne règle"],
        "roleAccess": alert_matrix[d["Regle_ID"]],
    })

# ── 08_Glossaire ────────────────────────────────────────────────────────────
glossary = [{"term": r[0], "meaning": r[1]} for r in rows("08_Glossaire")[1:] if r[0]]

# ── 00_Lecture (meta + common rules) ────────────────────────────────────────
l = rows("00_Lecture")
meta = {"title": l[0][0], "version": l[2][1], "source": l[3][1], "principle": l[4][1]}
common_rules = {r[0]: r[1] for r in l[14:22] if r[0] and r[1]}

with open(src, "rb") as fh:
    sha = hashlib.sha256(fh.read()).hexdigest()

payload = {
    "meta": {**meta, "workbookSha256": sha},
    "commonRules": common_rules,
    "roles": roles,
    "kpis": kpis,
    "alertRules": alerts,
    "glossary": glossary,
}

body = json.dumps(payload, ensure_ascii=False, indent=2)
with open(out, "w", encoding="utf-8", newline="\n") as fh:
    fh.write(
        "/*\n"
        " * GENERATED FILE — do not edit by hand.\n"
        " * Source: TAQADDUM_43_KPI_Referentiel (workbook v1, 12/10/2026).\n"
        " * Regenerate with: python3 scripts/kpi/export-referentiel.py <workbook.xlsx>\n"
        " * Texts are the workbook's own (French); thresholds are PROVISIONAL (see 00_Lecture).\n"
        " */\n\n"
        "export const REFERENTIEL = " + body + ";\n"
    )
print(f"{len(kpis)} KPIs, {len(alerts)} alert rules, {len(glossary)} glossary terms -> {out}")
