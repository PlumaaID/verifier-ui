"use client";
import { useCallback, useEffect, useState } from "react";
import { Dropzone } from "~/components/dropzone";
import { isSignatureProof, isSignatureRequestProof } from "~/types";
import SignatureRequest from "./signature-request";
import Signature from "./signature";

const ProofReader = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [proof, setProof] = useState<any | null>(null);

  const proofCallback = useCallback(async () => {
    if (files.length === 0) return null;
    const [file] = files;
    const arrayBuffer = await file.arrayBuffer();
    setProof(JSON.parse(Buffer.from(arrayBuffer).toString("latin1")));
  }, [files]);

  useEffect(() => {
    proofCallback();
  }, [proofCallback]);

  if (proof) {
    let content;
    if (isSignatureRequestProof(proof))
      content = <SignatureRequest proof={proof} />;
    else if (isSignatureProof(proof)) content = <Signature proof={proof} />;

    return (
      <div>
        <h1 className="font-bold tracking-tight text-3xl">
          Resultado de la verificación
        </h1>
        {content}
      </div>
    );
  }

  return (
    <>
      <h1 className="font-bold tracking-tight text-3xl">
        Verificador electrónico
      </h1>
      <p className="mt-3">
        Esta aplicación permite verificar las propiedades informáticas de
        documentos electrónicos que han sido producidos con tecnología de firma
        electrónica de{" "}
        <a
          href="https://plumaa.id"
          className="font-medium text-primary underline underline-offset-4"
        >
          Plumaa ID.
        </a>
      </p>
      <p className="mt-3">
        Esta aplicación es de código abierto, por lo que los formatos utilizados
        son públicos y pueden ser verificados por cualquier persona. Estos
        formatos rigen cómo se presenta una prueba pericial de un documento
        electrónico, y con el uso de esta herramienta es posible identificar su{" "}
        <strong>autenticidad</strong>, <strong>integridad</strong> y{" "}
        <strong>validez</strong> de forma rápida y sencilla.
      </p>
      <p className="mt-3">
        Arrastra una prueba en formato JSON generada por Plumaa ID para
        verificarla.
      </p>
      <Dropzone
        onChange={setFiles}
        className="w-full py-[140px] mt-6"
        accept="application/json"
        cta="Arrastra aquí una prueba .json"
      />
    </>
  );
};

export default ProofReader;
