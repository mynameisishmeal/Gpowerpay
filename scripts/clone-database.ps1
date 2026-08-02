# Clone Database Script
# Creates an offline replica of the production database for testing

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Database Cloning Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if mongodump and mongorestore are installed
Write-Host "Checking MongoDB tools..." -ForegroundColor Yellow
$mongodump = Get-Command mongodump -ErrorAction SilentlyContinue
$mongorestore = Get-Command mongorestore -ErrorAction SilentlyContinue

if (-not $mongodump -or -not $mongorestore) {
    Write-Host "ERROR: MongoDB Database Tools not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install MongoDB Database Tools:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.mongodb.com/try/download/database-tools" -ForegroundColor White
    Write-Host "2. Extract and add to PATH" -ForegroundColor White
    Write-Host "3. Or install via: winget install MongoDB.DatabaseTools" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✓ MongoDB tools found" -ForegroundColor Green
Write-Host ""

# Production connection details
$PROD_URI = 'mongodb://tellerco:LzNEYZfY9AyyblTE@ac-esumrbm-shard-00-00.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-01.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-02.hynpbrc.mongodb.net:27017/mfvpos?ssl=true&replicaSet=atlas-pb8n5v-shard-0&authSource=admin&appName=mynewdb'
$PROD_DB = "mfvpos"

# Test database name
$TEST_DB = "mfvpos_test"

# Backup directory
$BACKUP_DIR = ".\db-backup"

Write-Host "Configuration:" -ForegroundColor Cyan
Write-Host "  Production DB: $PROD_DB" -ForegroundColor White
Write-Host "  Test DB: $TEST_DB" -ForegroundColor White
Write-Host "  Backup Dir: $BACKUP_DIR" -ForegroundColor White
Write-Host ""

# Create backup directory
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "✓ Created backup directory" -ForegroundColor Green
}

# Step 1: Export production database
Write-Host "Step 1: Exporting production database..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

& mongodump --uri=$PROD_URI --db=$PROD_DB --out=$BACKUP_DIR

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database exported successfully" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✗ Export failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Import to test database
Write-Host "Step 2: Importing to test database ($TEST_DB)..." -ForegroundColor Yellow

# Construct test URI by replacing database name
$TEST_URI = $PROD_URI.Replace("/$PROD_DB", "/$TEST_DB")

& mongorestore --uri=$TEST_URI --db=$TEST_DB "$BACKUP_DIR\$PROD_DB" --drop

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database imported successfully" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "✗ Import failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Update .env.local
Write-Host "Step 3: Updating .env.local..." -ForegroundColor Yellow

$envPath = ".\.env.local"
$envContent = Get-Content $envPath -Raw

# Backup original .env.local
Copy-Item $envPath "$envPath.backup" -Force
Write-Host "✓ Backed up .env.local to .env.local.backup" -ForegroundColor Green

# Comment out production URI and add test URI
$envContent = $envContent -replace 'MONGODB_URI=mongodb://', '# MONGODB_URI=mongodb://'
$testUriLine = "`n`n# TEST DATABASE (Clone of production - safe to modify)`nMONGODB_URI=mongodb://tellerco:LzNEYZfY9AyyblTE@ac-esumrbm-shard-00-00.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-01.hynpbrc.mongodb.net:27017,ac-esumrbm-shard-00-02.hynpbrc.mongodb.net:27017/mfvpos_test?ssl=true&replicaSet=atlas-pb8n5v-shard-0&authSource=admin&appName=mynewdb`n"

# Find first commented MONGODB_URI and add test URI after it
if ($envContent -match '(# MONGODB_URI=mongodb://[^\n]+)') {
    $envContent = $envContent -replace '(# MONGODB_URI=mongodb://[^\n]+)', "`$1$testUriLine"
} else {
    # If no commented line found, add at the end
    $envContent += $testUriLine
}

Set-Content $envPath $envContent

Write-Host "✓ Updated .env.local to use test database" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Database Cloning Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "What happened:" -ForegroundColor Cyan
Write-Host "  1. ✓ Exported production DB to: $BACKUP_DIR" -ForegroundColor White
Write-Host "  2. ✓ Created test database: $TEST_DB" -ForegroundColor White
Write-Host "  3. ✓ Updated .env.local to use test DB" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart your dev server: Ctrl+C then 'npm run dev'" -ForegroundColor Yellow
Write-Host "  2. App now uses TEST database (safe to modify!)" -ForegroundColor Yellow
Write-Host "  3. GpowerCRM still uses PRODUCTION database (unchanged)" -ForegroundColor Yellow
Write-Host ""
Write-Host "To restore production database:" -ForegroundColor Cyan
Write-Host "  1. Copy .env.local.backup to .env.local" -ForegroundColor White
Write-Host "  2. Restart dev server" -ForegroundColor White
Write-Host ""
Write-Host "Backup location: $BACKUP_DIR" -ForegroundColor Gray
Write-Host ""
