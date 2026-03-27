@echo off
setlocal enabledelayedexpansion

:: I used chatgpt to create this
:: Pfade definieren
:: set "BASE_DIR=C:\Users\konst\data\repos\jsgaalop\javascriptgaalopvisualizer\jsgaalop\assets\examples2"
set "BASE_DIR=.\"
:: set "GAALOP_JAR=C:\Users\konst\Downloads\distribution-2.2.6.2-bin-20260311T133101Z-1-001\distribution-2.2.6.2-bin\starter-1.0.0.jar"
set "GAALOP_JAR=..\distribution-2.2.6.2-bin\starter-1.0.0.jar"


set "INPUT_DIR=%BASE_DIR%\input"
set "OUTPUT_DIR=%BASE_DIR%\compiled"
set "ALGEBRA_DIR=%BASE_DIR%\algebra"

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

for %%F in ("%INPUT_DIR%\*.txt") do (
    echo.
    echo Verarbeite %%~nxF ...
    
    :: Erste Zeile lesen (z.B. // -a dcga)
    set /p FIRST_LINE=<"%%F"
    
    :: Alles nach "// " extrahieren
    set "EXTRA_ARGS=!FIRST_LINE:~3!"
    
    echo Gefundene Argumente: !EXTRA_ARGS!

    :: Gaalop Aufruf mit dynamischen Argumenten aus der Datei
    java -jar "%GAALOP_JAR%" --cli ^
        --codeGeneratorPlugin de.gaalop.jsonexport.Plugin ^
        --algebraBaseDir "%ALGEBRA_DIR%" ^
        !EXTRA_ARGS! ^
        --input "%%F" ^
        --outputDir "%OUTPUT_DIR%"
)

echo.
echo Fertig! Ergebnisse liegen in: %OUTPUT_DIR%
pause
