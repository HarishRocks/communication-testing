import sys
from cx_Freeze import setup, Executable

# Dependencies are automatically detected, but it might need fine tuning.
build_exe_options = {"includes": [], "include_files": [], "build_exe": "./dist/"}

setup(
    name="STM CLI",
    version="0.1",
    description="STM CLI",
    options={"build_exe": build_exe_options},
    executables=[Executable("index.py")])
