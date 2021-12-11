
# Clean
clean() {
  rm -rf build/*
  mkdir -p build
}

# Build
build() {
  yarn build
}

# Copy .env
copyEnv() {
  cp .env ./build/.env
  echo "\nEXECUTION_TYPE=EXECUTABLE" >> ./build/.env
}

# Copy Node modules
copyNodeModules() {
  cp -r node_modules ./build/
}

# Package node
packageNode() {
  nexe dist/cli/index.js -o ./build/${CLI_FILENAME} --target=${TARGET} 
  nexe dist/custom.js -o ./build/${CUSTOM_CLI_FILENAME} --target=${TARGET}
}

# Package python
packagePython() {
  cd python-cli 
  ${PYTHON_COMMAND} setup.py build
  cd ../
  cp -r ./python-cli/dist ./build/python-cli
}

packageAll() {
  clean
  build
  packageNode
  packagePython
  copyEnv
  copyNodeModules
}

case $1 in
  linux)
    TARGET=linux-x64-14.15.3
    PYTHON_COMMAND=python3
    CLI_FILENAME=cli
    CUSTOM_CLI_FILENAME=custom
    packageAll
  ;;
  win)
    TARGET=windows-x64-14.15.3
    PYTHON_COMMAND=python
    CLI_FILENAME=cli.exe
    CUSTOM_CLI_FILENAME=custom.exe
    packageAll
  ;;
  *)
    echo "Invalid command"
    exit 1
  ;;
esac
