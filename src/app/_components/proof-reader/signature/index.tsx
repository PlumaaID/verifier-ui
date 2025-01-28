import { Check, DownloadIcon, InfoIcon, X } from "lucide-react";
import { util, pki, md } from "node-forge";
import { BasicOCSPResponse, OCSPResponse, SingleResponse } from "pkijs";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import JsonView from "react18-json-view";
import Conservation from "~/components/conservation";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { downloadFile } from "~/lib/files";
import { getNOM151CertificateAsn1 } from "~/lib/nom151";
import { simpleCertStatusDecode } from "~/lib/ocsp";
import { without0x } from "~/lib/utils";
import { SignatureProof } from "~/types";

interface Props {
  proof: SignatureProof;
}

const Signature: FC<Props> = ({ proof }) => {
  const certificate = useMemo(() => {
    return pki.certificateFromPem(util.decode64(proof.certificate));
  }, [proof.certificate]);

  const [NOM151CertificateASN1, setNOM151CertificateASN1] = useState<string>();
  const isValidHash = useMemo(() => {
    const calculatedHash = md.sha256
      .create()
      .update(util.decode64(proof.signature))
      .digest()
      .toHex();
    return (
      without0x(calculatedHash.toLowerCase()) ===
      without0x(proof.signatureHash.toLowerCase())
    );
  }, [proof.signatureHash, proof.signature]);

  const isValidSignature = useMemo(() => {
    const publicKey = certificate.publicKey as pki.rsa.PublicKey;
    return publicKey.verify(
      util.hexToBytes(without0x(proof.hash)),
      util.decode64(proof.signature)
    );
  }, [certificate, proof.signature, proof.signatureHash]);

  const NOM151CertificateCallback = useCallback(async () => {
    if (!proof.signatureHash || !proof.conservation.nom151) return;
    const nom151 = await getNOM151CertificateAsn1(
      proof.signatureHash,
      proof.conservation.nom151.provider
    );
    setNOM151CertificateASN1(nom151);
  }, [proof.signatureHash, proof.conservation.nom151]);

  useEffect(() => {
    NOM151CertificateCallback();
  }, [NOM151CertificateCallback]);

  const decodedOCSP = useMemo(() => {
    const rawResponse = Buffer.from(proof.ocspResponse, "base64");

    const ocspResponse = OCSPResponse.fromBER(rawResponse);

    if (!ocspResponse.responseBytes) return;

    const basicOCSPResponse = BasicOCSPResponse.fromBER(
      ocspResponse.responseBytes.response.valueBlock.valueHexView
    );

    const responses: SingleResponse[] =
      basicOCSPResponse.tbsResponseData.responses;

    return responses[0];
  }, [proof.ocspResponse]);

  const decodedOCSPCertStatus = useMemo(
    () => simpleCertStatusDecode(decodedOCSP?.certStatus.valueBeforeDecodeView),
    [decodedOCSP]
  );

  return (
    <Card className="my-2">
      <CardHeader>
        <CardTitle>Pericial de Firma Electrónica Avanzada</CardTitle>
        <CardDescription>
          En conformidad con el Artículo 97 del Código de Comercio se desglosan
          los elementos necesarios para cumplir con los requisitos de una firma
          electrónica avanzada
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex align-center">
          <p className="text-xl text-muted-foreground">
            {
              certificate.subject.getField({
                name: "commonName",
              }).value
            }
          </p>
          <Button
            className="ml-auto"
            variant="outline"
            size="sm"
            onClick={async () => {
              downloadFile(
                proof.certificate,
                "application/x-x509-user-cert",
                `${
                  certificate.subject.getField({
                    type: "2.5.4.45",
                  }).value
                }.cer`
              );
            }}
          >
            Certificado (.cer)
            <DownloadIcon className="ml-2" size="12" />
          </Button>
        </div>
        <p className="text-sm">
          {
            certificate.subject.getField({
              type: "2.5.4.45",
            }).value
          }
        </p>
      </CardContent>
      <Separator />
      <CardContent className="flex justify-between items-center py-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex items-center">
              <p className="text-lg font-semibold tracking-tight my-auto">
                Integridad de firma verificada
              </p>
              <InfoIcon className="ml-2 w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">
                El digestivo de la firma electrónica coincide con el digestivo
                reportado en la prueba. Esto garantiza que su conservación es
                llevada a cabo de manera correcta.
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
      <CardContent className="mt-3">
        <p className="text-md font-semibold tracking-tight mb-1">Firma</p>
        <Textarea
          className="w-full resize-none"
          placeholder={proof.signature}
          readOnly
          rows={5}
        />
      </CardContent>
      <Separator />
      <CardContent className="flex justify-between items-center py-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex items-center">
              <div>
                <div className="flex items-center">
                  <p className="text-lg font-semibold tracking-tight my-auto">
                    Verificación de la firma
                  </p>
                  <InfoIcon className="ml-2 w-4 h-4" />
                </div>
                <p className="text-sm text-muted-foreground">
                  En conjunto con el certificado, garantizan la identidad del
                  firmante
                </p>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">
                La firma electrónica es válida y e implica que la llave privada
                se utilizó para firmar el digestivo del documento en la prueba.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {isValidSignature ? (
          <Check className="h-7 w-7 text-green-500" />
        ) : (
          <X className="h-7 w-7 text-red-500" />
        )}
      </CardContent>
      <Separator />
      <CardContent className="mt-3">
        <p className="text-md font-semibold tracking-tight mb-1">
          Verificación del Certificado por OCSP
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          El protocolo OCSP es un mecanismo que verifica si el certificado no ha
          sido revocado. La respuesta es firmada por el emisor del certificado y
          contiene el estado actual del certificado (e.g. SAT). Así se garantiza
          el no repudio de la firma.
        </p>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="base64">Base64</TabsTrigger>
            <TabsTrigger value="status">Estado de Verificación</TabsTrigger>
            <TabsTrigger value="decoded">Decodificado</TabsTrigger>
          </TabsList>
          <TabsContent value="base64">
            <Textarea
              className="w-full resize-none"
              placeholder={proof.ocspResponse}
              readOnly
              rows={30}
            />
          </TabsContent>
          <TabsContent value="status">
            <Card className="p-4">
              <JsonView src={decodedOCSPCertStatus} />
            </Card>
          </TabsContent>
          <TabsContent value="decoded">
            <Card className="p-4">
              <JsonView src={decodedOCSP} />
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardContent>
        <Conservation
          proof={proof}
          NOM151CertificateASN1={NOM151CertificateASN1}
        />
      </CardContent>
    </Card>
  );
};

export default Signature;
