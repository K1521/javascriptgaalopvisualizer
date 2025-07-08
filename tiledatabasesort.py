import sqlite3

def parse_sid(sid_bytes: bytes) -> str:
    if len(sid_bytes) < 8:
        return "Invalid SID length"
    
    revision = sid_bytes[0]
    subauth_count = sid_bytes[1]
    authority = int.from_bytes(sid_bytes[2:8], byteorder='big')
    
    subauths = []
    offset = 8
    for _ in range(subauth_count):
        if offset + 4 > len(sid_bytes):
            return "Invalid SID subauthority length"
        subauth = int.from_bytes(sid_bytes[offset:offset+4], byteorder='little')
        subauths.append(subauth)
        offset += 4
    
    sid_str = f"S-{revision}-{authority}"
    for sa in subauths:
        sid_str += f"-{sa}"
    return sid_str




db_path = r"C:\Users\Konstantin\data\debuglogs\statereposqlcopy\StateRepository-Machine.srd"

# Connect to the SQLite database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Execute the query




# Print table names
tabels=[x[0] for x in cursor.execute("SELECT name FROM sqlite_master WHERE type='table';").fetchall()]

tabelsizes=[(tabelname,int(cursor.execute(f"SELECT COUNT(*) AS row_count FROM {tabelname};").fetchone()[0])) for tabelname in tabels]
tabelsizes.sort(key=lambda i:i[1])
for name,size in tabelsizes:
    print(name,size)





# PackageUser 133931
# PackageFamilyUser 138505
# ApplicationUser 306111
# PrimaryTileUser 313266

bigtabels=[tabelname for tabelname,size in tabelsizes if size>10000]

for tabel in bigtabels:
    print()
    print(tabel)
    for name,coltype in cursor.execute(f"SELECT name,type from pragma_table_info('{tabel}');"):
        print(name,coltype)






# Replace ApplicationUser or your table name and column names accordingly
sids=[]

for _UserID, user_sid_blob in cursor.execute("SELECT _UserID, UserSid FROM User ORDER BY _UserID ; ").fetchall():
    # user_sid_blob might be bytes or hex string, handle both
    if isinstance(user_sid_blob, bytes):
        sid_bytes = user_sid_blob
    elif isinstance(user_sid_blob, str):
        # If hex string (e.g. "010500..."), convert to bytes
        sid_bytes = bytes.fromhex(user_sid_blob)
    else:
        print(f"Unknown type for UserSid: {_UserID} -> {user_sid_blob}")
        continue

    sid_str = parse_sid(sid_bytes)
    sids.append((_UserID,sid_str))
    #print(f"UserID: {_UserID}, SID: {sid_str}")

print()


for _UserID,sid_str in sids:
    if not sid_str.startswith("S-1-5-21-3164996276-750160529-1829407992"):
        print(sid_str)

print()
weirdsids=(sorted(int(sid_str.removeprefix("S-1-5-21-3164996276-750160529-1829407992-"))for _UserID,sid_str in sids if sid_str.startswith("S-1-5-21-3164996276-750160529-1829407992")))

sidranges=[]
for sid in weirdsids:
    if sidranges and sidranges[-1][1]+1==sid:
        sidranges[-1][1]=sid
    else:
        sidranges.append([sid,sid])
for sidstart,sidend in sidranges:
    if sidstart==sidend:
        print(sidstart)
    else:
        print(f"{sidstart}-{sidend}")

for tabel in ["Package","PackageFamily","User","Application","ApplicationIdentity"]:
    print()
    print(tabel)
    for name,coltype in cursor.execute(f"SELECT name,type from pragma_table_info('{tabel}');"):
        print(name,coltype)
conn.close()

"""
SELECT 
  ai._ApplicationIdentityID,
  ai.ApplicationUserModelId,
  COUNT(au._ApplicationUserID) as usage_count
FROM 
  ApplicationUser au
JOIN 
  ApplicationIdentity ai
  ON au.ApplicationIdentity = ai._ApplicationIdentityID
GROUP BY 
  ai._ApplicationIdentityID
ORDER BY 
  usage_count DESC;

  


  SELECT 
  ai._ApplicationIdentityID,
  ai.ApplicationUserModelId,
  COUNT(au._ApplicationUserID) as usage_count
FROM 
  ApplicationUser au
JOIN 
  ApplicationIdentity ai
  ON au.ApplicationIdentity = ai._ApplicationIdentityID
GROUP BY 
  ai._ApplicationIdentityID
ORDER BY 
  usage_count DESC;

  
  SELECT 
  ai._ApplicationIdentityID,
  ai.ApplicationUserModelId,
  COUNT(ptu._PrimaryTileUserID) AS usage_count
FROM 
  PrimaryTileUser ptu
JOIN 
  ApplicationIdentity ai ON ptu.ApplicationIdentity = ai._ApplicationIdentityID
GROUP BY 
  ai._ApplicationIdentityID, ai.ApplicationUserModelId
HAVING 
  COUNT(ptu._PrimaryTileUserID) > 2500
ORDER BY 
  usage_count DESC;
  """