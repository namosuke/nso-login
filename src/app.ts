import packageJson from "../package.json";

type NSOLoginOptions = {};
type FData = { f: string; timestamp: number; request_id: string };

class NSOLogin {
  constructor(options?: NSOLoginOptions) {}

  /** ニンテンドーアカウント選択画面のURL */
  loginURL: null | string = null;
  loginParams = {
    state: "V6DSwHXbqC4rspCn_ArvfkpG1WFSvtNYrhugtfqOHsF6SYyX",
    redirect_uri: "npf71b963c1b7b6d119://auth",
    client_id: "71b963c1b7b6d119",
    scope: "openid user user.birthday user.mii user.screenName",
    response_type: "session_token_code",
    session_token_code_challenge: "tYLPO5PxpK-DTcAHJXugD7ztvAZQlo0DQQp3au5ztuM",
    session_token_code_challenge_method: "S256",
  };

  async pullLoginURL() {
    const url = "https://accounts.nintendo.com/connect/1.0.0/authorize";
    const response = await fetch(
      `${url}?${new URLSearchParams(this.loginParams)}`
    );
    this.loginURL = response.url;
  }

  /**
   * @return ニンテンドーアカウント選択画面のURL
   */
  async getLoginURL() {
    if (this.loginURL === null) {
      await this.pullLoginURL();
    }
    return this.loginURL as string;
  }

  /** セッショントークン */
  sessionToken: null | string = null;
  sessionTokenCodeVerifier = "OwaTAOolhambwvY3RXSD-efxqdBEVNnQkc0bBJ7zaak";

