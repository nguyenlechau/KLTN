#!/bin/bash

# Setup script for local PostgreSQL database
# Usage: bash setup-db.sh

echo "🗄️  Setting up local PostgreSQL database..."

# Configuration
DB_NAME="kltn_db"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL connection...${NC}"
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL is not running on $DB_HOST:$DB_PORT${NC}"
    echo "Start PostgreSQL and try again."
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL is running${NC}"

# Create database
echo -e "${YELLOW}Creating database '$DB_NAME'...${NC}"
PGPASSWORD="$DB_PASSWORD" createdb -h "$DB_HOST" -U "$DB_USER" -p "$DB_PORT" "$DB_NAME" 2>/dev/null || true

# Run migrations
echo -e "${YELLOW}Running migrations...${NC}"

# Run each migration file
for migration in migrations/005_create_real_schema_up.sql; do
    if [ -f "$migration" ]; then
        echo -e "${YELLOW}  - Running $migration...${NC}"
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -p "$DB_PORT" -d "$DB_NAME" -f "$migration"
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}    ✓ Success${NC}"
        else
            echo -e "${RED}    ✗ Failed${NC}"
            exit 1
        fi
    fi
done

echo ""
echo -e "${GREEN}✅ Database setup complete!${NC}"
echo ""
echo "Connection string:"
echo "  postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "To connect manually:"
echo "  psql -h $DB_HOST -U $DB_USER -d $DB_NAME"
