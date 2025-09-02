import pandas as pd

# Charger le fichier Excel
df = pd.read_excel("Santoral.xlsm")

# Vérifie le nom de la colonne de dates
# Ici j'utilise "Date", à adapter selon ton fichier
col_date = "Fecha"

# Convertir la colonne de dates en datetime
df[col_date] = pd.to_datetime(df[col_date], dayfirst=True)

# Créer une nouvelle colonne avec le format MM-DD (perpétuel)
df["Fechas"] = df[col_date].dt.strftime("%m-%d")

# Si tu veux, tu peux supprimer la colonne originale
df = df.drop(columns=[col_date])

# Réorganiser les colonnes (facultatif)
# Ici je mets date_courte en premier
cols = ["Fechas"] + [c for c in df.columns if c != "Fechas"]
df = df[cols]

# Exporter en JSON
df.to_json("donnees.json", orient="records", force_ascii=False)

print("✅ Export terminé : donnees.json créé avec les dates en MM-DD")
