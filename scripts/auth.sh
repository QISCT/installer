#!/bin/bash

# Install GitHub CLI
if [ "$(command -v gh)" ]; then
  # GitHub CLI is globally installed
  GH=`which gh 2>&1`
elif [ -f "$HOME/.local/bin/gh" ]; then
  # GitHub CLI is locally installed
  GH="$HOME/.local/bin/gh"
else
  # GitHub CLI needs to be installed
  VERSION=`curl "https://api.github.com/repos/cli/cli/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/' | cut -c2-`
  curl -sSL https://github.com/cli/cli/releases/download/v${VERSION}/gh_${VERSION}_linux_amd64.tar.gz -o gh_${VERSION}_linux_amd64.tar.gz
  tar xvf gh_${VERSION}_linux_amd64.tar.gz
  mkdir $HOME/.local/bin
  mv gh_${VERSION}_linux_amd64/bin/gh $HOME/.local/bin/
  rm -rf gh_${VERSION}_linux_amd64
  rm gh_${VERSION}_linux_amd64.tar.gz
  echo "alias gh='${GH}'" >> $HOME/.bashrc
  source ~/.bashrc
  GH="$HOME/.local/bin/gh"
fi

if [[ `$GH auth status -t 2>&1` =~ .*"You are not logged into any GitHub hosts".* ]]; then
  # Authenticate through GitHub CLI and get username
  `$GH auth login`
fi
GITUSERNAME=`$GH api user | grep -oE '"login":"[^,]+"' | sed -E 's/.*"([^"]+)".*/\1/'`
GH_TOKEN=`$GH auth status -t 2>&1 | grep -oe 'Token: .*' | sed -E 's/Token: (.*)/\1/'`

# Setup git credentials
`$GH auth setup-git`
git config --global user.name $GITUSERNAME
git config --global user.email ${GITUSERNAME}@github.com

echo $GH_TOKEN >&2