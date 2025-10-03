@echo off
REM Always run backend with the project virtual environment
SET VENV_PY=%~dp0venv\Scripts\python.exe
IF NOT EXIST "%VENV_PY%" (
  echo Virtual environment not found. Creating one...
  python -m venv "%~dp0venv"
)
"%VENV_PY%" -m pip install -r "%~dp0requirements.txt"
"%VENV_PY%" "%~dp0app.py"
