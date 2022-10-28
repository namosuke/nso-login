import packageJson from "../package.json";
import base64url from "base64url";
import * as crypto from "crypto";
import { plainToClass } from "class-transformer";
import { notStrictEqual } from "assert";

export type NSOLoginOptions = {
  verifier: string;
  state: string;
  challenge: string;
};
export type FData = { f: string; timestamp: number; request_id: string };
export type OAuth = {
  verifier: string;
  state: string;
  loginURL: string;
};
type Headers = Record<string, string>;
type Parameters = Record<string, string | number>;
type Request = {
  headers?: Headers | undefined;
  parameters?: Parameters | undefined;
};

class NSOError {
  error_description: string;
  error: string;
}

class SessionToken {
  private readonly code: string;
  private readonly session_token: string;
}

class AccessToken {
  private readonly id_token: string;
  private readonly access_token: string;
  private readonly expires_in: number;
  private readonly token_type: string;
}

class NSOLogin {
  constructor() {}

  private readonly baseURL: string =
    "https://accounts.nintendo.com/connect/1.0.0/authorize";
  private readonly clientId: string = "71b963c1b7b6d119";

  getLoginURLWithParams(
    state: string,
    challenge: string,
    verifier: string
  ): OAuth {
    const parameters = new URLSearchParams({
      state: state,
      redirect_uri: "npf71b963c1b7b6d119://auth",
      client_id: this.clientId,
      scope: "openid user user.birthday user.mii user.screenName",
      response_type: "session_token_code",
      session_token_code_challenge: challenge,
      session_token_code_challenge_method: "S256",
      theme: "login_form",
    });
    return {
      state: state,
      verifier: verifier,
      loginURL: `${this.baseURL}?${parameters}}`,
    };
  }

  /**
   * @return ニンテンドーアカウント選択画面のURL
   * 実行するごとにランダムなURLを生成すべき
   */
  getLoginURL(): OAuth {
    const state = base64url(crypto.randomBytes(36));
    const sessionTokenCodeVerifier = base64url(crypto.randomBytes(32));
    const sessionTokenCodeChallenge: string = base64url(
      crypto.createHash("sha256").update(sessionTokenCodeVerifier).digest()
    );
    const parameters = new URLSearchParams({
      state: state,
      redirect_uri: "npf71b963c1b7b6d119://auth",
      client_id: this.clientId,
      scope: "openid user user.birthday user.mii user.screenName",
      response_type: "session_token_code",
      session_token_code_challenge: sessionTokenCodeChallenge,
      session_token_code_challenge_method: "S256",
      theme: "login_form",
    });
    return {
      state: state,
      verifier: sessionTokenCodeVerifier,
      loginURL: `${this.baseURL}?${parameters}}`,
    };
  }

  /**
   * @return Response
   * POSTリクエストを送ってレスポンスかエラーを返す
   */
  private async request(url: string, params: Request): Promise<Response> {
    const response: Response = await fetch(url, {
      method: "POST",
      headers: params.headers,
      body: JSON.stringify(params.parameters),
    });

    switch (response.status) {
      case 200:
        return response;
      default:
        const error: NSOError = plainToClass(NSOError, response.json());
        throw new Error(`${response.status}: ${error.error_description}`);
    }
  }

