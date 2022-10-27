import NSOLogin from "../src";

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
