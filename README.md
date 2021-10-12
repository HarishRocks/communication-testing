# Communication Testing tool

## Setup

- Install Nodejs v14.15.3
- If you need to change nodejs version frequently, try using [this](https://github.com/coreybutler/nvm-windows)
- Install Visual Studio with workload "Desktop development with C++" (Only for windows)
- Python v3
- Run the following commands
- Install yarn (if you don't have it already)
  ```
  npm i -g yarn
  ```
- Install nodejs dependencies
  ```
  yarn
  ```
- Setup python cli (use pip3 in linux)
  ```
  cd python-cli
  pip install -r requirements.txt
  ```
- Build the code (Do it one time in setup and after that only if the code changes)
  ```
  yarn build
  ```

## Usage

- Start
  ```
  yarn start
  ```
- Custom communication
  ```
  yarn start:custom
  ```

## Package

### Requirements

- Install `nexe`
  ```
  npm i -g nexe
  ```
- Install `patchelf` (Linux)
  ```
  sudo apt-get install patchelf
  ```

### Package for Windows

- Nodejs v14.15.3 is required

- Run `package-win` command (This needs to be executed on git bash terminal)
  ```
  yarn package-win
  ```
- The executables will be created inside `build` folder

### Package for Linux

- Nodejs v14.15.3 is required

- Run `package-linux` command
  ```
  yarn package-linux
  ```
- The executables will be created inside `build` folder
