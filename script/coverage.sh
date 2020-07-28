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
# If the current git message contains the phrase DISABLE_COVERAGE_CHECK, we can
# end early.
git log -1 | grep DISABLE_COVERAGE_CHECK
if [ $? -eq 0 ]; then
  exit 0 # Exit early without error as we don't want to run coverage
fi

# Fail on any error.
set -e

# Run coverage on most recent HEAD
# Make sure we get the most recent commit hash
curr_hash="$(git rev-parse HEAD)"
git checkout HEAD~1

# We are in HEAD-1
# Run coverage check and get it output as ./coverage/coverage-summary.json
yarn test

# File is stored in coverage/coverage-summary.json
coverage_pct="console.log(require('./coverage/coverage-summary.json').total.functions.pct)"
prev_coverage=$(node -e $coverage_pct)

# Now go to this commit
git checkout "$curr_hash"

# Run coverage check and get it output as ./coverage/coverage-summary.json
yarn test

# File is stored in coverage/coverage-summary.json
curr_coverage=$(node -e $coverage_pct)
gt="$(echo $prev_coverage'<='$curr_coverage'+3' | bc -l)"
if [ $gt -ne 1 ]; then
  # This change reduces function code coverage.
  # This is not good.
  echo "This change reduces code coverage from ${prev_coverage}% to ${curr_coverage}%"
  exit 1
else
  echo "Coverage has changed from ${prev_coverage}% to ${curr_coverage}%"
fi
