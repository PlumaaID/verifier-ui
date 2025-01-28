import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { SignatureRequestProof } from "~/types";
import Signature from "../signature";
import { Button } from "~/components/ui/button";
import { Check, DownloadIcon, Info, InfoIcon, X } from "lucide-react";
import { Separator } from "~/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { downloadFile, mediatypeToExtension } from "~/lib/files";
import { getNOM151CertificateAsn1 } from "~/lib/nom151";
import { md, util } from "node-forge";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import Link from "next/link";
import { without0x } from "~/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import Conservation from "~/components/conservation";

interface Props {
  proof: SignatureRequestProof;
}

const SignatureRequest: FC<Props> = ({ proof }) => {
  const [NOM151CertificateASN1, setNOM151CertificateASN1] = useState<string>();
  const isValidHash = useMemo(() => {
    const calculatedHash = md.sha256
      .create()
      .update(util.decode64(proof.raw))
      .digest()
      .toHex();
    return (
      without0x(calculatedHash.toLowerCase()) ===
      without0x(proof.hash.toLowerCase())
    );
  }, [proof.hash, proof.raw]);

  const NOM151CertificateCallback = useCallback(async () => {
    if (!proof.hash || !proof.conservation.nom151) return;
    const nom151 = await getNOM151CertificateAsn1(
      proof.hash,
      proof.conservation.nom151.provider
    );
    setNOM151CertificateASN1(nom151);
  }, [proof.hash, proof.conservation.nom151]);

  useEffect(() => {
    NOM151CertificateCallback();
  }, [NOM151CertificateCallback]);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Pericial de {proof.name}</CardTitle>
        <CardDescription>
          Esta verificación es equivalente a una prueba pericial para determinar
          la conservación de un documento electrónico.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 flex-col">
          <p className="text-md font-semibold tracking-tight">
            Sobre el documento
          </p>
          <p className="text-sm text-muted-foreground">
            Este documento ha sido firmado criptográficamente. Para asegurar la
            integridad del documento, el firmante realiza una operación sobre su
            digestivo utilizando el algoritmo
            {proof.algorithm}. Aplicar el algoritmo {proof.algorithm} al
            documento original debe resultar en el mismo digestivo que el
            firmante ha generado.
          </p>
          <CardContent className="flex justify-between items-center py-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center">
                  <p className="text-lg font-semibold tracking-tight my-auto">
                    Integridad verificada
                  </p>
                  <InfoIcon className="ml-2 w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">
                    El cálculo del digestivo del documento coincide con el
                    digestivo en la prueba.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isValidHash ? (
              <Check className="h-7 w-7 text-green-500" />
            ) : (
              <X className="h-7 w-7 text-red-500" />
            )}
          </CardContent>
          <Separator />
          <CardContent className="flex grow items-center justify-between py-3">
            <p className="text-lg font-semibold tracking-tight my-auto">
              Documento original
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadFile(
                  proof.raw,
                  proof.mediatype,
                  `${proof.name}.${mediatypeToExtension(proof.mediatype)}`
                );
              }}
            >
              Descargar
              <DownloadIcon className="ml-2" size="12" />
            </Button>
          </CardContent>
          <Separator />
          <CardContent className="flex grow items-center justify-between py-3">
            <p className="text-lg font-semibold tracking-tight">
              Digestivo del documento original ({proof.algorithm})
            </p>
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
              {proof.hash}
            </code>
          </CardContent>
          <Separator />
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>
              Verifica el digestivo de forma independiente
            </AlertTitle>
            <AlertDescription>
              Puedes verificar el digestivo del documento original con una{" "}
              <Link
                className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                href="https://emn178.github.io/online-tools/sha256_checksum.html"
                rel="noopener noreferrer"
                target="_blank"
              >
                herramienta independiente.
              </Link>
            </AlertDescription>
          </Alert>
          <p className="text-md font-semibold tracking-tight mt-6">
            ¿Cómo se garantiza su conservación?
          </p>
          <p className="text-sm text-muted-foreground">
            El documento ha sido expuesto a{" "}
            {Object.keys(proof.conservation).length} métodos de conservación.
            Estos métodos garantizan que el documento no ha sido alterado desde
            su creación y añaden fecha cierta a su existencia.
          </p>
          <Separator />
          <Conservation
            proof={proof}
            NOM151CertificateASN1={NOM151CertificateASN1}
          />
          <p className="text-md font-semibold tracking-tight mt-6">
            ¿Quién ha firmado este documento?
          </p>
          {proof.signatures.map((signature) => (
            <Signature key={signature.signature} proof={signature} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SignatureRequest;
