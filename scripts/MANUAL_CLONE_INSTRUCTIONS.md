# Manual Database Cloning Instructions

Since PowerShell is having issues with the URI string, follow these manual steps:

## Step 1: Export Production Database

Run this command:
```cmd
mongodump --uri="mongodb://tellerco:LzNEYZfY9AyyblTE@ac-esumrbm-shard-00-00.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-01.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-02.hynpbrc.mongodb.net:27017/mfvpos?ssl=true&replicaSet=atlas-pb8n5v-shard-0&authSource=admin" --db=mfvpos --out=db-backup
```

This creates a backup in `./db-backup/mfvpos/` folder.

---

## Step 2: Import to Test Database

Run this command:
```cmd
mongorestore --uri="mongodb://tellerco:LzNEYZfY9AyyblTE@ac-esumrbm-shard-00-00.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-01.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-02.hynpbrc.mongodb.net:27017/mfvpos_test?ssl=true&replicaSet=atlas-pb8n5v-shard-0&authSource=admin" --db=mfvpos_test db-backup/mfvpos --drop
```

This creates a new database called `mfvpos_test` with all the data.

---

## Step 3: Update .env.local

1. **Backup** your current `.env.local`:
   ```cmd
   copy .env.local .env.local.backup
   ```

2. **Open** `.env.local` in your editor

3. **Find** this line:
   ```
   MONGODB_URI=mongodb://tellerco:LzNEYZfY9AyyblTE@ac-esumrbm-shard-00-00.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-01.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-02.hynpbrc.mongodb.net:27017/mfvpos?ssl=true&replicaSet=atlas-pb8n5v-shard-0&authSource=admin&appName=mynewdb
   ```

4. **Comment it out** by adding `#` at the start:
   ```
   # MONGODB_URI=mongodb://tellerco:LzNEYZfY9AyyblTE@ac-esumrbm-shard-00-00.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-01.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-02.hynpbrc.mongodb.net:27017/mfvpos?ssl=true&replicaSet=atlas-pb8n5v-shard-0&authSource=admin&appName=mynewdb
   ```

5. **Add** this line below it:
   ```
   # TEST DATABASE (Clone - safe to modify!)
   MONGODB_URI=mongodb://tellerco:LzNEYZfY9AyyblTE@ac-esumrbm-shard-00-00.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-01.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-02.hynpbrc.mongodb.net:27017/mfvpos_test?ssl=true&replicaSet=atlas-pb8n5v-shard-0&authSource=admin&appName=mynewdb
   ```

6. **Save** the file

---

## Step 4: Restart Dev Server

```cmd
npm run dev
```

---

## ✅ Done!

- **Gpowerpay** now uses `mfvpos_test` (safe to modify!)
- **GpowerCRM** still uses `mfvpos` (untouched!)

## To Restore Production

1. Copy `.env.local.backup` to `.env.local`
2. Restart dev server

---

## Quick Copy-Paste Commands

**All in one (CMD only):**
```cmd
mongodump --uri="mongodb://tellerco:LzNEYZfY9AyyblTE@ac-esumrbm-shard-00-00.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-01.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-02.hynpbrc.mongodb.net:27017/mfvpos?ssl=true&replicaSet=atlas-pb8n5v-shard-0&authSource=admin" --db=mfvpos --out=db-backup && mongorestore --uri="mongodb://tellerco:LzNEYZfY9AyyblTE@ac-esumrbm-shard-00-00.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-01.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-02.hynpbrc.mongodb.net:27017/mfvpos_test?ssl=true&replicaSet=atlas-pb8n5v-shard-0&authSource=admin" --db=mfvpos_test db-backup/mfvpos --drop
```

Then manually update `.env.local` as shown in Step 3.
