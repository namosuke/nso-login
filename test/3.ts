import NSOLogin from "../src";

const nsoLogin = new NSOLogin();

(async () => {
  nsoLogin.nasid = process.env.NASID as string;
  const bulletToken = await nsoLogin.getBulletToken();
  console.log(bulletToken);
})();
