# Bahmni-Standard-BahmniApps

1. This repository contains most of the frontend code for the **Bahmni EMR**. It is written in **AngularJS** with
   only the Form viewer part utilising _React_.
2. See the sub-folder: `ui/app/` to understand which all modules of the EMR UI are contained in this codebase.
3. To Run Bahmni locally you should use Docker option of Bahmni or Vagrant option. Docker is recommended.

# Build

### Notes

1. This build requires Node, npm, yarn, grunt and compass (ruby).
2. You can see the [Github Action Build](https://github.com/Bahmni/openmrs-module-bahmniapps/actions/workflows/build_publish.yml) to see what commands get executed.

### One time installation:

These steps need to performed ONLY the FIRST TIME you set up this code.

1. Install node/npm (node version: 10.11.0). Preferably use nvm, so that you have control over which project uses which version of node. See:
   - [how to install Node using nvm](https://github.com/nvm-sh/nvm).
   - [how to install NodeJS on mac](https://www.newline.co/@Adele/how-to-install-nodejs-and-npm-on-macos--22782681).
2. Install Yarn: `npm install -g yarn`
3. Install Grunt: `npm install -g grunt-cli`
4. Install Compass:
   - Compass compiles SASS/SCSS into CSS.
   - Requires ruby (It's recommended to install ruby also using rvm. See install [rvm with ruby](https://stackify.com/rvm-how-to-get-started-and-manage-your-ruby-installations/)).
   - Ruby version: 3.1
   - Once ruby is installed, you can install compass using: `gem install compass`

### Build commands

**NOTE:**

Run these commands from within the `micro-frontends` sub-folder
1. `yarn install`
2. `yarn build`
3. If build is successful, the `../ui/app/micro-frontends-dist` folder has the set of files which can be used by the angular modules for their build

Run these commands from within the `ui` sub-folder.

1. `yarn install`
2. `yarn ci` (will internally trigger grunt)
3. If build is successful, the `dist` folder has the set of files to be deployed in Apache (or in Vagrant).

### Docker (Hot Deploy)

1. If you are using Bahmni Docker, then you can hot deploy your app by following these steps: [Bahmni Web Configurations Docker (Wiki)](https://bahmni.atlassian.net/wiki/spaces/BAH/pages/3117449349/Bahmni-Web+Configurations+docker)

## Bahmniapps (bahmni-web) docker image

Docker images for [Bahmniapps](https://hub.docker.com/r/bahmni/bahmni-web/tags) is built using [Github Actions](/.github/workflows).

Resources to build the following docker images can be found in the [package](/package) directory.

