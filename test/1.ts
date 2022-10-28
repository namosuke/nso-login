import NSOLogin from "../src";
import "cross-fetch/polyfill";

const nsoLogin = new NSOLogin();

(async () => {
  try {
    const sessionTokenCodeChallenge =
      "tYLPO5PxpK-DTcAHJXugD7ztvAZQlo0DQQp3au5ztuM";
    const sessionTokenCodeVerifier =
      "OwaTAOolhambwvY3RXSD-efxqdBEVNnQkc0bBJ7zaak";
    const sessionState = "V6DSwHXbqC4rspCn_ArvfkpG1WFSvtNYrhugtfqOHsF6SYyX";
    const { state, verifier, loginURL } = nsoLogin.getLoginURLWithParams(
      sessionState,
      sessionTokenCodeChallenge,
      sessionTokenCodeVerifier
    );
    console.log(
      sessionTokenCodeChallenge,
      sessionTokenCodeVerifier,
      sessionState,
      loginURL
    );
    const customURLScheme = process.env.CUSTOM_URL_SCHEME as string;
    const sessionToken = await nsoLogin.getSessionToken(
      customURLScheme,
      verifier
    );
    console.log(sessionToken);
  } catch (error) {
    console.log(error);
  }
  // console.log(sessionToken);
  // const nsoAppVersion = await nsoLogin.getNSOAppVersion();
  // console.log(nsoAppVersion);
  // const accessToken = await nsoLogin.getAccessToken(sessionToken);
  // console.log(accessToken);
  // const fDataNSO = await nsoLogin.getFDataNSO(accessToken);
  // console.log(fDataNSO);
  // const registrationToken = await nsoLogin.getRegistrationToken(
  //   accessToken,
  //   fDataNSO,
  //   nsoAppVersion
  // );
  // console.log(registrationToken);
  // const fDataApp = await nsoLogin.getFDataApp(registrationToken);
  // console.log(fDataApp);
  // const webServiceToken = await nsoLogin.getWebServiceToken(
  //   registrationToken,
  //   fDataApp,
  //   nsoAppVersion
  // );
  // console.log(webServiceToken);
  // const bulletToken = await nsoLogin.getBulletToken(webServiceToken);
  // console.log(bulletToken);
})();
