export interface Env {
  ADS_BUCKET: R2Bucket;
}

export default {
  async fetch(_request: Request, _env: Env): Promise<Response> {
    return new Response("OK");
  },
};
