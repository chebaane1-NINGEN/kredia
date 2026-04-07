@echo off
REM ========================================
REM Script de création de migration SQL
REM Usage: create_migration.bat "description"
REM Exemple: create_migration.bat "add_user_phone"
REM ========================================

if "%1"=="" (
    echo.
    echo ❌ Erreur: Description manquante
    echo.
    echo Usage: create_migration.bat "description_de_la_migration"
    echo Exemple: create_migration.bat "add_user_phone"
    echo.
    exit /b 1
)

REM Générer le timestamp (format: YYYYMMDDHHmmss)
for /f "tokens=1-6 delims=/: " %%a in ("%date% %time%") do (
    set YEAR=%%c
    set MONTH=%%a
    set DAY=%%b
    set HOUR=%%d
    set MINUTE=%%e
    set SECOND=%%f
)

REM Formatter avec des zéros à gauche si nécessaire
set MONTH=0%MONTH%
set MONTH=%MONTH:~-2%
set DAY=0%DAY%
set DAY=%DAY:~-2%
set HOUR=0%HOUR%
set HOUR=%HOUR:~-2%
set MINUTE=0%MINUTE%
set MINUTE=%MINUTE:~-2%
set SECOND=0%SECOND%
set SECOND=%SECOND:~-2%

set TIMESTAMP=%YEAR%%MONTH%%DAY%%HOUR%%MINUTE%%SECOND%

set DESCRIPTION=%~1
set FILENAME=%TIMESTAMP%__%DESCRIPTION%.sql
set FILEPATH=src\main\resources\db\migration\%FILENAME%

REM Créer le fichier de migration
(
echo -- =====================================================
echo -- Migration: %DESCRIPTION%
echo -- Created: %date% %time%
echo -- Author: %USERNAME%
echo -- =====================================================
echo.
echo -- TODO: Ajouter vos modifications SQL ici
echo.
echo -- Exemple:
echo -- ALTER TABLE users ADD COLUMN phone_number VARCHAR^(20^);
echo -- CREATE INDEX idx_users_phone ON users^(phone_number^);
echo.
) > "%FILEPATH%"

echo.
echo ✅ Migration créée avec succès !
echo.
echo 📁 Fichier: %FILENAME%
echo 📝 Chemin: %FILEPATH%
echo.
echo 📋 Prochaines étapes:
echo    1. Editez le fichier et ajoutez vos modifications SQL
echo    2. Testez avec: mvnw spring-boot:run
echo    3. Commitez: git add . ^&^& git commit -m "migration: %DESCRIPTION%"
echo.
