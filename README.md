# nso-login

Login Helper for Nintendo Switch Online

## Overview

You don't need to know how NSO works. This Node.js library calls API instead of you. Request's result is automatically cached while using same instance.

## Installation

```sh
yarn add nso-login
```

## Usage

Before running programs, you need to get a something valid token and set to instance.

`approvalLink` property is one of the good example:

1. Get a login URL from `.getLoginURL()`.
2. Open the URL on your browser.
3. Login to your account.
4. Copy link of red button that labeled "connect".
5. The link is `approvalLink`. Set it like `nsoLogin.approvalLink = "npf71b963c1b7b6d119://auth..."`.

> **Note**
> approvalLink expires in 900 seconds.

Getting bullet token:

```ts
import NSOLogin from "nso-login";

const nsoLogin = new NSOLogin();

(async () => {
  nsoLogin.approvalLink = process.env.APPROVAL_LINK as string;
  const bulletToken = await nsoLogin.getBulletToken();
  console.log(bulletToken);
})();
```

Getting many tokens:

```ts
import NSOLogin from "nso-login";

const nsoLogin = new NSOLogin();

(async () => {
  nsoLogin.approvalLink = process.env.APPROVAL_LINK as string;
  const sessionToken = await nsoLogin.getSessionToken();
  console.log(sessionToken);
  const nsoAppVersion = await nsoLogin.getNSOAppVersion();
  console.log(nsoAppVersion);
  const accessToken = await nsoLogin.getAccessToken();
  console.log(accessToken);
  const fDataNSO = await nsoLogin.getFDataNSO();
  console.log(fDataNSO);
  const registrationToken = await nsoLogin.getRegistrationToken();
  console.log(registrationToken);
  const fDataApp = await nsoLogin.getFDataApp();
  console.log(fDataApp);
  const webServiceToken = await nsoLogin.getWebServiceToken();
  console.log(webServiceToken);
  const bulletToken = await nsoLogin.getBulletToken();
  console.log(bulletToken);
})();
```

You can use any parameters:

```ts
import NSOLogin from "nso-login";

const nsoLogin = new NSOLogin();

(async () => {
  const loginURL = await nsoLogin.getLoginURL();
  console.log(loginURL);
  const approvalLink = process.env.APPROVAL_LINK as string;
  const sessionToken = await nsoLogin.getSessionToken(approvalLink);
  console.log(sessionToken);
  const nsoAppVersion = await nsoLogin.getNSOAppVersion();
  console.log(nsoAppVersion);
  const accessToken = await nsoLogin.getAccessToken(sessionToken);
  console.log(accessToken);
  const fDataNSO = await nsoLogin.getFDataNSO(accessToken);
  console.log(fDataNSO);
  const registrationToken = await nsoLogin.getRegistrationToken(
    accessToken,
    fDataNSO,
    nsoAppVersion
  );
  console.log(registrationToken);
  const fDataApp = await nsoLogin.getFDataApp(registrationToken);
  console.log(fDataApp);
  const webServiceToken = await nsoLogin.getWebServiceToken(
    registrationToken,
    fDataApp,
    nsoAppVersion
  );
  console.log(webServiceToken);
  const bulletToken = await nsoLogin.getBulletToken(webServiceToken);
  console.log(bulletToken);
})();
```

## Test

Write your `approvalLink` to `.env`:

```env
APPROVAL_LINK="npf71b963c1b7b6d119://auth#session_state=..."
```

Then run test command:

```sh
yarn test test/1.ts
```
