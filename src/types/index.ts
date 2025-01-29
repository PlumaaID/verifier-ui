type Hex = `0x${string}`; // viem
type Base64 = string; // node-forge

export type Proof = SignatureRequestProof | SignatureProof;

export enum HashingAlgorithm {
  SHA256,
}

interface Conservation {
  nom151?: NOM151Conservation;
  merkleized?: MerkleizedConservation;
  witnessCo?: WitnessCoConservation;
}

export interface SignatureRequestProof {
  name: string;
  mediatype: string;
  raw: Base64;
  algorithm: HashingAlgorithm;
  hash: Hex;
  conservation: Conservation;
  signatures: SignatureProof[];
}

export interface NOM151Conservation {
  provider: string;
}

export interface MerkleizedConservation {
  merkleRoot: Hex;
  merkleProof: Hex[];
  conservation: NOM151Conservation;
  algorithm: string;
}

export interface WitnessCoConservation {
  timestamp: string;
  leafIndex: number;
  leftHashes: Hex[];
  rightHashes: Hex[];
  targetRootHash: Hex;
}

export interface SignatureProof {
  signature: Base64;
  ocspResponse: Base64;
  certificate: Base64;
  conservation: Conservation;
  signatureHash: Hex;
  hash: Hex;
}

export const isSignatureRequestProof = (
  proof: Proof
): proof is SignatureRequestProof => !isSignatureProof(proof);

export const isSignatureProof = (proof: Proof): proof is SignatureProof =>
  "signature" in proof;
