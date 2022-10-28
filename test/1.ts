import NSOLogin from "../src";

const nsoLogin = new NSOLogin();

(async () => {
  const loginURL = nsoLogin.loginURL;
  console.log(loginURL);
  nsoLogin.nasid = process.env.NASID as string;
  const approvalLink = await nsoLogin.getApprovalLink();
  console.log(approvalLink);
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