  async getSessionToken(
    urlScheme: string,
    verifier: string
  ): Promise<SessionToken> {
    const regexp = new RegExp("session_token_code=(.*)&");
    if (!regexp.test(urlScheme)) {
      throw new Error("Invalid URL Scheme.");
    }

    const results = regexp.exec(urlScheme);
    if (results == null) {
      throw new Error("Invalid URL Scheme.");
    }

    const sessionTokenCode = results[1];
    const url = "https://accounts.nintendo.com/connect/1.0.0/api/session_token";
    const parameters = new URLSearchParams({
      client_id: this.clientId,
      session_token_code: sessionTokenCode,
      session_token_code_verifier: verifier,
    }).toString();
    const response = await fetch(url, {
      method: "POST",
      body: parameters,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    switch (response.status) {
      case 200:
        return plainToClass(SessionToken, response.json());
      default:
        const error: NSOError = plainToClass(NSOError, await response.json());
        throw new Error(`${response.status}: ${error.error_description}`);
    }
  }

  async getAccessToken(sessionToken: string): Promise<AccessToken> {
    const url = "https://accounts.nintendo.com/connect/1.0.0/api/token";
    const parameters = {
      client_id: this.clientId,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer-session-token",
      session_token: sessionToken,
    };

    const response = await this.request(url, { parameters: parameters });
    return plainToClass(AccessToken, response);
  }

  // /**
  //  * @param approvalLink 「この人にする」のアドレス
  //  * @return セッショントークン
  //  */
  // async getSessionToken(approvalLink?: string) {
  //   if (this.sessionToken === null) {
  //     if (approvalLink === undefined && this.approvalLink === null) {
  //       throw new Error("Must specify approvalLink");
  //     }
  //     await this.pullSessionToken(
  //       approvalLink ?? (this.approvalLink as string)
  //     );
  //   }
  //   return this.sessionToken as string;
  // }

  // /** NSOアプリバージョン */
  // nsoAppVersion: null | string = null;

  // // 常に最新のバージョンを返すわけではないっぽい
  // // https://apps.apple.com/app/id1234806557からスクレイピングするほうが確実
  // // とはいえAPIがAndroid版なので本来はPlayStoreをスクレイピングするほうが正しいのかも
  // async pullNSOAppVersion() {
  //   const url = "https://itunes.apple.com/lookup?id=1234806557";
  //   const response = await fetch(url);
  //   const json = await response.json();
  //   const nsoAppVersion = json.results[0].version;
  //   if (typeof nsoAppVersion !== "string") {
  //     throw new Error("AppStore API returned invalid data");
  //   }
  //   this.nsoAppVersion = nsoAppVersion;
  // }

  // /**
  //  * @return NSOアプリバージョン
  //  */
  // async getNSOAppVersion() {
  //   if (this.nsoAppVersion === null) {
  //     await this.pullNSOAppVersion();
  //   }
  //   return this.nsoAppVersion as string;
  // }

  // /** アクセストークン */
  // accessToken: null | string = null;

  // /** IDトークン */
  // idToken: null | string = null;

  // /**
  //  * @param sessionToken セッショントークン
  //  */
  // async pullAccessToken(sessionToken: string) {
  //   const url = "https://accounts.nintendo.com/connect/1.0.0/api/token";
  //   const params = {
  //     client_id: this.clientId,
  //     grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer-session-token",
  //     session_token: sessionToken,
  //   };
  //   const response = await fetch(url, {
  //     method: "POST",
  //     body: JSON.stringify(params),
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   });
  //   if (response.status !== 200) {
  //     throw new Error(`Request failed with status ${response.status}`);
  //   }
  //   const json = await response.json();
  //   const accessToken = json.access_token;
  //   if (typeof accessToken !== "string") {
  //     throw new Error("Request succeeded but accessToken is not found");
  //   }
  //   this.accessToken = accessToken;
  //   const idToken = json.id_token;
  //   if (typeof idToken !== "string") {
  //     throw new Error("Request succeeded but idToken is not found");
  //   }
  //   this.idToken = idToken;
  // }

  // /**
  //  * @param sessionToken セッショントークン
  //  * @return アクセストークン
  //  */
  // async getAccessToken(sessionToken?: string) {
  //   if (this.accessToken === null) {
  //     await this.pullAccessToken(await this.getSessionToken("", ""));
  //   }
  //   return this.accessToken as string;
  // }

  // /**
  //  * @param sessionToken セッショントークン
  //  * @return IDトークン
  //  */
  // async getIDToken(sessionToken?: string) {
  //   if (this.idToken === null) {
  //     await this.pullAccessToken(
  //       sessionToken ?? this.sessionToken ?? (await this.getSessionToken())
  //     );
  //   }
  //   return this.idToken as string;
  // }

