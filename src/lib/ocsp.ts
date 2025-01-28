import { AxiosResponse } from "axios";
import ocsp from "ocsp";

// Credits to @0xCamax for the following code

/*
Since pkijs doesn't include the CertStatus structure, we need to handle it ourselves. Fortunately, it's only a few bytes that we need to analyze.

https://datatracker.ietf.org/doc/html/rfc6960#section-4.2.2.3

CertStatus ::= CHOICE {
    good                [0]     IMPLICIT NULL,
    revoked             [1]     IMPLICIT RevokedInfo,
    unknown             [2]     IMPLICIT UnknownInfo }
*/

export type CertStatus = {
  status: string;
  revokedInfo: RevokedInfo;
};

/*
RevokedInfo ::= SEQUENCE {
    revocationTime              GeneralizedTime,
    revocationReason    [0]     EXPLICIT CRLReason OPTIONAL }
*/

type RevokedInfo = {
  revocationReason: number;
  revocationTime: Date;
};

/*
https://datatracker.ietf.org/doc/html/rfc5280#section-5.3.1

CRLReason ::= ENUMERATED {
    unspecified             (0),
    keyCompromise           (1),
    cACompromise            (2),
    affiliationChanged      (3),
    superseded              (4),
    cessationOfOperation    (5),
    certificateHold         (6),
        -- value 7 is not used
    removeFromCRL           (8),
    privilegeWithdrawn      (9),
    aACompromise           (10) }
*/

const CRLReason = {
  0: "unspecified",
  1: "keyCompromise",
  2: "cACompromise",
  3: "affiliationChanged",
  4: "superseded",
  5: "cessationOfOperation",
  6: "certificateHold",
  /* value 7 is not used */
  8: "removeFromCRL",
  9: "privilegeWithdrawn",
  10: "aACompromise",
};

type CustomRevokedInfo = Omit<RevokedInfo, "revocationReason"> & {
  revocationReason: string;
};
type CustomCertStatus = Omit<CertStatus, "revokedInfo"> & {
  revokedInfo: CustomRevokedInfo;
};

export function simpleCertStatusDecode(rawData: Uint8Array): CustomCertStatus {
  const revokedInfo = {} as CustomRevokedInfo;
  const certStatus = {} as CustomCertStatus;

  /*
	RFC 6960 defines CertStatus in OCSP and establishes that the status values 
	good, revoked, and unknown are encoded as [0], [1], and [2], respectively. 
	This means that in DER or BER, the first byte after the length tag (TLV) 
	will be 0x80 (good), 0xA1 (revoked), or 0x82 (unknown).
	*/
  for (let offset = 0; offset < rawData.length; offset++) {
    switch (rawData[offset]) {
      // 0x80 represents "good"
      case 128:
        certStatus.status = "good";
        break;

      // 0xA1 represents "revoked"
      case 161:
        certStatus.status = "revoked";
        break;

      // 0x82 represents "unknown"
      case 130:
        certStatus.status = "unknown";
        break;

      // 0x18 represents GeneralizedTime in ASN.1
      case 24:
        const { genTime, newOffset } = generalizedTime(rawData, offset++);
        revokedInfo.revocationTime = genTime;
        offset = newOffset;
        break;

      // 0xA0 represents Enum, in this context indicates 'revocationReason'
      case 160:
        // the response is at the last position
        offset = rawData.length - 1;
        revokedInfo.revocationReason =
          CRLReason[rawData[rawData.length - 1] as keyof typeof CRLReason];
      default:
        break;
    }
  }

  if (certStatus.status == "revoked") certStatus.revokedInfo = revokedInfo;

  return certStatus;
}

function generalizedTime(
  bytes: Uint8Array,
  offset: number
): { genTime: Date; newOffset: number } {
  let timeString = "";
  for (offset; offset < bytes.length; offset++) {
    if (bytes[offset] >= 48 && bytes[offset] <= 57) {
      // ASCII 0-9
      timeString += String.fromCharCode(bytes[offset]);
    } else if (bytes[offset] === 90) {
      // ASCII 'Z'
      timeString += "Z";
      break;
    }
  }

  return { genTime: parseDate(timeString), newOffset: offset };
}

function parseDate(generalizedTime: string): Date {
  const year = parseInt(generalizedTime.substring(0, 4), 10);
  const month = parseInt(generalizedTime.substring(4, 6), 10) - 1; // ASN.1 [1-12] - 1 ==  Date [0-11]
  const day = parseInt(generalizedTime.substring(6, 8), 10);
  const hour = parseInt(generalizedTime.substring(8, 10), 10);
  const minute = parseInt(generalizedTime.substring(10, 12), 10);
  const second = parseInt(generalizedTime.substring(12, 14), 10);

  const date = new Date(Date.UTC(year, month, day, hour, minute, second));

  return date;
}

const verify = (request: any, response: AxiosResponse<ArrayBuffer, any>) =>
  new Promise((resolve, reject) =>
    ocsp.verify(
      {
        request,
        response: response.data,
      },
      (err: any) => {
        if (err) reject(err);
        else resolve(null);
      }
    )
  );

export { verify };
