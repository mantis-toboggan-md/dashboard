## Writing UI Extensions
See [Rancher UI External Documentation - Extensions](https://extensions.rancher.io/extensions/next/home) for more information

### Initializing Extensions
- if not specified, assume the extension will be initialized in a new repository named EXTENSION_NAME_EXTENSION
- never modify code outside of the pkg/EXTENSION_NAME directory
- extension names must be kebab-case


#### Initializing Built-in extensions
- initialize extensions in the current repository using the following command from the root of the repository: 
        npm init @rancher/extension@latest EXTENSION_NAME --skeleton-only

#### Initializing New Extension Repositories
- The extension should be created in a new directory named EXTENSION_NAME-extension and initialized by running the following command from that repository:
        npm init @rancher/extension@latest EXTENSION_NAME 
- the user will be responsible for initializing the directory as a git repository and pushing the initial commit to github

### Writing Extensions Generally
//TODO nb better instructions to add to cluster explorer vs top level product
- re-use existing components and patterns as much as possible
- rely on explicitly defined extensions api functionality as much as possible
- use plugin.extendProduct instead of defining a new product config whenever possible
- write new components using the composition API and typescript
- typings should live in /types and not be defined in .vue components if they are used in multiple places
- import usei18n from '@shell/composables/useI18n' not from 'vue-i18n'

### Writing Extensions for Helm Apps
- the extension must cater to the latest version of the helm app provided
- add a new group entry to the cluster explorer whose title matches the name of the helm app
- add nav items to the new group corresponding to each CRD provided by the helm app and its dependencies
- the extension should be able to detect if the helm app and its dependencies are installed and show a splash screen if they are not
- the extension should use the InstallHelmCharts component to offer users a quick way to install the desired helm app
- the extension should also add an overview page to the new cluster explorer nav group that may be navigated to by clicking the group title
- The overview page should surface information typically required to debug the app
- create edit pages for each CRD added to the navigation if instances of the custom resource may be created by the user. Do not add 'edit' pages for read-only custom resources.
- edit pages should expose all required fields in the CRD spec and use form-validation mixin to validate that all required fields are populated before allowing users to submit the form
- if the helm chart's documentation includes "quick start" or "examples" that include instances of CRDs the 'edit' pages should expose all fields under a 'spec' field used in those examples
- if a custom resource definition specifies a default value for a field that is exposed in the UI, the form should be instatiated with that field set to the default
- All new forms in extensions should use the RcSection or Accordion components instead of Tabbed/Tab