  // /**
  //  * @param accessToken アクセストークン
  //  * @param hashMethod NSO is 1, APP is 2
  //  * @return f APIのリザルト
  //  */
  // async getFData(accessToken: string, hashMethod: 1 | 2) {
  //   const url = "https://api.imink.app/f";
  //   const params = {
  //     hash_method: hashMethod,
  //     token: accessToken,
  //   };
  //   const headers = {
  //     "User-Agent": `${process.env.npm_package_name ?? packageJson.name}/${
  //       process.env.npm_package_version ?? packageJson.version
  //     }`,
  //     "Content-Type": "application/json",
  //   };
  //   const response = await fetch(url, {
  //     method: "POST",
  //     body: JSON.stringify(params),
  //     headers: headers,
  //   });
  //   if (response.status !== 200) {
  //     throw new Error(
  //       `Request Failed with status ${response.status}: ${
  //         (await response.json()).reason
  //       }`
  //     );
  //   }
  //   const json = await response.json();
  //   if (
  //     typeof json.f !== "string" ||
  //     typeof json.timestamp !== "number" ||
  //     typeof json.request_id !== "string"
  //   ) {
  //     throw new Error("fData invalid");
  //   }
  //   return json as FData;
  // }

  // /** f API(NSO)のリザルト */
  // fDataNSO: null | FData = null;

  // /**
  //  * @param accessToken アクセストークン
  //  * @return f API(NSO)のリザルト
  //  */
  // async getFDataNSO(accessToken?: string) {
  //   if (this.fDataNSO === null) {
  //     this.fDataNSO = await this.getFData(
  //       accessToken ?? this.accessToken ?? (await this.getAccessToken()),
  //       1
  //     );
  //   }
  //   return this.fDataNSO;
  // }

  // /** 登録トークン */
  // registrationToken: null | string = null;

  // /**
  //  * @param accessToken アクセストークン
  //  * @param fDataNSO f APIのリザルト(NSO)
  //  * @param nsoAppVersion NSOアプリバージョン
  //  */
  // async pullRegistrationToken(
  //   accessToken: string,
  //   fDataNSO: FData,
  //   nsoAppVersion: string
  // ) {
  //   const url = "https://api-lp1.znc.srv.nintendo.net/v3/Account/Login";
  //   const params = {
  //     parameter: {
  //       naCountry: "JP",
  //       naBirthday: "2000-01-01",
  //       language: "ja-JP",
  //       f: fDataNSO.f,
  //       timestamp: fDataNSO.timestamp,
  //       requestId: fDataNSO.request_id,
  //       naIdToken: accessToken,
  //     },
  //   };
  //   const response = await fetch(url, {
  //     method: "POST",
  //     body: JSON.stringify(params),
  //     headers: {
  //       "Content-Type": "application/json",
  //       "x-productversion": nsoAppVersion,
  //       "x-Platform": "iOS",
  //     },
  //   });
  //   if (response.status !== 200) {
  //     throw new Error(`Request failed with status ${response.status}`);
  //   }
  //   const json = await response.json();
  //   const registrationToken = json.result?.webApiServerCredential?.accessToken;
  //   if (typeof registrationToken !== "string") {
  //     throw new Error(
  //       `Request succeeded but registrationToken is not found: ${json.errorMessage}`
  //     );
  //   }
  //   this.registrationToken = registrationToken;
  // }

  // /**
  //  * @param accessToken アクセストークン
  //  * @param fDataNSO f APIのリザルト(NSO)
  //  * @param nsoAppVersion NSOアプリバージョン
  //  * @return 登録トークン
  //  */
  // async getRegistrationToken(
  //   accessToken?: string,
  //   fDataNSO?: FData,
  //   nsoAppVersion?: string
  // ) {
  //   if (this.registrationToken === null) {
  //     await this.pullRegistrationToken(
  //       accessToken ?? this.accessToken ?? (await this.getAccessToken()),
  //       fDataNSO ?? this.fDataNSO ?? (await this.getFDataNSO()),
  //       nsoAppVersion ?? this.nsoAppVersion ?? (await this.getNSOAppVersion())
  //     );
  //   }
  //   return this.registrationToken as string;
  // }

  // /** f API(App)のリザルト */
  // fDataApp: null | FData = null;

