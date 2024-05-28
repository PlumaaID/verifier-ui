import { AxiosResponse } from "axios";
import ocsp from "ocsp";

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
