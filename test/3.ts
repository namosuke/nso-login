import NSOLogin from "../src";

const nsoLogin = new NSOLogin();

(async () => {
  nsoLogin.approvalLink = process.env.APPROVAL_LINK as string;
  const bulletToken = await nsoLogin.getBulletToken();
  console.log(bulletToken);
})();