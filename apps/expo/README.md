# Jazz Stress Tests

## Development
Jazz packages are added to workspaces in the `package.json` file.  During local development of Jazz and this repo, they may be injected with `yalc`.

To get the `dist` folders properly populated build that entire lib first:

```bash
cd jazz
pnpm i
pnpm turbo build --filter="./packages/*"
pnpm yalc:all
```

Then build this app:

```bash
cd ../jazzstress/apps/expo
bun i
bun expo prebuild --clean --platform ios
cd ios
pod install --repo-update
cd ..
bun ios # or android
```
