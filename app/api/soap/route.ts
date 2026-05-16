import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import soap from 'node-soap';
import { createClient } from '@/lib/supabase/server';
import { buildSoapServiceObject } from '@/lib/services/StudyHubSoapService';

const wsdlPath = path.join(process.cwd(), 'public', 'studyhub.wsdl');

/**
 * GET /api/soap  →  devuelve el WSDL (para clientes que lo soliciten)
 */
export async function GET() {
  try {
    const wsdl = fs.readFileSync(wsdlPath, 'utf-8');
    return new NextResponse(wsdl, {
      status: 200,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  } catch {
    return NextResponse.json({ error: 'WSDL no disponible' }, { status: 500 });
  }
}

/**
 * POST /api/soap  →  procesa un envelope SOAP 1.1
 *
 * El cliente envía un envelope XML; este handler lo parsea con node-soap,
 * ejecuta la operación correspondiente usando los modelos de negocio y
 * devuelve la respuesta como XML SOAP.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const wsdl = fs.readFileSync(wsdlPath, 'utf-8');
    const supabase = await createClient();
    const serviceObject = buildSoapServiceObject(supabase);

    const responseXml = await new Promise<string>((resolve, reject) => {
      soap.listen(
        { on: () => {} } as never,
        { path: '/api/soap', services: serviceObject, xml: wsdl },
        serviceObject,
        wsdl,
        (err: Error | null, server: soap.Server) => {
          if (err) { reject(err); return; }

          server.handleRequest(
            {
              method: 'POST',
              headers: Object.fromEntries(req.headers.entries()),
              body,
              url: '/api/soap',
            } as never,
            (xml: string) => resolve(xml),
            (e: Error) => reject(e),
          );
        },
      );
    });

    return new NextResponse(responseXml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  } catch (e) {
    const fault = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>soap:Server</faultcode>
      <faultstring>${(e as Error).message}</faultstring>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;
    return new NextResponse(fault, {
      status: 500,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  }
}