  // /**
  //  * @param registrationToken 登録トークン
  //  * @return f API(App)のリザルト
  //  */
  // async getFDataApp(registrationToken?: string) {
  //   if (this.fDataApp === null) {
  //     this.fDataApp = await this.getFData(
  //       registrationToken ??
  //         this.registrationToken ??
  //         (await this.getRegistrationToken()),
  //       2
  //     );
  //   }
  //   return this.fDataApp;
  // }

  // /** ウェブサービストークン */
  // webServiceToken: null | string = null;

  // /**
  //  * @param registrationToken 登録トークン
  //  * @param fDataApp f APIのリザルト(App)
  //  * @param nsoAppVersion NSOアプリバージョン
  //  */
  // async pullWebServiceToken(
  //   registrationToken: string,
  //   fDataApp: FData,
  //   nsoAppVersion: string
  // ) {
  //   const url =
  //     "https://api-lp1.znc.srv.nintendo.net/v2/Game/GetWebServiceToken";
  //   const params = {
  //     parameter: {
  //       f: fDataApp.f,
  //       timestamp: fDataApp.timestamp,
  //       requestId: fDataApp.request_id,
  //       registrationToken: registrationToken,
  //       id: 4834290508791808,
  //     },
  //   };
  //   const response = await fetch(url, {
  //     method: "POST",
  //     body: JSON.stringify(params),
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${registrationToken}`,
  //       "x-productversion": nsoAppVersion,
  //       "x-Platform": "iOS",
  //     },
  //   });
  //   if (response.status !== 200) {
  //     throw new Error("Failed to get web service token");
  //   }
  //   const json = await response.json();
  //   const webServiceToken = json.result.accessToken;
  //   if (typeof webServiceToken !== "string") {
  //     throw new Error("Cannot find webServiceToken in response");
  //   }
  //   this.webServiceToken = webServiceToken;
  // }

  // /**
  //  * @param registrationToken 登録トークン
  //  * @param fDataApp f APIのリザルト(App)
  //  * @param nsoAppVersion NSOアプリバージョン
  //  * @return ウェブサービストークン
  //  */
  // async getWebServiceToken(
  //   registrationToken?: string,
  //   fDataApp?: FData,
  //   nsoAppVersion?: string
  // ) {
  //   if (this.webServiceToken === null) {
  //     await this.pullWebServiceToken(
  //       registrationToken ??
  //         this.registrationToken ??
  //         (await this.getRegistrationToken()),
  //       fDataApp ?? this.fDataApp ?? (await this.getFDataApp()),
  //       nsoAppVersion ?? this.nsoAppVersion ?? (await this.getNSOAppVersion())
  //     );
  //   }
  //   return this.webServiceToken as string;
  // }

  // /** バレットトークン */
  // bulletToken: null | string = null;

  // /**
  //  * @param webServiceToken ウェブサービストークン
  //  */
  // async pullBulletToken(webServiceToken: string) {
  //   const url = "https://api.lp1.av5ja.srv.nintendo.net/api/bullet_tokens";
  //   const response = await fetch(url, {
  //     method: "POST",
  //     headers: {
  //       "x-web-view-ver": "1.0.0-5644e7a2",
  //       Cookie: `_gtoken=${webServiceToken}`,
  //     },
  //   });
  //   if (response.status !== 201) {
  //     throw new Error("Failed to get bullet token");
  //   }
  //   const json = await response.json();
  //   const bulletToken = json.bulletToken;
  //   if (typeof bulletToken !== "string") {
  //     throw new Error("Cannot find bulletToken in response");
  //   }
  //   this.bulletToken = bulletToken;
  // }

  // /**
  //  * @param webServiceToken ウェブサービストークン
  //  * @return バレットトークン
  //  */
  // async getBulletToken(webServiceToken?: string) {
  //   if (this.bulletToken === null) {
  //     await this.pullBulletToken(
  //       webServiceToken ??
  //         this.webServiceToken ??
  //         (await this.getWebServiceToken())
  //     );
  //   }
  //   return this.bulletToken as string;
  // }

  // /**
  //  * @param sessionToken セッショントークン
  //  * @return 認証情報
  //  */
  // async getCredentials(sessionToken: string) {}
}

export default NSOLogin;
