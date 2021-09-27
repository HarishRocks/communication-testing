
# Clean
clean() {
  rm -rf build/*
  mkdir build
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

# Package node
packageNode() {
  pkg --target=${TARGET} dist/cli/index.js -o ./build/${CLI_FILENAME}
  pkg --target=${TARGET} dist/custom.js -o ./build/${CUSTOM_CLI_FILENAME}
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
  copyEnv
  build
  packageNode
  packagePython
}

case $1 in
  linux)
    TARGET=node14-linux-x64
    PYTHON_COMMAND=python3
    CLI_FILENAME=cli
    CUSTOM_CLI_FILENAME=custom
    packageAll
  ;;
  win)
    TARGET=node14-win-x64
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
