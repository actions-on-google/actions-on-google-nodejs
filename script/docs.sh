#!/bin/bash

# Navigate to project-root directory
cd "$(dirname "$0")/.."

# Make sure we have a clean local directory
rm -rf actions-on-google-nodejs-docs/

# Generate our docs
yarn docs

# Create a new folder and clone the project there
git clone --single-branch \
    --branch gh-pages \
    git@github.com:actions-on-google/actions-on-google-nodejs.git \
    actions-on-google-nodejs-docs

# Get the current version from package.json
VERSION=$(node -e "console.log(require('./package.json').version)")

# Copy docs/ to actions-on-google-nodejs-docs/VERSION
mkdir actions-on-google-nodejs-docs/${VERSION}
cp -r docs/ actions-on-google-nodejs-docs/${VERSION}

# Update index.html to replace the `refresh` meta tag
sed -i "s/refresh.*\/index.html/refresh\" content=\"0;url=${VERSION}\/index.html/" actions-on-google-nodejs-docs/index.html

# Create a new commit with the docs contents following the rule:
#  "Generate <VERSION> from <CURRENT COMMIT HASH>"
COMMIT=$(git rev-parse HEAD)
cd actions-on-google-nodejs-docs
git add .
git commit -m "Generate ${VERSION} from ${COMMIT}"

# Push the docs
git push git@github.com:actions-on-google/actions-on-google-nodejs.git gh-pages
