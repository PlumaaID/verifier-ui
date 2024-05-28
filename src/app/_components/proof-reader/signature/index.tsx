import { DownloadIcon } from "lucide-react";
import { util, asn1, pki } from "node-forge";
import { FC, useMemo } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { downloadFile } from "~/lib/files";
import { SignatureProof } from "~/types";

interface Props {
  proof: SignatureProof;
}

const Signature: FC<Props> = ({ proof }) => {
  const certificate = useMemo(() => {
    return pki.certificateFromPem(util.decode64(proof.certificate));
  }, [proof.certificate]);

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
      <CardContent>
        <p className="text-md font-semibold tracking-tight mb-1">Firma</p>
        <Textarea
          className="w-full resize-none"
          placeholder={proof.signature}
          readOnly
        />
      </CardContent>
      <CardContent>
        <p className="text-md font-semibold tracking-tight mb-1">
          Verificación del Certificado por OCSP
        </p>
        <Textarea
          className="w-full resize-none"
          placeholder={proof.ocspResponse}
          readOnly
        />
      </CardContent>
    </Card>
  );
};

export default Signature;
