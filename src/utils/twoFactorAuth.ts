import * as node2fa from "node-2fa";

export const generate2FASecret = (email: string) => {
  return node2fa.generateSecret({ name: "Trust Vault", account: email });
};

export const verify2FAToken = (secret: string, token: string) => {
  return node2fa.verifyToken(secret, token);
};
