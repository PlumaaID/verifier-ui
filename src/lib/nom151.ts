import { env } from "~/config/environment";
import cincelClient from "./pscs/cincel";
import { without0x } from "./utils";

enum Nom151Provider {
  /** https://docs.cincel.digital/v3/basic-certificates#get-/timestamps/-hash- */
  Cincel = "CINCEL",
}

const getNOM151CertificateAsn1 = async (hash: string, provider: string) => {
  switch (provider) {
    case Nom151Provider.Cincel:
      const response = await cincelClient.timestamps(
        env.development
          ? // From https://docs.cincel.digital/v3/basic-certificates#get-/timestamps/-hash-.asn1
            "2c5d36be542f8f0e7345d77753a5d7ea61a443ba6a9a86bb060332ad56dba38e"
          : without0x(hash)
      );
      return response.data;
    default:
      throw new Error(`Provider ${provider} not supported`);
  }
};

export { getNOM151CertificateAsn1 };
