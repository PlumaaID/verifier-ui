import { FC, useMemo } from "react";
import { isSignatureProof, isSignatureRequestProof, Proof } from "~/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { downloadFile } from "~/lib/files";
import { md, util } from "node-forge";
import {
  Check,
  DownloadIcon,
  ExternalLink,
  InfoIcon,
  ScanEye,
  X,
} from "lucide-react";
import { Separator } from "../ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import Link from "next/link";
import Gradient from "../gradient";
import { Badge } from "../ui/badge";
import SecuredByWitness from "../secured-by-witness";
import { with0x, without0x } from "~/lib/utils";
import { SimpleMerkleTree } from "@openzeppelin/merkle-tree";
import { compare, concat } from "@openzeppelin/merkle-tree/dist/bytes";
import { formatLeaf } from "@openzeppelin/merkle-tree/dist/simple";

type Props = {
  proof: Proof;
  NOM151CertificateASN1?: string;
};

const sha256 = (data: any) => {
  return with0x(
    md.sha256.create().update(without0x(data), "raw").digest().toHex()
  );
};

function NOM151NodeHash(a: any, b: any) {
  return sha256(
    util.createBuffer(Buffer.from(concat([a, b].sort(compare)))).toHex()
  );
}

export function NOM151LeafHash(value: any) {
  return sha256(formatLeaf(with0x(value)));
}

