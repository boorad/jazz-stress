# Jazz Stress Tests

## Development
`jazz-react-native` and `cojson` are added to workspaces in the `package.json` file.

To get the `dist` folders properly populated build that entire lib first:

```bash
cd jazz
pnpm i
pnpm build
```

Then build this app:

```bash
cd ../jazzstress
bun i
bun pods
bun start
```
`i` # for ios
`a` # for android

## Creation

Steps used to create this app:

```bash
bunx @react-native-community/cli init jazzstress --install-pods true
bun add -d @babel/runtime@7.25.0 del-cli
bun add jazz-react-native@workspace:* cojson@workspace:*
bun add safe-stable-stringify tinybench @react-native-community/netinfo \
        @bacons/text-decoder buffer react-native-get-random-values
bun add react-native-nitro-modules react-native-quick-crypto
```
