import NSOLogin from "../src";

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
