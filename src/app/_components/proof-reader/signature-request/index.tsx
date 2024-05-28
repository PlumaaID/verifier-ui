import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { SignatureRequestProof } from "~/types";
import Signature from "../signature";
import { Button } from "~/components/ui/button";
import { DownloadIcon } from "lucide-react";
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
import { util } from "node-forge";
import Gradient from "~/components/gradient";

interface Props {
  proof: SignatureRequestProof;
}

const SignatureRequest: FC<Props> = ({ proof }) => {
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
          <CardContent className="flex grow items-center justify-between py-3">
            <p className="text-lg font-semibold tracking-tight my-auto">
              Documento
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
              Digestivo ({proof.algorithm})
            </p>
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
              {proof.hash}
            </code>
          </CardContent>
          <Separator />
          <p className="text-md font-semibold tracking-tight mt-6">
            ¿Cómo se garantiza su conservación?
          </p>
          <Separator />
          {proof.conservation.nom151 && (
            <>
              <CardContent className="flex grow items-center justify-between py-3">
                <p className="text-lg font-semibold tracking-tight my-auto">
                  PSC {proof.conservation?.nom151?.provider}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!proof.hash || !proof.conservation.nom151) return;
                    const nom151 = await getNOM151CertificateAsn1(
                      proof.hash,
                      proof.conservation.nom151.provider
                    );

                    downloadFile(
                      util.encode64(util.createBuffer(nom151, "raw").bytes()),
                      proof.mediatype,
                      `${proof.hash}.asn1`
                    );
                  }}
                >
                  NOM151
                  <DownloadIcon className="ml-2" size="12" />
                </Button>
              </CardContent>
              <Separator />
            </>
          )}
          {proof.conservation.merkleized && (
            <>
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
            </>
          )}
          <p className="text-md font-semibold tracking-tight mt-6">
            ¿Cómo se garantiza su conservación?
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