  /**
   * @param approvalLink 「この人にする」のアドレス
   */
  async pullSessionToken(approvalLink: string) {
    const sessionTokenCode = /de=(.*?)&/.exec(approvalLink)?.[1];
    if (sessionTokenCode === undefined) {
      throw new Error("Invalid approvalLink");
    }
    const url = "https://accounts.nintendo.com/connect/1.0.0/api/session_token";
    const params = {
      client_id: this.loginParams.client_id,
      session_token_code: sessionTokenCode,
      session_token_code_verifier: this.sessionTokenCodeVerifier,
    };
    const requestBody = new URLSearchParams(params).toString();
    const response = await fetch(url, {
      method: "POST",
      body: requestBody,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    if (response.status !== 200) {
      throw new Error((await response.json()).error_description);
    }
    const sessionToken = (await response.json()).session_token;
    if (typeof sessionToken !== "string") {
      throw new Error("Cannot find session_token in response");
    }
    this.sessionToken = sessionToken;
  }

  /**
   * @param approvalLink 「この人にする」のアドレス
   * @return セッショントークン
   */
  async getSessionToken(approvalLink: string) {
    if (this.sessionToken === null) {
      await this.pullSessionToken(approvalLink);
    }
    return this.sessionToken as string;
  }

  /** NSOアプリバージョン */
  nsoAppVersion: null | string = null;

  async pullNSOAppVersion() {
    const url = "https://itunes.apple.com/lookup?id=1234806557";
    const response = await fetch(url);
    const json = await response.json();
    const nsoAppVersion = json.results[0].version;
    if (typeof nsoAppVersion !== "string") {
      throw new Error("Cannot find NSO app version in response");
    }
    this.nsoAppVersion = nsoAppVersion;
  }

  /**
   * @return NSOアプリバージョン
   */
  async getNSOAppVersion() {
    if (this.nsoAppVersion === null) {
      await this.pullNSOAppVersion();
    }
    return this.nsoAppVersion as string;
  }

  /** アクセストークン */
  accessToken: null | string = null;

  /** IDトークン */
  idToken: null | string = null;

  /**
   * @param sessionToken セッショントークン
   */
  async pullAccessToken(sessionToken: string) {
    const url = "https://accounts.nintendo.com/connect/1.0.0/api/token";
    const params = {
      client_id: this.loginParams.client_id,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer-session-token",
      session_token: sessionToken,
    };
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status !== 200) {
      throw new Error("Failed to get access token");
    }
    const json = await response.json();
    const accessToken = json.access_token;
    if (typeof accessToken !== "string") {
      throw new Error("Cannot find access_token in response");
    }
    this.accessToken = accessToken;
    const idToken = json.id_token;
    if (typeof idToken !== "string") {
      throw new Error("Cannot find id_token in response");
    }
    this.idToken = idToken;
  }

  /**
   * @param sessionToken セッショントークン
   * @return アクセストークン
   */
  async getAccessToken(sessionToken: string) {
    if (this.accessToken === null) {
      await this.pullAccessToken(sessionToken);
    }
    return this.accessToken as string;
  }

  /**
   * @param accessToken アクセストークン
   * @param hashMethod NSO is 1, APP is 2
   * @return f APIのリザルト
   */
  async getFData(accessToken: string, hashMethod: 1 | 2) {
    const url = "https://api.imink.app/f";
    const params = {
      hash_method: hashMethod,
      token: accessToken,
    };
    const headers = {
      "User-Agent": `${process.env.npm_package_name ?? packageJson.name}/${
        process.env.npm_package_version ?? packageJson.version
      }`,
      "Content-Type": "application/json",
    };
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(params),
      headers: headers,
    });
    if (response.status !== 200) {
      throw new Error(
        `Failed to get f data because ${(await response.json()).reason}`
      );
    }
    const json = await response.json();
    if (
      typeof json.f !== "string" ||
      typeof json.timestamp !== "number" ||
      typeof json.request_id !== "string"
    ) {
      throw new Error("Invalid f data");
    }
    return json as FData;
  }

  /** f API(NSO)のリザルト */
  fDataNSO: null | FData = null;

  /**
   * @param accessToken アクセストークン
   * @return f API(NSO)のリザルト
   */
  async getFDataNSO(accessToken: string) {
    if (this.fDataNSO === null) {
      this.fDataNSO = await this.getFData(accessToken, 1);
    }
    return this.fDataNSO;
  }

  /** 登録トークン */
  registrationToken: null | string = null;

  /**
   * @param idToken IDトークン
   * @param fDataNSO f APIのリザルト(NSO)
   * @param nsoAppVersion NSOアプリバージョン
   */
  async pullRegistrationToken(
    idToken: string,
    fDataNSO: FData,
    nsoAppVersion: string
  ) {
    const url = "https://api-lp1.znc.srv.nintendo.net/v3/Account/Login";
    const params = {
      parameter: {
        naCountry: "JP",
        naBirthday: "2000-01-01",
        language: "ja-JP",
        f: fDataNSO.f,
        timestamp: fDataNSO.timestamp,
        requestId: fDataNSO.request_id,
        naIdToken: idToken,
      },
    };
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        "Content-Type": "application/json",
        "x-productversion": nsoAppVersion,
        "x-Platform": "iOS",
      },
    });
    if (response.status !== 200) {
      throw new Error("Failed to get registration token");
    }
    const json = await response.json();
    const registrationToken = json.result.webApiServerCredential.accessToken;
    if (typeof registrationToken !== "string") {
      throw new Error("Cannot find webApiServerCredential in response");
    }
    this.registrationToken = registrationToken;
  }

  /**
   * @param idToken IDトークン
   * @param fDataNSO f APIのリザルト(NSO)
   * @param nsoAppVersion NSOアプリバージョン
   * @return 登録トークン
   */
  async getRegistrationToken(
    idToken: string,
    fDataNSO: FData,
    nsoAppVersion: string
  ) {
    if (this.registrationToken === null) {
      await this.pullRegistrationToken(idToken, fDataNSO, nsoAppVersion);
    }
    return this.registrationToken as string;
  }

  /** f API(App)のリザルト */
  fDataApp: null | FData = null;

  /**
   * @param registrationToken 登録トークン
   * @return f API(App)のリザルト
   */
  async getFDataApp(registrationToken: string) {
    if (this.fDataApp === null) {
      this.fDataApp = await this.getFData(registrationToken, 2);
    }
    return this.fDataApp;
  }

  /** ウェブサービストークン */
  webServiceToken: null | string = null;

  /**
   * @param registrationToken 登録トークン
   * @param fDataApp f APIのリザルト(App)
   * @param nsoAppVersion NSOアプリバージョン
   */
  async pullWebServiceToken(
    registrationToken: string,
    fDataApp: FData,
    nsoAppVersion: string
  ) {
    const url =
      "https://api-lp1.znc.srv.nintendo.net/v2/Game/GetWebServiceToken";
    const params = {
      parameter: {
        f: fDataApp.f,
        timestamp: fDataApp.timestamp,
        requestId: fDataApp.request_id,
        registrationToken: registrationToken,
        id: 4834290508791808,
      },
    };
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${registrationToken}`,
        "x-productversion": nsoAppVersion,
        "x-Platform": "iOS",
      },
    });
    if (response.status !== 200) {
      throw new Error("Failed to get web service token");
    }
    const json = await response.json();
    const webServiceToken = json.result.accessToken;
    if (typeof webServiceToken !== "string") {
      throw new Error("Cannot find webServiceToken in response");
    }
    this.webServiceToken = webServiceToken;
  }

  /**
   * @param registrationToken 登録トークン
   * @param fDataApp f APIのリザルト(App)
   * @param nsoAppVersion NSOアプリバージョン
   * @return ウェブサービストークン
   */
  async getWebServiceToken(
    registrationToken: string,
    fDataApp: FData,
    nsoAppVersion: string
  ) {
    if (this.webServiceToken === null) {
      await this.pullWebServiceToken(
        registrationToken,
        fDataApp,
        nsoAppVersion
      );
    }
    return this.webServiceToken as string;
  }

  /** バレットトークン */
  bulletToken: null | string = null;

  /**
   * @param webServiceToken ウェブサービストークン
   */
  async pullBulletToken(webServiceToken: string) {
    const url = "https://api.lp1.av5ja.srv.nintendo.net/api/bullet_tokens";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "x-web-view-ver": "1.0.0-5644e7a2",
        Cookie: `_gtoken=${webServiceToken}`,
      },
    });
    if (response.status !== 201) {
      throw new Error("Failed to get bullet token");
    }
    const json = await response.json();
    const bulletToken = json.bulletToken;
    if (typeof bulletToken !== "string") {
      throw new Error("Cannot find bulletToken in response");
    }
    this.bulletToken = bulletToken;
  }

  /**
   * @param webServiceToken ウェブサービストークン
   * @return バレットトークン
   */
  async getBulletToken(webServiceToken: string) {
    if (this.bulletToken === null) {
      await this.pullBulletToken(webServiceToken);
    }
    return this.bulletToken as string;
  }

  /**
   * @param sessionToken セッショントークン
   * @return 認証情報
   */
  async getCredentials(sessionToken: string) {}
}

const nsoLogin = new NSOLogin();

(async () => {
  const loginURL = await nsoLogin.getLoginURL();
  console.log(loginURL);
  const approvalLink =
    "npf71b963c1b7b6d119://auth#session_state=da0d403b20ed1128cba9c3da46386e049587bccbad582199ca225b8b692e59b9&session_token_code=eyJhbGciOiJIUzI1NiJ9.eyJzdGM6YyI6InRZTFBPNVB4cEstRFRjQUhKWHVnRDd6dHZBWlFsbzBEUVFwM2F1NXp0dU0iLCJqdGkiOiI2Mzc1NzI5NzcxOCIsInR5cCI6InNlc3Npb25fdG9rZW5fY29kZSIsInN0YzpzY3AiOlswLDgsOSwxNywyM10sInN0YzptIjoiUzI1NiIsImV4cCI6MTY2NjgwODkzNiwiaWF0IjoxNjY2ODA4MzM2LCJzdWIiOiI0OTdjYmUyZmRiN2IwNzliIiwiYXVkIjoiNzFiOTYzYzFiN2I2ZDExOSIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMubmludGVuZG8uY29tIn0.OxXFds1woLO0dOhlhMR6BpfWdCXKGkJS9UIREs6j6Ek&state=V6DSwHXbqC4rspCn_ArvfkpG1WFSvtNYrhugtfqOHsF6SYyX";
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