const Conservation: FC<Props> = ({ proof, NOM151CertificateASN1 }) => {
  const hash = useMemo(
    () =>
      isSignatureRequestProof(proof)
        ? proof.hash
        : isSignatureProof(proof)
        ? proof.signatureHash
        : "",
    [proof]
  );

  const ASN1VerifierURL = useMemo(() => {
    if (!NOM151CertificateASN1) return;
    return `https://lapo.it/asn1js/#${encodeURIComponent(
      util.encode64(util.createBuffer(NOM151CertificateASN1, "raw").bytes())
    )}`;
  }, [NOM151CertificateASN1]);

  const isMerkleizedValid = useMemo(() => {
    if (!proof.conservation.merkleized) return false;

    const leaf = NOM151LeafHash(without0x(hash));
    const merkleProof = proof.conservation.merkleized.merkleProof.map(with0x);

    const valid = SimpleMerkleTree.verify(
      with0x(proof.conservation.merkleized.merkleRoot),
      leaf,
      merkleProof,
      NOM151NodeHash
    );

    return valid;
  }, [proof.conservation.merkleized, hash]);

  return (
    <>
      {proof.conservation.nom151 && (
        <Card>
          <CardHeader>
            <CardTitle>Certificado de conservación NOM-151</CardTitle>
            <CardDescription>
              El digestivo del documento ha sido certificado por un Proveedor de
              Servicios de Certificación (PSC) de acuerdo a la NOM-151.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex grow items-center justify-between py-3">
            <p className="text-lg font-semibold tracking-tight my-auto">
              PSC {proof.conservation?.nom151?.provider}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!NOM151CertificateASN1) return;

                downloadFile(
                  util.encode64(
                    util.createBuffer(NOM151CertificateASN1, "raw").bytes()
                  ),
                  "text/plain",
                  `${name}.asn1`
                );
              }}
            >
              NOM151
              <DownloadIcon className="ml-2" size="12" />
            </Button>
          </CardContent>
          <Separator />
          <CardContent className="flex grow items-center justify-between py-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center">
                  <p className="font-semibold tracking-tight my-auto">
                    Decodificar certificado NOM-151 (ASN.1)
                  </p>
                  <InfoIcon className="ml-2 w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    El verificador independiente muestra los campos detallados
                    del certificado de conservación. Estos incluyen la firma
                    electrónica del PSC
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {ASN1VerifierURL && (
              <Link
                href={ASN1VerifierURL}
                rel="noopener noreferrer"
                target="_blank"
              >
                <Button variant="outline" size="sm">
                  Verificador independiente
                  <ExternalLink className="ml-2" size="12" />
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
      {proof.conservation.merkleized && (
        <Card>
          <CardHeader>
            <CardTitle>Certificado de conservación NOM-151 agrupado</CardTitle>
            <CardDescription>
              El digestivo del documento se ha agrupado con otros documentos y
              se ha generado un{" "}
              <Link
                className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                href="https://es.wikipedia.org/wiki/%C3%81rbol_de_Merkle"
                rel="noopener noreferrer"
                target="_blank"
              >
                árbol de Merkle.
              </Link>{" "}
              La raíz del árbol ha sido certificada por un PSC de acuerdo a la
              NOM-151 y se puede utilizar la prueba de Merkle para verificar la
              integridad del documento.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex grow items-center justify-between py-3">
            <p className="m-0 font-bold">Raíz de Merkle</p>
            <div className="grid grid-cols-4 grid-flow-row gap-4 justify-right">
              <Gradient
                className="w-5 h-5 rounded-full"
                hash={proof.conservation.merkleized.merkleRoot}
              />
            </div>
          </CardContent>
          <Separator />
          <CardContent className="flex grow items-center justify-between py-3">
            <p className="m-0 font-bold">Prueba de Merkle</p>
            <div className="grid grid-cols-4 grid-flow-row gap-4 justify-right">
              {proof.conservation.merkleized.merkleProof?.map((node) => (
                <Gradient
                  key={node}
                  className="w-5 h-5 rounded-full"
                  hash={node}
                />
              ))}
            </div>
          </CardContent>
          <Separator />
          <CardContent className="flex grow items-center justify-between py-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center">
                  <p className="font-semibold tracking-tight my-auto">
                    Verificación de Merkle
                  </p>
                  <InfoIcon className="ml-2 w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    El cálculo de la raíz de Merkle usando el documento y la
                    prueba de Merkle coincide con la raíz de Merkle en la
                    prueba.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isMerkleizedValid ? (
              <Check className="h-7 w-7 text-green-500" />
            ) : (
              <X className="h-7 w-7 text-red-500" />
            )}
          </CardContent>
        </Card>
      )}
      {proof.conservation.witnessCo && (
        <Card>
          <CardHeader>
            <CardTitle>Certificado de conservación WitnessCo</CardTitle>
            <CardDescription>
              El digestivo ha sido observado por un testigo descentralizado.{" "}
              <Link
                className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                href="https://docs.plumaa.id/advanced/technical/information-system/witness"
                rel="noopener noreferrer"
                target="_blank"
              >
                Aprende más.
              </Link>{" "}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex grow items-center justify-between py-3">
            <p className="m-0 font-bold">Índice</p>
            {proof.conservation.witnessCo.leafIndex && (
              <Badge variant="outline">
                {proof.conservation.witnessCo.leafIndex}
              </Badge>
            )}
          </CardContent>
          <Separator />
          <CardContent className="flex grow items-center justify-between py-3">
            <p className="m-0 font-bold">Digestivos izquierdos</p>
            <div className="grid grid-cols-6 grid-flow-row gap-4 justify-right">
              {proof.conservation.witnessCo?.leftHashes?.map((node) => (
                <Gradient
                  key={node}
                  className="w-5 h-5 rounded-full"
                  hash={node}
                />
              ))}
            </div>
          </CardContent>
          <Separator />
          <CardContent className="flex grow items-center justify-between py-3">
            <p className="m-0 font-bold">Digestivos derechos</p>
            <div className="grid grid-cols-6 grid-flow-row gap-4 justify-right">
              {proof.conservation.witnessCo?.rightHashes?.map((node) => (
                <Gradient
                  key={node}
                  className="w-5 h-5 rounded-full"
                  hash={node}
                />
              ))}
            </div>
          </CardContent>
          <Separator />
          <CardContent className="flex grow items-center justify-between py-3">
            <p className="m-0 font-bold">Digestivo raíz</p>
            {proof.conservation.witnessCo?.targetRootHash && (
              <Gradient
                className="w-5 h-5 rounded-full"
                hash={proof.conservation.witnessCo?.targetRootHash}
              />
            )}
          </CardContent>
          <Separator />
          <CardContent className="flex grow items-center justify-between py-3">
            <p className="m-0 font-bold">Prueba</p>
            <Button variant="secondary" size="sm" asChild>
              <Link
                href={`https://scan.witness.co/leaf/${with0x(hash)}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                Ver <ScanEye className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
          <Separator />
          <CardContent className="flex grow items-center justify-between py-5">
            <p className="m-0 font-bold">Proveedor</p>
            <SecuredByWitness />
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default Conservation;
