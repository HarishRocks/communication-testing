# Communication Testing tool

## Setup

- Install Nodejs v12
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
