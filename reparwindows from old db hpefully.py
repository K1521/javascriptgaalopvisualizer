#i bricked my windows by deleating the StateRepository database
#this script adds some entries from the old db and was able to bring my system back
#
import sqlite3


db_path = r"C:\Users\Konstantin\data\debug\staterepocopy2\StateRepository-Machine.srd"

# Connect to the SQLite database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()






# Query to get installed locations
cursor.execute("""
    SELECT pl.InstalledLocation
    FROM PackageLocation pl
    WHERE pl.InstalledLocation IS NOT NULL
""")

locations = [row[0] for row in cursor.fetchall()]
print(locations)
print(len(locations))
print(len(set(locations)))
locations=list(set(locations))

conn.close()


import subprocess
import os

for i,location in enumerate(locations):
    manifest_path = os.path.join(location, "AppXManifest.xml")
    if os.path.isfile(manifest_path):
        print(f"{i}/{len(locations)}  Registering package from: {manifest_path}")
        try:
            # Run PowerShell command to register package
            subprocess.run([
                "powershell",
                "-Command",
                f"Add-AppxPackage -Register '{manifest_path}' -DisableDevelopmentMode"
            ], check=True)
        except subprocess.CalledProcessError as e:
            print(f"Failed to register {manifest_path}: {e}")
    else:
        print(f"Manifest not found at: {manifest_path}")