#!/bin/sh
#
# Copyright 2020 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
if [ "$NODE_ENV" != "ci" ]; then
  echo "Error: Script can only be ran in an continuous integration environment"
  exit 1
fi

# Load nvm
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"

set -x
# Fail on any error.
set -e

# Test on Node.js 12.22.2
echo "Running tests on Node 12.22.2"
rm -rf node_modules yarn.lock package-lock.json
nvm install 12.22.2
nvm use 12.22.2
npm i -g yarn

# Actual build
yarn
yarn build

# only check coverage for 12.22.2
sh script/coverage.sh

# only generate docs using 12.22.2
yarn docs

# Test on Node.js 14
echo "Running tests on Node 14"
rm -rf node_modules yarn.lock package-lock.json
nvm install 14
nvm use 14
npm i -g yarn

# Actual build
yarn
yarn build
