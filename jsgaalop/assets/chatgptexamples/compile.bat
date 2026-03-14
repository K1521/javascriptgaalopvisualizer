@echo off
set GAALOP_JAR=C:\Users\konst\Downloads\distribution-2.2.6.2-bin-20260311T133101Z-1-001\distribution-2.2.6.2-bin\starter-1.0.0.jar
set INPUT_DIR=C:\Users\konst\data\repos\jsgaalop\javascriptgaalopvisualizer\jsgaalop\assets\chatgptexamples
set OUTPUT_DIR=%INPUT_DIR%\compiled

:: create output folder if it doesn't exist
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

:: loop through all .txt files except readme.txt
for %%F in (%INPUT_DIR%\*.txt) do (
    if /I not "%%~nxF"=="readme.txt" (
        echo Compiling %%~nxF ...
        java -jar "%GAALOP_JAR%" --cli --codeGeneratorPlugin de.gaalop.jsonexport.Plugin --algebraName dcga --input "%%F" --outputDir "%OUTPUT_DIR%"
    )
)
echo All files compiled (excluding readme.txt).
pause